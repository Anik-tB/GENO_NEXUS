import type { Request, Response, NextFunction } from "express";
import { logger } from "./request-logger";
import { isDevelopment } from "../config/env";

/**
 * Custom error class for API errors with status codes.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Creates standardized error responses for upstream service failures.
 */
export class UpstreamError extends ApiError {
  constructor(serviceName: string, originalError?: unknown) {
    const msg = originalError instanceof Error ? originalError.message : "Unknown error";
    super(
      502,
      "UPSTREAM_ERROR",
      `Failed to fetch data from ${serviceName}: ${msg}`,
    );
  }
}

/**
 * Global error handler middleware. Returns structured JSON errors.
 * In dev mode, includes stack traces. In production, hides internals.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Already an ApiError — use its status and message
  if (err instanceof ApiError) {
    logger.warn({ error: err.error, message: err.message, status: err.statusCode }, "API Error");
    res.status(err.statusCode).json({
      success: false,
      error: err.error,
      message: err.message,
      ...(isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // Unexpected error
  logger.error({ error: err.message, stack: err.stack }, "Unhandled server error");
  res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: isDevelopment ? err.message : "An unexpected error occurred",
    ...(isDevelopment && { stack: err.stack }),
  });
}
