import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    console.error("Missing GITHUB_CLIENT_ID environment variable");
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }

  const redirectUri = new URL("/api/auth/github/callback", request.url).toString();
  // Using a random state variable is recommended for CSRF protection, but keeping it simple here
  
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  
  return NextResponse.redirect(githubAuthUrl);
}
