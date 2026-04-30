import { assertDatabase, type DatabaseQueryExecutor } from "@/lib/db";
import {
  DEFAULT_ACCOUNT_CATEGORY,
  type AccountCategory,
} from "@/lib/auth/account-category";

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
  accountLockedUntil: Date | null;
  failedLoginCount: number;
  bio: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  phone: string | null;
  organization: string | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
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
  google: "google_id",
} as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(row: Record<string, any>): AuthUser {
  return {
    id: row.id ?? "",
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    accountCategory:
      (row.account_category as AccountCategory | null) ??
      DEFAULT_ACCOUNT_CATEGORY,
    passwordHash: row.password_hash,
    githubId: row.github_id,
    googleId: row.google_id,
    firebaseUid: row.firebase_uid,
    accountLockedUntil: row.account_locked_until
      ? new Date(row.account_locked_until)
      : null,
    failedLoginCount: row.failed_login_count ?? 0,
    bio: row.bio ?? null,
    jobTitle: row.job_title ?? null,
    avatarUrl: row.avatar_url ?? null,
    phone: row.phone ?? null,
    organization: row.organization ?? null,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
  };
}

export async function findUserByEmail(email: string) {
  const client = assertDatabase();
  const result = await client.query(
    `
      SELECT id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function createUser(
  input: CreateUserInput,
  executor: DatabaseQueryExecutor = assertDatabase(),
) {
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
      RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
    `,
    [
      input.firstName,
      input.lastName,
      normalizeEmail(input.email),
      input.accountCategory,
      input.passwordHash,
    ],
  );

  return mapUser(result.rows[0]);
}

export async function findOrCreateOAuthUser(input: OAuthUserInput) {
  const client = assertDatabase();
  const providerColumn = PROVIDER_COLUMNS[input.provider];
  const email = normalizeEmail(input.email);

  const existingUserResult = await client.query(
    `
      SELECT id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
      FROM users
      WHERE ${providerColumn} = $1 OR email = $2
      LIMIT 1
    `,
    [input.providerId, email],
  );

  if (existingUserResult.rows[0]) {
    const existingUser = mapUser(existingUserResult.rows[0]);

    const updatedUser = await client.query(
      `
        UPDATE users
        SET ${providerColumn} = $1, email_verified = COALESCE(email_verified, NOW()), updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
      `,
      [input.providerId, existingUser.id],
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
      RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
    `,
    [
      input.firstName,
      input.lastName,
      email,
      DEFAULT_ACCOUNT_CATEGORY,
      input.providerId,
    ],
  );

  return mapUser(result.rows[0]);
}

export async function findOrCreateFirebaseGoogleUser(
  input: FirebaseGoogleUserInput,
) {
  const client = assertDatabase();
  const email = normalizeEmail(input.email);

  const existingUserResult = await client.query(
    `
      SELECT id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
      FROM users
      WHERE firebase_uid = $1 OR email = $2
      LIMIT 1
    `,
    [input.firebaseUid, email],
  );

  if (existingUserResult.rows[0]) {
    const existingUser = mapUser(existingUserResult.rows[0]);

    const updatedUser = await client.query(
      `
        UPDATE users
        SET firebase_uid = $1, email_verified = COALESCE(email_verified, NOW()), updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
      `,
      [input.firebaseUid, existingUser.id],
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
      RETURNING id, first_name, last_name, email, account_category, password_hash, github_id, google_id, firebase_uid, account_locked_until, failed_login_count
    `,
    [
      input.firstName,
      input.lastName,
      email,
      DEFAULT_ACCOUNT_CATEGORY,
      input.firebaseUid,
    ],
  );

  return mapUser(result.rows[0]);
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  jobTitle?: string;
  phone?: string;
  organization?: string;
  accountCategory?: AccountCategory;
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const client = assertDatabase();
  const result = await client.query(
    `
      UPDATE users
      SET
        first_name = COALESCE($2, first_name),
        last_name  = COALESCE($3, last_name),
        bio        = COALESCE($4, bio),
        job_title  = COALESCE($5, job_title),
        phone      = COALESCE($6, phone),
        organization = COALESCE($7, organization),
        account_category = COALESCE($8, account_category),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, first_name, last_name, email, account_category, password_hash,
                github_id, google_id, firebase_uid, account_locked_until,
                failed_login_count, bio, job_title, avatar_url, phone, organization,
                created_at, last_login_at
    `,
    [
      userId,
      input.firstName ?? null,
      input.lastName ?? null,
      input.bio ?? null,
      input.jobTitle ?? null,
      input.phone ?? null,
      input.organization ?? null,
      input.accountCategory ?? null,
    ]
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
    [userId, passwordHash],
  );
}
