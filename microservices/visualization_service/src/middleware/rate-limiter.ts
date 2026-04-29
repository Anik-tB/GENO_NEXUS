import rateLimit from "express-rate-limit";

/**
 * Rate limiter for REST API endpoints.
 * 100 requests per minute per IP address.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 100,              // 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind a proxy, otherwise use IP
    return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.ip
      || "unknown";
  },
});

/**
 * Stricter rate limiter for file upload endpoints (Newick parsing).
 * 10 requests per minute per IP.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Upload rate limit exceeded. Please try again later.",
  },
});
