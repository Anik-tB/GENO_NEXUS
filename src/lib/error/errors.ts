/**
 * Custom error types for the application
 * These provide structured, type-safe error handling
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super("AUTHENTICATION_ERROR", message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Not authorized to perform this action") {
    super("AUTHORIZATION_ERROR", message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(public retryAfter: number) {
    super(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again later.",
      429,
    );
    this.name = "RateLimitError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(
      "SERVICE_UNAVAILABLE",
      `${service} is temporarily unavailable. Please try again later.`,
      503,
    );
    this.name = "ServiceUnavailableError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super("DATABASE_ERROR", message, 500);
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: string) {
    super("EXTERNAL_SERVICE_ERROR", `Failed to connect to ${service}`, 503, {
      service,
      details,
    });
    this.name = "ExternalServiceError";
  }
}

// Type guard functions
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(
  error: unknown,
): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}
