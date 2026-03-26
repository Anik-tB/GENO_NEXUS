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
  const storedState = request.cookies.get(getOAuthStateCookieName("github"))?.value;

  if (!state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("github"));
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("github"));
    return response;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string | undefined;

    if (!accessToken) {
      throw new Error("Failed to get access token from GitHub");
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json();
    const githubId = String(userData.id ?? "");
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const emailsData = (await emailResponse.json()) as Array<{
      email?: string;
      primary?: boolean;
      verified?: boolean;
    }>;
    const primaryVerifiedEmail = emailsData.find((entry) => entry.primary && entry.verified);
    const fallbackVerifiedEmail = emailsData.find((entry) => entry.verified);
    const githubEmail = primaryVerifiedEmail?.email ?? fallbackVerifiedEmail?.email;

    if (!githubId || !githubEmail) {
      const response = NextResponse.redirect(new URL("/login?error=invalid_credentials", request.url));
      response.cookies.set(buildExpiredOAuthStateCookie("github"));
      return response;
    }

    const nameParts = String(userData.name || userData.login || "GitHub User").trim().split(/\s+/);
    const firstName = nameParts[0] || "GitHub";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const user = await findOrCreateOAuthUser({
      provider: "github",
      providerId: githubId,
      email: githubEmail,
      firstName,
      lastName
    });

    const session = await createSession(user.id, true, undefined, {
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      isTrusted: true,
    });
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("github"));
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    return response;
  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    const response = NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
    response.cookies.set(buildExpiredOAuthStateCookie("github"));
    return response;
  }
}
