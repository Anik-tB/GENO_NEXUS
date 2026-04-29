import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { logger } from "./request-logger";

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Paths that skip authentication
const PUBLIC_PATHS = [
  "/api/viz/health",
  "/api/viz/health/ready",
];

/**
 * Authentication middleware supporting two methods:
 * 1. JWT Bearer token in Authorization header
 * 2. API Key in X-API-Key header
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check endpoints
  if (PUBLIC_PATHS.some((p) => req.path.startsWith(p))) {
    next();
    return;
  }

  // Method 1: API Key
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey) {
    if (apiKey === env.API_KEY) {
      req.user = { sub: "api-key-user" };
      req.authMethod = "api-key";
      next();
      return;
    }
    logger.warn({ ip: req.ip }, "Invalid API key attempt");
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Invalid API key",
    });
    return;
  }

  // Method 2: JWT Bearer Token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      req.authMethod = "jwt";
      next();
      return;
    } catch (err) {
      const message = err instanceof jwt.TokenExpiredError
        ? "Token expired"
        : "Invalid token";
      logger.warn({ ip: req.ip, error: message }, "JWT verification failed");
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message,
      });
      return;
    }
  }

  // No auth provided
  res.status(401).json({
    success: false,
    error: "UNAUTHORIZED",
    message: "Authentication required. Provide Bearer token or X-API-Key header.",
  });
}
