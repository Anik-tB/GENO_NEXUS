import { NextRequest, NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";
import { getOrCreateRequestId, redirectWithError } from "@/lib/error/handler";
import { logAuditEvent } from "@/lib/security/audit";
import { NotFoundError } from "@/lib/error/errors";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
  );
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  if (!token) {
    await logAuditEvent(
      null,
      "email_verification_failed",
      { reason: "missing_token", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/login",
      new NotFoundError("Verification token is required"),
      { requestId },
    );
  }

  const client = assertDatabase();

  try {
    // Check if token exists and is valid
    const result = await client.query(
      "SELECT user_id, expires_at FROM verification_tokens WHERE token = $1",
      [token],
    );

    if (result.rows.length === 0) {
      await logAuditEvent(
        null,
        "email_verification_failed",
        { reason: "token_not_found", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/login",
        new NotFoundError("Verification token is invalid"),
        { requestId },
      );
    }

    const { user_id: userId, expires_at: expiresAt } = result.rows[0];

    if (new Date() > new Date(expiresAt)) {
      await client.query("DELETE FROM verification_tokens WHERE token = $1", [
        token,
      ]);
      await logAuditEvent(
        userId,
        "email_verification_failed",
        { reason: "token_expired", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/login",
        new Error("Verification token has expired"),
        { requestId },
      );
    }

    // Update user to verified
    await client.query(
      "UPDATE users SET email_verified = NOW() WHERE id = $1",
      [userId],
    );

    // Cleanup token
    await client.query("DELETE FROM verification_tokens WHERE token = $1", [
      token,
    ]);

    await logAuditEvent(
      userId,
      "email_verified_success",
      { requestId },
      ipAddress,
      userAgent,
    );

    return NextResponse.redirect(
      new URL("/dashboard?verified=true", request.url),
    );
  } catch (error) {
    console.error(`[${requestId}] Verification failed:`, error);
    await logAuditEvent(
      null,
      "email_verification_failed",
      { reason: "server_error", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/login",
      new Error("Email verification service is temporarily unavailable"),
      { requestId },
    );
  }
}
