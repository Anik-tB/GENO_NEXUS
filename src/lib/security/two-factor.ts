import { randomBytes } from "node:crypto";
import { authenticator } from "otplib";
import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";

/**
 * Generate 2FA secret and QR code for user
 */
export async function generateTwoFactorSecret(userId: string): Promise<{
  secret: string;
  qrCode: string;
}> {
  const secret = authenticator.generateSecret();
  const qrCode = authenticator.keyuri(userId, "GenoNexus", secret);

  return {
    secret,
    qrCode,
  };
}

/**
 * Enable 2FA for a user
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<string[]> {
  // Generate backup codes (8 codes, 10 characters each)
  const backupCodes = Array.from({ length: 8 }, () =>
    randomBytes(5).toString("hex").toUpperCase(),
  );

  await executor.query(
    `
    UPDATE users
    SET two_factor_secret = $1, two_factor_enabled = true, backup_codes = $2
    WHERE id = $3
    `,
    [secret, JSON.stringify(backupCodes), userId],
  );

  return backupCodes;
}

/**
 * Verify 2FA token
 */
export async function verifyTwoFactorToken(
  userId: string,
  token: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<boolean> {
  const result = await executor.query(
    `SELECT two_factor_secret FROM users WHERE id = $1`,
    [userId],
  );

  if (!result.rows[0]?.two_factor_secret) {
    return false;
  }

  return authenticator.check(token, result.rows[0].two_factor_secret);
}

/**
 * Use a backup code (one-time use)
 */
export async function useTwoFactorBackupCode(
  userId: string,
  code: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<boolean> {
  const result = await executor.query(
    `SELECT backup_codes FROM users WHERE id = $1`,
    [userId],
  );

  if (!result.rows[0]?.backup_codes) {
    return false;
  }

  const codes: string[] = result.rows[0].backup_codes;
  const codeIndex = codes.indexOf(code.toUpperCase());

  if (codeIndex === -1) {
    return false;
  }

  // Remove the used code
  codes.splice(codeIndex, 1);

  await executor.query(`UPDATE users SET backup_codes = $1 WHERE id = $2`, [
    JSON.stringify(codes),
    userId,
  ]);

  return true;
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(
  userId: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<void> {
  await executor.query(
    `
    UPDATE users
    SET two_factor_secret = NULL, two_factor_enabled = false, backup_codes = NULL
    WHERE id = $1
    `,
    [userId],
  );
}

/**
 * Check if user has 2FA enabled
 */
export async function hasTwoFactorEnabled(
  userId: string,
  executor: DatabaseQueryExecutor = assertDatabase(),
): Promise<boolean> {
  const result = await executor.query(
    `SELECT two_factor_enabled FROM users WHERE id = $1`,
    [userId],
  );

  return result.rows[0]?.two_factor_enabled || false;
}
