import { NextRequest, NextResponse } from "next/server";
import { buildOAuthStateCookie, createOAuthState } from "@/lib/auth/oauth-state";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("Missing GOOGLE_CLIENT_ID environment variable");
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const state = createOAuthState();

  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set(buildOAuthStateCookie("google", state));
  return response;
}
