import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/auth/users";
import { loginSchema } from "@/lib/validation/auth";

const ATTEMPT_COOKIE = "geno_login_attempts";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "true"
  });

  if (!parsed.success) {
    return redirectTo(request, "/login?error=validation");
  }

  try {
    const user = await findUserByEmail(parsed.data.email);

    if (!user) {
      const attempts = Number(request.cookies.get(ATTEMPT_COOKIE)?.value ?? "0") + 1;
      const response = redirectTo(request, "/login?error=invalid_credentials");
      response.cookies.set({
        name: ATTEMPT_COOKIE,
        value: String(attempts),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 30
      });
      return response;
    }

    if (!user.passwordHash) {
      return redirectTo(request, "/login?error=social_account");
    }

    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      const attempts = Number(request.cookies.get(ATTEMPT_COOKIE)?.value ?? "0") + 1;
      const response = redirectTo(request, "/login?error=invalid_credentials");
      response.cookies.set({
        name: ATTEMPT_COOKIE,
        value: String(attempts),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 30
      });
      return response;
    }

    const session = await createSession(user.id, parsed.data.remember);
    const response = redirectTo(request, "/dashboard");
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    response.cookies.delete(ATTEMPT_COOKIE);
    return response;
  } catch {
    return redirectTo(request, "/login?error=service_unavailable");
  }
}
