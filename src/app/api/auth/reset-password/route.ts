import { NextRequest, NextResponse } from "next/server";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/auth/password-resets";
import { hashPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/auth/users";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { env } from "@/lib/env";
import {
  completePasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { getOrCreateRequestId, redirectWithError } from "@/lib/error/handler";
import { handleDatabaseError } from "@/lib/error/service-errors";
import { logAuditEvent } from "@/lib/security/audit";
import { ValidationError } from "@/lib/error/errors";

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
  const token = formData.get("token");
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  if (typeof token === "string" && token.length > 0) {
    const parsed = completePasswordResetSchema.safeParse({
      token,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      await logAuditEvent(
        null,
        "password_reset_failed",
        { reason: "validation_error", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        `/reset-password?token=${encodeURIComponent(token)}`,
        new ValidationError("Password must be at least 8 characters"),
        { requestId },
      );
    }

    try {
      const passwordHash = await hashPassword(parsed.data.password);
      const didReset = await consumePasswordResetToken(
        parsed.data.token,
        passwordHash,
      );

      if (!didReset) {
        await logAuditEvent(
          null,
          "password_reset_failed",
          { reason: "invalid_token", requestId },
          ipAddress,
          userAgent,
        );
        return redirectWithError(
          request.url,
          `/reset-password?token=${encodeURIComponent(token)}`,
          new Error("Password reset link is invalid or expired"),
          { requestId },
        );
      }

      await logAuditEvent(
        null,
        "password_reset_success",
        { requestId },
        ipAddress,
        userAgent,
      );

      return NextResponse.redirect(
        new URL("/login?status=password_reset", request.url),
      );
    } catch (error) {
      // Handle database errors
      const safeError =
        error instanceof Error
          ? handleDatabaseError(error)
          : new Error("Password reset failed");
      console.error(`[${requestId}] Password reset error:`, error);
      await logAuditEvent(
        null,
        "password_reset_failed",
        { reason: "server_error", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        `/reset-password?token=${encodeURIComponent(token)}`,
        safeError,
        { requestId },
      );
    }
  }

  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    await logAuditEvent(
      null,
      "password_reset_failed",
      { reason: "validation_error", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/reset-password",
      new ValidationError("Please enter a valid email address"),
      { requestId },
    );
  }

  try {
    const user = await findUserByEmail(parsed.data.email);

    if (user) {
      try {
        const reset = await createPasswordResetToken(user.id);
        await sendPasswordResetEmail(user.email, reset.token);

        if (!env.isProduction) {
          const resetUrl = new URL(
            `/reset-password?token=${encodeURIComponent(reset.token)}`,
            env.appUrl,
          );
          console.info(
            `[${requestId}] Password reset URL for ${user.email}: ${resetUrl.toString()}`,
          );
        }

        await logAuditEvent(
          user.id,
          "password_reset_requested",
          { requestId },
          ipAddress,
          userAgent,
        );
      } catch (sendError) {
        // Still redirect to success page to prevent email enumeration
        console.error(`[${requestId}] Password reset email error:`, sendError);
        await logAuditEvent(
          user.id,
          "password_reset_email_failed",
          { reason: "email_service", requestId },
          ipAddress,
          userAgent,
        );
      }
    } else {
      // Don't reveal that email doesn't exist (account enumeration prevention)
      await logAuditEvent(
        null,
        "password_reset_attempted",
        { reason: "email_not_found", email: parsed.data.email, requestId },
        ipAddress,
        userAgent,
      );
    }

    // Always return success to prevent account enumeration
    return NextResponse.redirect(
      new URL("/reset-password?status=sent", request.url),
    );
  } catch (error) {
    // Handle database errors
    if (error instanceof Error && error.message.includes("database")) {
      const dbError = handleDatabaseError(error);
      console.error(`[${requestId}] Password reset request error:`, error);
      await logAuditEvent(
        null,
        "password_reset_failed",
        { reason: "database_error", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(request.url, "/reset-password", dbError, {
        requestId,
      });
    }

    console.error(`[${requestId}] Password reset request error:`, error);
    await logAuditEvent(
      null,
      "password_reset_failed",
      { reason: "server_error", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/reset-password",
      new Error("Password reset service is temporarily unavailable"),
      { requestId },
    );
  }
}
