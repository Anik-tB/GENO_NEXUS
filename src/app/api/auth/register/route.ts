import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { registerSchema } from "@/lib/validation/auth";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
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

    const user = await createUser({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password)
    });

    const session = await createSession(user.id, true);
    const response = redirectTo(request, "/dashboard");
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    return response;
  } catch {
    return redirectTo(request, "/register?error=service_unavailable");
  }
}

