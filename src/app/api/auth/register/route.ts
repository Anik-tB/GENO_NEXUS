import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { registerSchema } from "@/lib/validation/auth";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/auth/email";
import { assertDatabase } from "@/lib/db";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function splitFullName(fullName: string) {
  const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" ")
  };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    accountCategory: formData.get("accountCategory"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    termsAccepted: formData.get("termsAccepted") === "true",
    medicalAcknowledged: formData.get("medicalAcknowledged") === "true"
  });

  if (!parsed.success) {
    return redirectTo(request, "/register?error=validation");
  }

  try {
    const existingUser = await findUserByEmail(parsed.data.email);

    if (existingUser) {
      return redirectTo(request, "/register?error=email_exists");
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
          passwordHash: await hashPassword(parsed.data.password)
        },
        client
      );

      const session = await createSession(user.id, true, client);
      const token = await generateVerificationToken(user.id, client);

      // Keep the signup atomic: if mail delivery fails, rollback the user/session/token creation.
      await sendVerificationEmail(user.email, token);
      await client.query("COMMIT");

      const response = redirectTo(request, "/dashboard");
      response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
      return response;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return redirectTo(request, "/register?error=email_exists");
    }

    return redirectTo(request, "/register?error=service_unavailable");
  }
}
