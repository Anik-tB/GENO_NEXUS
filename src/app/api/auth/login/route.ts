import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/auth/users";
import { loginSchema } from "@/lib/validation/auth";
import {
  checkRateLimit,
  recordAttempt,
  clearRateLimitAttempts,
} from "@/lib/security/rate-limit";
import { logAuditEvent, detectSuspiciousActivity } from "@/lib/security/audit";
import { delayForTimingAttackResistance } from "@/lib/security/enumeration-prevention";
import { hasTwoFactorEnabled } from "@/lib/security/two-factor";
import { assertDatabase } from "@/lib/db";
import {
  getOrCreateRequestId,
  handleRouteError,
  redirectWithError,
} from "@/lib/error/handler";
import { handleDatabaseError } from "@/lib/error/service-errors";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
  );
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "true",
  });

  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const db = assertDatabase();

  if (!parsed.success) {
    await logAuditEvent(
      null,
      "login_failed",
      { reason: "validation_error", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/login",
      new Error("Invalid email or password format"),
      {
        requestId,
      },
    );
  }

  try {
    // Check rate limiting
    const rateLimit = await checkRateLimit(parsed.data.email, "login");
    if (!rateLimit.allowed) {
      await logAuditEvent(
        null,
        "login_failed",
        { reason: "rate_limit_exceeded", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/login",
        new Error("Too many login attempts"),
        {
          requestId,
          resetIn: Math.ceil(
            (rateLimit.resetTime.getTime() - Date.now()) / 1000,
          ).toString(),
        },
      );
    }

    // Add timing attack resistance
    await delayForTimingAttackResistance();

    const user = await findUserByEmail(parsed.data.email);

    if (!user) {
      await recordAttempt(parsed.data.email, "login");
      await logAuditEvent(
        null,
        "login_failed",
        { reason: "user_not_found", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/login",
        new Error("Invalid email or password"),
        {
          requestId,
        },
      );
    }

    // Check if account is locked
    if (
      user.accountLockedUntil &&
      new Date(user.accountLockedUntil) > new Date()
    ) {
      await logAuditEvent(
        user.id,
        "login_failed",
        { reason: "account_locked", requestId },
        ipAddress,
        userAgent,
      );
      const remainingMinutes = Math.ceil(
        (new Date(user.accountLockedUntil).getTime() - Date.now()) / 1000 / 60,
      );
      return redirectWithError(
        request.url,
        "/login",
        new Error(`Account locked. Try again in ${remainingMinutes} minutes.`),
        {
          requestId,
        },
      );
    }

    if (!user.passwordHash) {
      await recordAttempt(parsed.data.email, "login");
      await logAuditEvent(
        user.id,
        "login_failed",
        { reason: "social_account_only", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/login",
        new Error(
          "This account uses Google or GitHub sign-in. Use one of the provider buttons above.",
        ),
        {
          requestId,
        },
      );
    }

    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      await recordAttempt(parsed.data.email, "login");

      // Increment failed login count
      const newFailedCount = (user.failedLoginCount || 0) + 1;
      let lockUntil = null;
      if (newFailedCount >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await db.query(
        `UPDATE users SET failed_login_count = $1, account_locked_until = $2 WHERE id = $3`,
        [newFailedCount, lockUntil, user.id],
      );

      await logAuditEvent(
        user.id,
        "login_failed",
        { reason: "invalid_password", attempt: newFailedCount, requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/login",
        new Error("Invalid email or password"),
        {
          requestId,
        },
      );
    }

    // Check for suspicious activity
    const suspicious = await detectSuspiciousActivity(user.id);
    if (suspicious.suspicious) {
      await logAuditEvent(
        user.id,
        "suspicious_activity",
        { reason: suspicious.reason, requestId },
        ipAddress,
        userAgent,
      );
      // Still allow login but flag for review
    }

    // Reset failed login count
    await db.query(
      `UPDATE users SET failed_login_count = 0, account_locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
      [user.id],
    );

    // Clear rate limit attempts on successful login
    await clearRateLimitAttempts(parsed.data.email, "login");

    // Check if 2FA is enabled
    const has2fa = await hasTwoFactorEnabled(user.id);
    if (has2fa) {
      // Redirect to 2FA verification
      return redirectTo(
        request,
        `/auth/2fa/verify?email=${encodeURIComponent(parsed.data.email)}&requestId=${requestId}`,
      );
    }

    const session = await createSession(user.id, parsed.data.remember, assertDatabase(), {
      ipAddress,
      userAgent,
    });
    await logAuditEvent(
      user.id,
      "login_success",
      { remember: parsed.data.remember, requestId },
      ipAddress,
      userAgent,
    );

    const response = redirectTo(request, "/dashboard");
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    return response;
  } catch (error) {
    // Handle database errors specifically
    if (error instanceof Error && error.message.includes("database")) {
      const dbError = handleDatabaseError(error);
      await logAuditEvent(
        null,
        "login_failed",
        { reason: "database_error", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(request.url, "/login", dbError, { requestId });
    }

    // Log the actual error for monitoring
    console.error(`[${requestId}] Login error:`, error);
    await logAuditEvent(
      null,
      "login_failed",
      { reason: "server_error", requestId },
      ipAddress,
      userAgent,
    );

    return redirectWithError(
      request.url,
      "/login",
      new Error("Authentication service is temporarily unavailable"),
      { requestId },
    );
  }
}
