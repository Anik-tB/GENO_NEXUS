import { timingSafeEqual } from "node:crypto";

/**
 * Prevent account enumeration attacks by returning generic messages
 * and adding timing attacks resistance
 */

/**
 * Add random delay to prevent timing attacks
 * (making it harder to distinguish between existing and non-existing accounts)
 */
export async function delayForTimingAttackResistance(): Promise<void> {
  // 200-600ms random delay
  const delay = Math.random() * 400 + 200;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Get safe error message that doesn't reveal account existence
 */
export function getSafeAuthErrorMessage(errorType: string): string {
  // All login errors return the same generic message
  if (errorType === "login_failed") {
    return "Email or password is incorrect.";
  }

  if (errorType === "registration_failed") {
    return "Unable to create account. Please try again or contact support.";
  }

  if (errorType === "email_exists") {
    // This is safe to reveal - user needs to know account exists for password reset
    return "An account with this email already exists.";
  }

  return "An error occurred. Please try again.";
}

/**
 * Normalized password verification that doesn't short-circuit
 * Prevents timing attacks where verification time reveals password correctness
 */
export async function constantTimeComparison(
  provided: string,
  stored: string,
): Promise<boolean> {
  const providedBuffer = Buffer.from(provided);
  const storedBuffer = Buffer.from(stored);

  if (providedBuffer.length !== storedBuffer.length) {
    // Still compare to take similar time
    try {
      timingSafeEqual(
        Buffer.alloc(storedBuffer.length),
        Buffer.alloc(storedBuffer.length),
      );
      return false;
    } catch {
      return false;
    }
  }

  try {
    return timingSafeEqual(providedBuffer, storedBuffer);
  } catch {
    return false;
  }
}
