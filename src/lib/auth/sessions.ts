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
  executor: DatabaseQueryExecutor = assertDatabase(),
  options: { ipAddress?: string; userAgent?: string; isTrusted?: boolean } = {}
) {
  const client = executor;
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const days = remember ? 30 : 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const { ipAddress = null, userAgent = null, isTrusted = false } = options;

  await client.query(
    `
      INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent, is_trusted)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [userId, tokenHash, expiresAt, ipAddress, userAgent, isTrusted]
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
  const tokenHash = hashSessionToken(token);
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
        users.firebase_uid,
        users.account_locked_until,
        users.failed_login_count,
        users.bio,
        users.job_title,
        users.avatar_url,
        users.phone,
        users.organization,
        users.created_at,
        users.last_login_at
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  if (!result.rows[0]) {
    return null;
  }

  // Refresh last_seen_at without blocking the response
  client.query(
    "UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = $1",
    [tokenHash]
  ).catch(() => {});

  const row = result.rows[0];
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    accountCategory: row.account_category,
    passwordHash: row.password_hash,
    githubId: row.github_id,
    googleId: row.google_id,
    firebaseUid: row.firebase_uid,
    accountLockedUntil: row.account_locked_until
      ? new Date(row.account_locked_until)
      : null,
    failedLoginCount: row.failed_login_count ?? 0,
    bio: row.bio ?? null,
    jobTitle: row.job_title ?? null,
    avatarUrl: row.avatar_url ?? null,
    phone: row.phone ?? null,
    organization: row.organization ?? null,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
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
