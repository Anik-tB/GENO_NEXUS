import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { registerSchema } from "@/lib/validation/auth";
import { getRedirectPathForCategory } from "@/lib/auth/portal";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/email";
import { assertDatabase } from "@/lib/db";
import {
  checkRateLimit,
  recordAttempt,
  clearRateLimitAttempts,
} from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";
import { delayForTimingAttackResistance } from "@/lib/security/enumeration-prevention";
import { getOrCreateRequestId, redirectWithError } from "@/lib/error/handler";
import { handleDatabaseError } from "@/lib/error/service-errors";

function redirectTo(request: NextRequest, path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
  return NextResponse.redirect(new URL(path, baseUrl));
}

function splitFullName(fullName: string) {
  const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
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
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    accountCategory: formData.get("accountCategory"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    termsAccepted: formData.get("termsAccepted") === "true",
    medicalAcknowledged: formData.get("medicalAcknowledged") === "true",
  });

  if (!parsed.success) {
    await logAuditEvent(
      null,
      "register_failed",
      { reason: "validation_error", requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/register",
      new Error("Please fill in all required fields correctly"),
      {
        requestId,
      },
    );
  }

  try {
    // Check rate limiting
    const rateLimit = await checkRateLimit(parsed.data.email, "register");
    if (!rateLimit.allowed) {
      await logAuditEvent(
        null,
        "register_failed",
        { reason: "rate_limit_exceeded", email: parsed.data.email, requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/register",
        new Error("Too many registration attempts. Please try again later."),
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

    const existingUser = await findUserByEmail(parsed.data.email);

    if (existingUser) {
      await recordAttempt(parsed.data.email, "register");
      await logAuditEvent(
        existingUser.id,
        "register_failed",
        { reason: "email_exists", requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(
        request.url,
        "/register",
        new Error("This email is already registered"),
        {
          requestId,
        },
      );
    }

    const db = assertDatabase();
    const client = await db.connect();
    const { firstName, lastName } = splitFullName(parsed.data.fullName);

    try {
      await client.query("BEGIN");

      const user = await createUser(
        {
          firstName,
          lastName,
          email: parsed.data.email,
          accountCategory: parsed.data.accountCategory,
          passwordHash: await hashPassword(parsed.data.password),
        },
        client,
      );

      const session = await createSession(user.id, true, client, {
        ipAddress,
        userAgent,
      });

      const token = await generateVerificationToken(user.id, client);

      // Keep the signup atomic: if mail delivery fails, rollback the user/session/token creation.
      await sendVerificationEmail(user.email, token);
      await client.query("COMMIT");

      // Clear rate limit attempts on successful registration
      await clearRateLimitAttempts(parsed.data.email, "register");
      await logAuditEvent(
        user.id,
        "register_success",
        { accountCategory: parsed.data.accountCategory, requestId },
        ipAddress,
        userAgent,
      );

      const redirectPath = getRedirectPathForCategory(user.accountCategory);
      const response = redirectTo(request, redirectPath);
      response.cookies.set(
        buildSessionCookie(session.token, session.expiresAt),
      );
      return response;
    } catch (innerError) {
      await client.query("ROLLBACK");

      // Handle database-specific errors
      if (
        innerError instanceof Error &&
        innerError.message.includes(
          "Duplicate key value violates unique constraint",
        )
      ) {
        await logAuditEvent(
          null,
          "register_failed",
          { reason: "duplicate_email", requestId },
          ipAddress,
          userAgent,
        );
        return redirectWithError(
          request.url,
          "/register",
          new Error("This email is already registered"),
          {
            requestId,
          },
        );
      }

      throw innerError;
    } finally {
      client.release();
    }
  } catch (error) {
    const emailValue = parsed?.data?.email || String(formData.get("email"));

    // Handle database errors specifically
    if (
      error instanceof Error &&
      (error.message.includes("database") || (error as any).code === "23505")
    ) {
      const dbError = handleDatabaseError(error);
      await logAuditEvent(
        null,
        "register_failed",
        { reason: "database_error", email: emailValue, requestId },
        ipAddress,
        userAgent,
      );
      return redirectWithError(request.url, "/register", dbError, {
        requestId,
      });
    }

    // Log the actual error for monitoring
    console.error(`[${requestId}] Registration error:`, error);
    await logAuditEvent(
      null,
      "register_failed",
      { reason: "server_error", email: emailValue, requestId },
      ipAddress,
      userAgent,
    );
    return redirectWithError(
      request.url,
      "/register",
      new Error("Registration service is temporarily unavailable"),
      { requestId },
    );
  }
}
