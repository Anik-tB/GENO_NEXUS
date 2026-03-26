import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";

export type AuditEventType =
  | "login_success"
  | "login_failed"
  | "register_success"
  | "register_failed"
  | "logout"
  | "logout_success"
  | "logout_partial"
  | "logout_failed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_reset_success"
  | "password_reset_failed"
  | "password_reset_email_failed"
  | "password_reset_attempted"
  | "email_verified"
  | "email_verified_success"
  | "email_verification_failed"
  | "2fa_enabled"
  | "2fa_disabled"
  | "session_expired"
  | "suspicious_activity"
  | "account_locked";

export async function logAuditEvent(
  userId: string | null,
  eventType: AuditEventType,
  details: Record<string, unknown>,
  ipAddress: string,
  userAgent: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<void> {
  await executor.query(
    `
    INSERT INTO audit_logs (user_id, event_type, details, ip_address, user_agent, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    `,
    [userId, eventType, JSON.stringify(details), ipAddress, userAgent],
  );
}

/**
 * Get audit logs for a user (for compliance/review)
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  executor: DatabaseQueryExecutor = assertDatabase(),
) {
  const result = await executor.query(
    `
    SELECT id, event_type, details, ip_address, user_agent, created_at
    FROM audit_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [userId, limit],
  );

  return result.rows;
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  userId: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<{ suspicious: boolean; reason?: string }> {
  // Check for multiple failed login attempts in short time
  const failedLogins = await executor.query(
    `
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE user_id = $1
      AND event_type = 'login_failed'
      AND created_at > NOW() - INTERVAL '30 minutes'
    `,
    [userId],
  );

  const failedCount = parseInt(failedLogins.rows[0]?.count || "0");
  if (failedCount >= 5) {
    return { suspicious: true, reason: "Multiple failed login attempts" };
  }

  // Check for impossible travel (login from different IPs in short time)
  const recentLogins = await executor.query(
    `
    SELECT DISTINCT ip_address, created_at
    FROM audit_logs
    WHERE user_id = $1
      AND event_type = 'login_success'
      AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC
    LIMIT 2
    `,
    [userId],
  );

  if (recentLogins.rows.length >= 2) {
    const [first, second] = recentLogins.rows;
    if (first.ip_address !== second.ip_address) {
      const timeDiff =
        (new Date(first.created_at).getTime() -
          new Date(second.created_at).getTime()) /
        1000 /
        60; // minutes
      if (timeDiff < 30) {
        return { suspicious: true, reason: "Impossible travel detected" };
      }
    }
  }

  return { suspicious: false };
}
