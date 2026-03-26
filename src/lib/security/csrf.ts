import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";
import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";

/**
 * Generate a CSRF token for form submissions
 */
export async function generateCsrfToken(
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await executor.query(
    `
    INSERT INTO csrf_tokens (token_hash, expires_at, used)
    VALUES ($1, $2, false)
    `,
    [tokenHash, expiresAt],
  );

  return token;
}

/**
 * Verify and consume a CSRF token
 */
export async function verifyCsrfToken(
  token: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const result = await executor.query(
    `
    SELECT used, expires_at FROM csrf_tokens
    WHERE token_hash = $1
    `,
    [tokenHash],
  );

  if (!result.rows[0]) {
    return false; // Token doesn't exist
  }

  const { used, expires_at } = result.rows[0];

  // Check if token is expired
  if (new Date(expires_at) < new Date()) {
    return false;
  }

  // Check if token was already used
  if (used) {
    return false;
  }

  // Mark token as used (one-time use)
  await executor.query(
    `UPDATE csrf_tokens SET used = true WHERE token_hash = $1`,
    [tokenHash],
  );

  return true;
}

/**
 * Clean up expired CSRF tokens (run periodically)
 */
export async function cleanupExpiredCsrfTokens(
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<number> {
  const result = await executor.query(
    `
    DELETE FROM csrf_tokens
    WHERE expires_at < NOW()
    `,
  );

  return result.rowCount || 0;
}
