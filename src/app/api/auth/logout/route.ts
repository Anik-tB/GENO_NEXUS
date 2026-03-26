import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { getOrCreateRequestId } from "@/lib/error/handler";
import { logAuditEvent } from "@/lib/security/audit";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
  );
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

// Helper to get user ID from session token
async function getUserIdFromSession(
  sessionToken: string,
): Promise<string | null> {
  try {
    const db = await import("@/lib/db").then((m) => m.assertDatabase());
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
    const result = await db.query(
      "SELECT user_id FROM sessions WHERE token_hash = $1",
      [tokenHash],
    );
    return result.rows[0]?.user_id || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const sessionToken = request.cookies.get(env.sessionCookieName)?.value;
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  let userId: string | null = null;

  if (sessionToken) {
    try {
      userId = await getUserIdFromSession(sessionToken);
      if (!userId) {
        throw new Error("Failed to retrieve user ID from session");
      }
      await deleteSession(sessionToken);
    } catch (error) {
      // Log the error but still clear the cookie
      console.error(`[${requestId}] Logout error:`, error);
      // Log audit event only if we have a valid userId
      if (userId) {
        await logAuditEvent(
          userId,
          "logout_partial",
          { reason: "session_delete_failed", requestId },
          ipAddress,
          userAgent,
        );
      } else {
        await logAuditEvent(
          null,
          "logout_failed",
          { reason: "invalid_session", requestId },
          ipAddress,
          userAgent,
        );
      }
    }
  }

  if (userId) {
    await logAuditEvent(
      userId,
      "logout_success",
      { requestId },
      ipAddress,
      userAgent,
    );
  }

  const response = NextResponse.redirect(
    new URL("/login?status=signed_out", request.url),
  );
  response.cookies.set({
    name: env.sessionCookieName,
    value: "",
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
