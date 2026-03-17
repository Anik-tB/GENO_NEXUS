import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/sessions";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(env.sessionCookieName)?.value;

  if (sessionToken) {
    try {
      await deleteSession(sessionToken);
    } catch {
      // Ignore DB issues during sign-out so the cookie can still be cleared.
    }
  }

  const response = NextResponse.redirect(new URL("/login?status=signed_out", request.url));
  response.cookies.set({
    name: env.sessionCookieName,
    value: "",
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });

  return response;
}
