import { createHash } from "node:crypto";
import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // milliseconds
}

const LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

const REGISTER_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Check if an identifier (email, IP) has exceeded the rate limit
 */
export async function checkRateLimit(
  identifier: string,
  type: "login" | "register" | "password_reset" = "login",
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: Date }> {
  const config =
    type === "login"
      ? LOGIN_RATE_LIMIT
      : type === "register"
        ? REGISTER_RATE_LIMIT
        : PASSWORD_RESET_RATE_LIMIT;

  const identifierHash = createHash("sha256").update(identifier).digest("hex");
  const windowStart = new Date(Date.now() - config.windowMs);

  // Get attempts in current window
  const result = await executor.query(
    `
    SELECT COUNT(*) as attempt_count, MAX(created_at) as latest_attempt
    FROM rate_limit_attempts
    WHERE identifier_hash = $1
      AND attempt_type = $2
      AND created_at > $3
    `,
    [identifierHash, type, windowStart],
  );

  const attemptCount = parseInt(result.rows[0]?.attempt_count || "0");
  const latestAttempt = result.rows[0]?.latest_attempt
    ? new Date(result.rows[0].latest_attempt)
    : null;
  const resetTime = latestAttempt
    ? new Date(latestAttempt.getTime() + config.windowMs)
    : new Date(Date.now() + config.windowMs);

  return {
    allowed: attemptCount < config.maxAttempts,
    remainingAttempts: Math.max(0, config.maxAttempts - attemptCount),
    resetTime,
  };
}

/**
 * Record an attempt for rate limiting
 */
export async function recordAttempt(
  identifier: string,
  type: "login" | "register" | "password_reset" = "login",
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<void> {
  const identifierHash = createHash("sha256").update(identifier).digest("hex");

  await executor.query(
    `
    INSERT INTO rate_limit_attempts (identifier_hash, attempt_type, created_at)
    VALUES ($1, $2, NOW())
    `,
    [identifierHash, type],
  );
}

/**
 * Clear attempts for an identifier (called after successful auth or password reset)
 */
export async function clearRateLimitAttempts(
  identifier: string,
  type: "login" | "register" | "password_reset" = "login",
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<void> {
  const identifierHash = createHash("sha256").update(identifier).digest("hex");

  await executor.query(
    `
    DELETE FROM rate_limit_attempts
    WHERE identifier_hash = $1 AND attempt_type = $2
    `,
    [identifierHash, type],
  );
}
