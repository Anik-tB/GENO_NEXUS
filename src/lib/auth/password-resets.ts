import { createHash, randomBytes } from "node:crypto";
import { assertDatabase } from "@/lib/db";

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string) {
  const db = assertDatabase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.query(
    `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1
        AND consumed_at IS NULL
    `,
    [userId]
  );

  await db.query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt]
  );

  return {
    token,
    expiresAt
  };
}

export async function consumePasswordResetToken(token: string, passwordHash: string) {
  const db = assertDatabase();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query<{ user_id: string }>(
      `
        SELECT user_id
        FROM password_reset_tokens
        WHERE token_hash = $1
          AND consumed_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
      `,
      [hashResetToken(token)]
    );

    const tokenRow = tokenResult.rows[0];

    if (!tokenRow) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `
        UPDATE users
        SET password_hash = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [tokenRow.user_id, passwordHash]
    );

    await client.query(
      `
        UPDATE password_reset_tokens
        SET consumed_at = NOW()
        WHERE token_hash = $1
      `,
      [hashResetToken(token)]
    );

    await client.query("DELETE FROM sessions WHERE user_id = $1", [tokenRow.user_id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
