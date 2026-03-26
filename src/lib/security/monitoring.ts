import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";

export interface SecurityAlert {
  type:
    | "brute_force_attempt"
    | "impossible_travel"
    | "unusual_location"
    | "suspicious_device"
    | "account_takeover_risk";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  userId: string;
  details: Record<string, unknown>;
}

/**
 * Monitor for brute force attacks
 */
export async function checkBruteForceAttempts(
  userId: string,
  timeWindowMinutes: number = 30,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<{ isAtRisk: boolean; attemptCount: number }> {
  const result = await executor.query(
    `
    SELECT COUNT(*) as attempt_count
    FROM audit_logs
    WHERE user_id = $1
      AND event_type = 'login_failed'
      AND created_at > NOW() - INTERVAL '1 minute' * $2
    `,
    [userId, timeWindowMinutes],
  );

  const attemptCount = parseInt(result.rows[0]?.attempt_count || "0");
  return {
    isAtRisk: attemptCount >= 5,
    attemptCount,
  };
}

/**
 * Monitor for impossible travel (user in different locations in too short time)
 */
export async function checkImpossibleTravel(
  userId: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<{ isAtRisk: boolean; reason?: string }> {
  const result = await executor.query(
    `
    SELECT DISTINCT ip_address, created_at
    FROM audit_logs
    WHERE user_id = $1
      AND event_type = 'login_success'
      AND created_at > NOW() - INTERVAL '2 hours'
    ORDER BY created_at DESC
    LIMIT 2
    `,
    [userId],
  );

  if (result.rows.length < 2) {
    return { isAtRisk: false };
  }

  const [first, second] = result.rows;
  if (first.ip_address === second.ip_address) {
    return { isAtRisk: false };
  }

  const timeDiffSeconds =
    (new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime()) /
    1000;
  const timeDiffMinutes = timeDiffSeconds / 60;

  // If different IPs in less than 30 minutes, it's impossible travel
  if (timeDiffMinutes < 30) {
    return {
      isAtRisk: true,
      reason: `Login from ${first.ip_address} and ${second.ip_address} within ${Math.round(timeDiffMinutes)} minutes`,
    };
  }

  return { isAtRisk: false };
}

/**
 * Detect unusual login activity
 */
export async function checkUnusualActivity(
  userId: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];

  // Check for multiple simultaneous sessions from different locations
  const sessionResult = await executor.query(
    `
    SELECT COUNT(DISTINCT ip_address) as ip_count
    FROM sessions s
    WHERE s.user_id = $1
      AND s.expires_at > NOW()
    `,
    [userId],
  );

  if (sessionResult.rows[0]?.ip_count > 2) {
    alerts.push({
      type: "suspicious_device",
      severity: "medium",
      message: `Multiple simultaneous sessions from ${sessionResult.rows[0].ip_count} different IP addresses detected`,
      userId,
      details: { ipCount: sessionResult.rows[0].ip_count },
    });
  }

  // Check for login outside usual times
  const timeResult = await executor.query(
    `
    SELECT EXTRACT(HOUR FROM created_at) as hour
    FROM audit_logs
    WHERE user_id = $1
      AND event_type = 'login_success'
      AND created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 10
    `,
    [userId],
  );

  const recentHours = timeResult.rows
    .map((r) => parseInt(r.hour))
    .filter((h) => h !== null);
  if (recentHours.length > 0) {
    const currentHour = new Date().getHours();
    const isUnusualTime = !recentHours.includes(currentHour);

    if (
      isUnusualTime &&
      Math.min(...recentHours) > 6 &&
      Math.max(...recentHours) < 22
    ) {
      // Logins usually between 6 AM and 10 PM, but current login is outside
      alerts.push({
        type: "unusual_location",
        severity: "low",
        message: "Login at an unusual time for this account",
        userId,
        details: { currentHour, typicalHours: recentHours },
      });
    }
  }

  return alerts;
}

/**
 * Create a security alert log
 */
export async function createSecurityAlert(
  alert: SecurityAlert,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<void> {
  await executor.query(
    `
    INSERT INTO security_alerts (user_id, alert_type, severity, message, details, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    `,
    [
      alert.userId,
      alert.type,
      alert.severity,
      alert.message,
      JSON.stringify(alert.details),
    ],
  );
}

/**
 * Get recent security alerts for a user
 */
export async function getUserSecurityAlerts(
  userId: string,
  limit: number = 10,
  executor: DatabaseQueryExecutor = assertDatabase(),
) {
  const result = await executor.query(
    `
    SELECT id, alert_type, severity, message, details, created_at
    FROM security_alerts
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [userId, limit],
  );

  return result.rows;
}

/**
 * Health check for security monitoring systems
 */
export async function securitySystemHealthCheck(
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<{ healthy: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // Check if audit_logs table exists and has recent entries
    const auditResult = await executor.query(
      `SELECT COUNT(*) as count FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour'`,
    );

    if (parseInt(auditResult.rows[0]?.count || "0") === 0) {
      issues.push("No recent audit logs found");
    }

    // Check rate limit cleanup
    const rateLimitResult = await executor.query(
      `SELECT COUNT(*) as count FROM rate_limit_attempts WHERE created_at < NOW() - INTERVAL '24 hours'`,
    );

    const staleAttempts = parseInt(rateLimitResult.rows[0]?.count || "0");
    if (staleAttempts > 10000) {
      issues.push(
        `${staleAttempts} stale rate limit attempts should be cleaned up`,
      );
    }

    // Check CSRF token cleanup
    const csrfResult = await executor.query(
      `SELECT COUNT(*) as count FROM csrf_tokens WHERE expires_at < NOW()`,
    );

    const expiredTokens = parseInt(csrfResult.rows[0]?.count || "0");
    if (expiredTokens > 10000) {
      issues.push(`${expiredTokens} expired CSRF tokens should be cleaned up`);
    }
  } catch (error) {
    issues.push(`Health check error: ${String(error)}`);
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}
