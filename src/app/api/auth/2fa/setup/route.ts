import { NextRequest, NextResponse } from "next/server";
import {
  generateTwoFactorSecret,
  enableTwoFactor,
} from "@/lib/security/two-factor";
import { findUserByEmail } from "@/lib/auth/users";
import { logAuditEvent } from "@/lib/security/audit";
import { getOrCreateRequestId, createErrorResponse } from "@/lib/error/handler";
import { handleDatabaseError } from "@/lib/error/service-errors";
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
} from "@/lib/error/errors";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
  );
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * GET: Generate 2FA secret and QR code
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const email = request.nextUrl.searchParams.get("email");
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  if (!email) {
    await logAuditEvent(
      null,
      "suspicious_activity",
      { reason: "2fa_setup_missing_email", requestId },
      ipAddress,
      userAgent,
    );
    return NextResponse.json(
      createErrorResponse(new ValidationError("Email is required"), requestId),
      { status: 400 },
    );
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      await logAuditEvent(
        null,
        "suspicious_activity",
        { reason: "2fa_setup_user_not_found", requestId },
        ipAddress,
        userAgent,
      );
      return NextResponse.json(
        createErrorResponse(new NotFoundError("User not found"), requestId),
        { status: 404 },
      );
    }

    const { secret, qrCode } = await generateTwoFactorSecret(user.id);

    return NextResponse.json({ secret, qrCode });
  } catch (error) {
    // Handle database errors
    if (error instanceof Error && error.message.includes("database")) {
      const dbError = handleDatabaseError(error);
      console.error(`[${requestId}] 2FA setup database error:`, error);
      await logAuditEvent(
        null,
        "suspicious_activity",
        { reason: "2fa_setup_database_error", requestId },
        ipAddress,
        userAgent,
      );
      return NextResponse.json(createErrorResponse(dbError, requestId), {
        status: 503,
      });
    }

    console.error(`[${requestId}] 2FA setup error:`, error);
    await logAuditEvent(
      null,
      "suspicious_activity",
      { reason: "2fa_setup_error", requestId },
      ipAddress,
      userAgent,
    );
    return NextResponse.json(
      createErrorResponse(
        new Error("Failed to generate 2FA secret"),
        requestId,
      ),
      { status: 500 },
    );
  }
}

/**
 * POST: Enable 2FA with verified token
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const body = await request.json();
  const { email, secret, token } = body;
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  if (!email || !secret || !token) {
    await logAuditEvent(
      null,
      "suspicious_activity",
      { reason: "2fa_setup_missing_fields", requestId },
      ipAddress,
      userAgent,
    );
    return NextResponse.json(
      createErrorResponse(
        new ValidationError("Email, secret, and token are required"),
        requestId,
      ),
      { status: 400 },
    );
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      await logAuditEvent(
        null,
        "suspicious_activity",
        { reason: "2fa_setup_user_not_found", requestId },
        ipAddress,
        userAgent,
      );
      return NextResponse.json(
        createErrorResponse(new NotFoundError("User not found"), requestId),
        { status: 404 },
      );
    }

    // Verify the token is correct before enabling
    const { authenticator } = await import("otplib");
    const isValid = authenticator.check(token, secret);

    if (!isValid) {
      await logAuditEvent(
        user.id,
        "suspicious_activity",
        { reason: "2fa_invalid_verification", requestId },
        ipAddress,
        userAgent,
      );
      return NextResponse.json(
        createErrorResponse(
          new AuthenticationError("Invalid verification code"),
          requestId,
        ),
        { status: 401 },
      );
    }

    const backupCodes = await enableTwoFactor(user.id, secret);
    await logAuditEvent(
      user.id,
      "2fa_enabled",
      { method: "authenticator", requestId },
      ipAddress,
      userAgent,
    );

    return NextResponse.json({
      success: true,
      backupCodes,
      message:
        "2FA enabled successfully. Save your backup codes in a safe place.",
    });
  } catch (error) {
    // Handle database errors
    if (error instanceof Error && error.message.includes("database")) {
      const dbError = handleDatabaseError(error);
      console.error(`[${requestId}] 2FA enable database error:`, error);
      await logAuditEvent(
        null,
        "suspicious_activity",
        { reason: "2fa_enable_database_error", requestId },
        ipAddress,
        userAgent,
      );
      return NextResponse.json(createErrorResponse(dbError, requestId), {
        status: 503,
      });
    }

    console.error(`[${requestId}] 2FA enable error:`, error);
    await logAuditEvent(
      null,
      "suspicious_activity",
      { reason: "2fa_enable_error", requestId },
      ipAddress,
      userAgent,
    );
    return NextResponse.json(
      createErrorResponse(new Error("Failed to enable 2FA"), requestId),
      { status: 500 },
    );
  }
}
