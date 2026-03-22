import { createHash, randomBytes } from "node:crypto";
import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";
import { env } from "@/lib/env";
import type { AuthUser } from "@/lib/auth/users";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  remember = false,
  executor: DatabaseQueryExecutor = assertDatabase()
) {
  const client = executor;
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const days = remember ? 30 : 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await client.query(
    `
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt]
  );

  return {
    token,
    expiresAt
  };
}

export async function deleteSession(token: string) {
  const client = assertDatabase();
  await client.query("DELETE FROM sessions WHERE token_hash = $1", [hashSessionToken(token)]);
}

export async function getUserFromSessionToken(token: string): Promise<AuthUser | null> {
  const client = assertDatabase();
  const result = await client.query(
    `
      SELECT
        users.id,
        users.first_name,
        users.last_name,
        users.email,
        users.account_category,
        users.password_hash,
        users.github_id,
        users.google_id,
        users.firebase_uid
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
    `,
    [hashSessionToken(token)]
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    id: result.rows[0].id,
    firstName: result.rows[0].first_name,
    lastName: result.rows[0].last_name,
    email: result.rows[0].email,
    accountCategory: result.rows[0].account_category,
    passwordHash: result.rows[0].password_hash,
    githubId: result.rows[0].github_id,
    googleId: result.rows[0].google_id,
    firebaseUid: result.rows[0].firebase_uid
  };
}

export function buildSessionCookie(token: string, expiresAt: Date) {
  return {
    name: env.sessionCookieName,
    value: token,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt
  };
}
