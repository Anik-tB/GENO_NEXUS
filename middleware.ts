import { NextResponse, type NextRequest } from "next/server";

// ─── Portal Route Guards ───────────────────────────────────────────────────
// Categories that belong to the Normal User portal (/user/*)
const NORMAL_USER_CATEGORIES = ["patient", "caregiver"];

function getSessionCookie(request: NextRequest): string | undefined {
  // Check the configured cookie names: 'geno_session', 'gn_session', or 'session'
  return (
    request.cookies.get("geno_session")?.value ??
    request.cookies.get("gn_session")?.value ??
    request.cookies.get("session")?.value
  );
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy permitting Firebase client Auth & Google Auth SDKs
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://apis.google.com https://accounts.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com https://*.googleapis.com;
    frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\n/g, " ");
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), usb=(), gyroscope=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = getSessionCookie(request);

  // ── Protected route: /dashboard/* — Researcher/Medical Portal ─────────
  // If not logged in → redirect to login
  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("status", "session_required");
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
    // Note: deep role-check (researcher vs user) happens server-side in pages.
    // Middleware only checks presence of session to avoid DB calls on every request.
  }

  // ── Protected route: /user/* — Normal User Portal ─────────────────────
  if (pathname.startsWith("/user")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("status", "session_required");
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // ── Public auth routes: redirect logged-in users to their portal ───────
  // If user already has a session and tries to visit /login or /register,
  // send them back (they'll land on the correct portal via the session cookie).
  // We intentionally do NOT redirect here to avoid a DB call in middleware;
  // the login/register pages handle this via server components.

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
