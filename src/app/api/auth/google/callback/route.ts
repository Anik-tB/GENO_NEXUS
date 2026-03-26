import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { findOrCreateOAuthUser } from "@/lib/auth/users";
import { buildExpiredOAuthStateCookie, getOAuthStateCookieName } from "@/lib/auth/oauth-state";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.cookies.get(getOAuthStateCookieName("google"))?.value;

  if (!state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("google"));
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("google"));
    return response;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }

  try {
    const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string | undefined;

    if (!accessToken) {
      throw new Error("Failed to get access token from Google");
    }

    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json();
    const googleId = String(userData.sub ?? "");
    const email = String(userData.email ?? "");
    const emailVerified = userData.email_verified === true;

    if (!googleId || !email || !emailVerified) {
      const response = NextResponse.redirect(new URL("/login?error=invalid_credentials", request.url));
      response.cookies.set(buildExpiredOAuthStateCookie("google"));
      return response;
    }

    const firstName = String(userData.given_name || userData.name || "Google").trim() || "Google";
    const lastName =
      String(userData.family_name || "").trim() ||
      String(userData.name || "").trim().split(/\s+/).slice(1).join(" ") ||
      "User";

    const user = await findOrCreateOAuthUser({
      provider: "google",
      providerId: googleId,
      email,
      firstName,
      lastName
    });

    const session = await createSession(user.id, true, undefined, {
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      isTrusted: true,
    });
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("google"));
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    return response;
  } catch (error) {
    console.error("Google OAuth Error:", error);
    const response = NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("google"));
    return response;
  }
}
