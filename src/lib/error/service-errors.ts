import { ExternalServiceError, ServiceUnavailableError } from "./errors";

/**
 * Handle Firebase errors and convert to safe error messages
 */
export function handleFirebaseError(error: unknown): Error {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, any>;

    if (err.code === "auth/invalid-api-key") {
      if (isDevelopment) {
        console.error(
          "Firebase is not configured. Add Firebase credentials to .env.local",
        );
      }
      return new ServiceUnavailableError("Authentication service");
    }

    if (err.code === "auth/network-request-failed") {
      return new ServiceUnavailableError("Authentication service");
    }

    if (err.code === "auth/popup-blocked") {
      return new Error(
        "Pop-up window was blocked. Please check your browser settings and try again.",
      );
    }

    if (err.code === "auth/popup-closed-by-user") {
      return new Error("Sign-in cancelled by user");
    }

    if (err.code === "auth/operation-not-supported-in-this-environment") {
      if (isDevelopment) {
        console.error("Firebase operation not supported in this environment");
      }
      return new ServiceUnavailableError("Authentication service");
    }
  }

  // Log the actual error only in development
  if (isDevelopment) {
    console.error("Firebase error:", error);
  }

  return new ServiceUnavailableError("Firebase Authentication");
}

/**
 * Handle Google OAuth errors
 */
export function handleGoogleOAuthError(error: unknown): Error {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (typeof error === "string") {
    if (error.includes("popup_closed_by_user")) {
      return new Error("Sign-in cancelled by user");
    }

    if (error.includes("access_denied")) {
      return new Error("Access to sign-in was denied");
    }
  }

  if (isDevelopment) {
    console.error("Google OAuth error:", error);
  }

  return new ExternalServiceError("Google Sign-in");
}

/**
 * Handle GitHub OAuth errors
 */
export function handleGitHubOAuthError(error: unknown): Error {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, any>;

    if (err.message?.includes("user_code_invalid")) {
      return new Error("GitHub authorization expired. Please try again.");
    }
  }

  if (isDevelopment) {
    console.error("GitHub OAuth error:", error);
  }

  return new ExternalServiceError("GitHub Sign-in");
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown): Error {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, any>;

    // PostgreSQL duplicate key error
    if (err.code === "23505") {
      if (isDevelopment) {
        console.error("Duplicate entry error:", err.detail);
      }
      return new Error("This record already exists");
    }

    // PostgreSQL connection error
    if (err.code === "ECONNREFUSED") {
      return new ServiceUnavailableError("Database");
    }

    // PostgreSQL timeout
    if (err.code === "ETIMEDOUT") {
      return new ServiceUnavailableError("Database");
    }

    // PostgreSQL constraint violation
    if (err.code === "23502") {
      // 23502 is "not_null_violation"
      if (isDevelopment) {
        console.error("Not null constraint violation:", err.detail);
      }
      return new Error("Required field is missing");
    }
  }

  if (isDevelopment) {
    console.error("Database error:", error);
  }

  return new ServiceUnavailableError("Database");
}

/**
 * Handle email service errors
 */
export function handleEmailServiceError(error: unknown): Error {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, any>;

    if (err.code === "ENOTFOUND") {
      return new ServiceUnavailableError("Email service");
    }

    if (err.code === "ECONNREFUSED") {
      return new ServiceUnavailableError("Email service");
    }
  }

  if (isDevelopment) {
    console.error("Email service error:", error);
  }

  return new ServiceUnavailableError("Email service");
}

/**
 * Handle fetch/network errors
 */
export function handleNetworkError(error: unknown): Error {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (error instanceof TypeError) {
    if (error.message.includes("fetch")) {
      return new ServiceUnavailableError("Network");
    }

    if (error.message.includes("CORS")) {
      if (isDevelopment) {
        console.error("CORS error:", error.message);
      }
      return new Error(
        "This request could not be completed due to security restrictions",
      );
    }
  }

  if (isDevelopment) {
    console.error("Network error:", error);
  }

  return new ServiceUnavailableError("Network");
}

/**
 * Safe error handler wrapper for try-catch blocks
 */
export function handleError(
  error: unknown,
  context:
    | "firebase"
    | "google"
    | "github"
    | "database"
    | "email"
    | "network"
    | "unknown" = "unknown",
): Error {
  switch (context) {
    case "firebase":
      return handleFirebaseError(error);
    case "google":
      return handleGoogleOAuthError(error);
    case "github":
      return handleGitHubOAuthError(error);
    case "database":
      return handleDatabaseError(error);
    case "email":
      return handleEmailServiceError(error);
    case "network":
      return handleNetworkError(error);
    default:
      return error instanceof Error ? error : new Error(String(error));
  }
}
