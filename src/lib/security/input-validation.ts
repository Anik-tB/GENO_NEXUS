/**
 * Input validation and sanitization utilities
 * Prevents XSS, injection attacks, and other input-based vulnerabilities
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate strong password
 */
export function validateStrongPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Consider adding special characters for stronger security");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate full name format
 */
export function validateFullName(name: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    return {
      isValid: false,
      error: "Please enter your first and last name",
    };
  }

  if (parts.some((part) => part.length < 2)) {
    return {
      isValid: false,
      error: "Each name part must be at least 2 characters",
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: "Name is too long",
    };
  }

  return { isValid: true };
}

/**
 * Prevent SQL injection by validating alphanumeric + safe chars
 */
export function validateAlphanumeric(
  input: string,
  allowedChars: string = "-_",
): boolean {
  const pattern = new RegExp(
    `^[a-zA-Z0-9${allowedChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]*$`,
  );
  return pattern.test(input);
}

/**
 * Validate TOTP token (6 digits)
 */
export function validateTotpToken(token: string): boolean {
  const cleaned = token.replace(/\s/g, "");
  return /^\d{6}$/.test(cleaned);
}

/**
 * Validate backup code format (10 alphanumeric)
 */
export function validateBackupCode(code: string): boolean {
  const cleaned = code.replace(/\s|-/g, "").toUpperCase();
  return /^[A-F0-9]{10}$/.test(cleaned);
}

/**
 * Rate limit validation - ensure attempts are within limits
 */
export function isWithinRateLimit(
  attempts: number,
  maxAttempts: number = 5,
): boolean {
  return attempts < maxAttempts;
}

/**
 * Validate request origin for CORS/CSRF
 */
export function validateOrigin(
  requestOrigin: string | null,
  allowedOrigins: string[],
): boolean {
  if (!requestOrigin) {
    return false;
  }

  return allowedOrigins.some((origin) => {
    if (origin === "*") {
      return true;
    }
    if (origin === requestOrigin) {
      return true;
    }
    // Support wildcard subdomains
    if (origin.startsWith("*.")) {
      const domain = origin.substring(2);
      return requestOrigin.endsWith(domain);
    }
    return false;
  });
}

/**
 * Extract and validate IP address
 */
export function validateIpAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return false;
  }

  // Validate IPv4 octets
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  }

  return true;
}
