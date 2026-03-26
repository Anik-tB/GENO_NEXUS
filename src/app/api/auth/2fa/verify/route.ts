import { NextRequest, NextResponse } from "next/server";
import {
  verifyTwoFactorToken,
  useTwoFactorBackupCode,
} from "@/lib/security/two-factor";
import { findUserByEmail } from "@/lib/auth/users";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { logAuditEvent } from "@/lib/security/audit";
import { getOrCreateRequestId, redirectWithError } from "@/lib/error/handler";
import { handleDatabaseError } from "@/lib/error/service-errors";
import { ValidationError, AuthenticationError } from "@/lib/error/errors";

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
  const email = String(formData.get("email") || "");
  const token = String(formData.get("token") || "").replace(/\s/g, ""); // Remove spaces
  const remember = formData.get("remember") === "true";

  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  if (!email || !token) {
    await logAuditEvent(
      null,
      "login_failed",
      { reason: "2fa_validation_error", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/auth/2fa/verify",
      new ValidationError("Email and verification code are required"),
      {
        requestId,
      },
    );
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      await logAuditEvent(
        null,
        "login_failed",
        { reason: "2fa_user_not_found", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/login",
        new AuthenticationError("User not found"),
        {
          requestId,
        },
      );
    }

    // Try TOTP token first
    let isValid = await verifyTwoFactorToken(user.id, token);

    // If TOTP fails, try backup code
    if (!isValid && token.length === 10) {
      isValid = await useTwoFactorBackupCode(user.id, token);
    }

    if (!isValid) {
      await logAuditEvent(
        user.id,
        "login_failed",
        { reason: "2fa_invalid_token", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        `/auth/2fa/verify?email=${encodeURIComponent(email)}`,
        new AuthenticationError("Invalid verification code"),
        { requestId },
      );
    }

    const session = await createSession(user.id, remember, undefined, {
      ipAddress,
      userAgent,
    });

    await logAuditEvent(
      user.id,
      "login_success",
      { method: "2fa", remember, requestId },
      ipAddress,
      userAgent,
    );

    const response = redirectTo(request, "/dashboard");
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    return response;
  } catch (error) {
    // Handle database errors
    if (error instanceof Error && error.message.includes("database")) {
      const dbError = handleDatabaseError(error);
      await logAuditEvent(
        null,
        "login_failed",
        { reason: "2fa_database_error", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(request.url, "/login", dbError, { requestId });
    }

    // Log the actual error for monitoring
    console.error(`[${requestId}] 2FA verification error:`, error);
    await logAuditEvent(
      null,
      "login_failed",
      { reason: "2fa_server_error", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/login",
      new Error("2FA verification service is temporarily unavailable"),
      { requestId },
    );
  }
}
