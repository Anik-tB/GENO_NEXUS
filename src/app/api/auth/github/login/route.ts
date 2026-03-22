import { NextRequest, NextResponse } from "next/server";
import { buildOAuthStateCookie, createOAuthState } from "@/lib/auth/oauth-state";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    console.error("Missing GITHUB_CLIENT_ID environment variable");
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }

  const redirectUri = new URL("/api/auth/github/callback", request.url).toString();
  const state = createOAuthState();
  
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl);
  response.cookies.set(buildOAuthStateCookie("github", state));
  return response;
}
