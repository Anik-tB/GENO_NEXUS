import { NextResponse, type NextRequest } from "next/server";

/**
 * Add security headers to all HTTP responses
 */
export function addSecurityHeaders(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection in older browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://apis.google.com https://accounts.google.com;
    frame-src https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\n/g, " ");
  response.headers.set("Content-Security-Policy", cspHeader);

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), usb=(), gyroscope=()",
  );

  // Strict-Transport-Security (HTTPS only, if in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return response;
}

/**
 * Middleware to apply security headers to all responses
 */
export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  return addSecurityHeaders(request, response);
}
