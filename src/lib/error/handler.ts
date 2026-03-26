import { NextResponse, type NextRequest } from "next/server";
import {
  AppError,
  isRateLimitError,
  isValidationError,
  isAuthenticationError,
} from "./errors";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp: string;
  };
}

/**
 * Sanitize error message to prevent information disclosure
 */
export function sanitizeErrorMessage(
  error: unknown,
  isDevelopment = false,
): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof SyntaxError) {
    return isDevelopment
      ? `Invalid input: ${error.message}`
      : "Invalid input format";
  }

  if (error instanceof TypeError) {
    return isDevelopment
      ? `Type error: ${error.message}`
      : "An error occurred processing your request";
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    if (isDevelopment) {
      return error.message;
    }

    // Check if it's a database error by message
    if (
      error.message.includes("database") ||
      error.message.includes("ECONNREFUSED")
    ) {
      return "A database error occurred. Please try again later.";
    }

    // Generic fallback
    return "An unexpected error occurred";
  }

  return "An unexpected error occurred";
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string,
  isDevelopment = false,
): ErrorResponse {
  const timestamp = new Date().toISOString();
  const message = sanitizeErrorMessage(error, isDevelopment);

  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: isDevelopment ? error.details : undefined,
        requestId,
        timestamp,
      },
    };
  }

  // Generic error response
  return {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isDevelopment
        ? String(error)
        : "An internal server error occurred",
      statusCode: 500,
      requestId,
      timestamp,
    },
  };
}

/**
 * Handle API route errors and return proper HTTP response
 */
export function handleRouteError(
  error: unknown,
  requestId?: string,
): NextResponse<ErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === "development";
  const errorResponse = createErrorResponse(error, requestId, isDevelopment);
  const statusCode = errorResponse.error.statusCode;

  // Log error for monitoring (don't expose to client in production)
  console.error(`[${requestId}] Error:`, {
    code: errorResponse.error.code,
    message: errorResponse.error.message,
    statusCode,
    timestamp: errorResponse.error.timestamp,
    ...(isDevelopment && { originalError: error }),
  });

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Handle redirect errors (for auth flows)
 */
export function redirectWithError(
  baseUrl: string,
  path: string,
  error: unknown,
  additionalParams: Record<string, string> = {},
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === "development";
  const message = sanitizeErrorMessage(error, isDevelopment);
  const errorCode = error instanceof AppError ? error.code : "UNKNOWN_ERROR";

  const params = new URLSearchParams({
    error: errorCode,
    message: encodeURIComponent(message),
    ...additionalParams,
  });

  return NextResponse.redirect(
    new URL(`${path}?${params.toString()}`, baseUrl),
  );
}

/**
 * Validate that a value is not undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

/**
 * Create a request ID for tracking errors
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request ID from headers or create new one
 */
export function getOrCreateRequestId(request: NextRequest): string {
  const existingId = request.headers.get("x-request-id");
  return existingId || generateRequestId();
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("JSON parse error:", error);
    return defaultValue;
  }
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation or authentication errors
      if (
        error instanceof AppError &&
        (isValidationError(error) || isAuthenticationError(error))
      ) {
        throw error;
      }

      // Calculate delay with exponential backoff
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt),
          maxDelayMs,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Timeout a promise
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = "Operation timed out",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs),
    ),
  ]);
}
