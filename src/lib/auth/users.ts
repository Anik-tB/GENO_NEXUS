import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";
import { DEFAULT_ACCOUNT_CATEGORY, type AccountCategory } from "@/lib/auth/account-category";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountCategory: AccountCategory;
  passwordHash: string | null;
  githubId: string | null;
  googleId: string | null;
  firebaseUid: string | null;
}

interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  accountCategory: AccountCategory;
  passwordHash: string;
}

interface OAuthUserInput {
  provider: "github" | "google";
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface FirebaseGoogleUserInput {
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
}

const PROVIDER_COLUMNS = {
  github: "github_id",
  google: "google_id"
} as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(row: Record<string, string | null>): AuthUser {
  return {
    id: row.id ?? "",
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    accountCategory: (row.account_category as AccountCategory | null) ?? DEFAULT_ACCOUNT_CATEGORY,
    passwordHash: row.password_hash,
    githubId: row.github_id,
    googleId: row.google_id,
    firebaseUid: row.firebase_uid
  };
}

export async function findUserByEmail(email: string) {
  const client = assertDatabase();
  const result = await client.query(
    `
      SELECT id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function createUser(input: CreateUserInput, executor: DatabaseQueryExecutor = assertDatabase()) {
  const client = executor;
  const result = await client.query(
    `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        account_category,
        password_hash,
        terms_accepted_at,
        medical_acknowledged_at
      )
      VALUES ($1, $2, lower($3), $4, $5, NOW(), NOW())
      RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
    `,
    [input.firstName, input.lastName, normalizeEmail(input.email), input.accountCategory, input.passwordHash]
  );

  return mapUser(result.rows[0]);
}

export async function findOrCreateOAuthUser(input: OAuthUserInput) {
  const client = assertDatabase();
  const providerColumn = PROVIDER_COLUMNS[input.provider];
  const email = normalizeEmail(input.email);

  const existingUserResult = await client.query(
    `
      SELECT id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
      FROM users
      WHERE ${providerColumn} = $1 OR email = $2
      LIMIT 1
    `,
    [input.providerId, email]
  );

  if (existingUserResult.rows[0]) {
    const existingUser = mapUser(existingUserResult.rows[0]);

    const updatedUser = await client.query(
      `
        UPDATE users
        SET ${providerColumn} = $1, email_verified = COALESCE(email_verified, NOW()), updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
      `,
      [input.providerId, existingUser.id]
    );

    return mapUser(updatedUser.rows[0]);
  }

  const result = await client.query(
    `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        account_category,
        password_hash,
        ${providerColumn},
        email_verified,
        terms_accepted_at,
        medical_acknowledged_at
      )
      VALUES ($1, $2, lower($3), $4, NULL, $5, NOW(), NOW(), NOW())
      RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
    `,
    [input.firstName, input.lastName, email, DEFAULT_ACCOUNT_CATEGORY, input.providerId]
  );

  return mapUser(result.rows[0]);
}

export async function findOrCreateFirebaseGoogleUser(input: FirebaseGoogleUserInput) {
  const client = assertDatabase();
  const email = normalizeEmail(input.email);

  const existingUserResult = await client.query(
    `
      SELECT id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
      FROM users
      WHERE firebase_uid = $1 OR email = $2
      LIMIT 1
    `,
    [input.firebaseUid, email]
  );

  if (existingUserResult.rows[0]) {
    const existingUser = mapUser(existingUserResult.rows[0]);

    const updatedUser = await client.query(
      `
        UPDATE users
        SET firebase_uid = $1, email_verified = COALESCE(email_verified, NOW()), updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
      `,
      [input.firebaseUid, existingUser.id]
    );

    return mapUser(updatedUser.rows[0]);
  }

  const result = await client.query(
    `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        account_category,
        password_hash,
        firebase_uid,
        email_verified,
        terms_accepted_at,
        medical_acknowledged_at
      )
      VALUES ($1, $2, lower($3), $4, NULL, $5, NOW(), NOW(), NOW())
      RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid
    `,
    [input.firstName, input.lastName, email, DEFAULT_ACCOUNT_CATEGORY, input.firebaseUid]
  );

  return mapUser(result.rows[0]);
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  const client = assertDatabase();
  await client.query(
    `
      UPDATE users
      SET password_hash = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [userId, passwordHash]
  );
}
