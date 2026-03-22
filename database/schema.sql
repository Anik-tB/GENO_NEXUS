CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  email_verified TIMESTAMPTZ,
  github_id TEXT,
  google_id TEXT,
  firebase_uid TEXT,
  account_category TEXT NOT NULL DEFAULT 'other',
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  medical_acknowledged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_account_category_check CHECK (
    account_category IN ('patient', 'caregiver', 'clinician', 'researcher', 'lab_staff', 'other')
  )
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_category TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
UPDATE users
SET account_category = 'other'
WHERE account_category IS NULL;
ALTER TABLE users ALTER COLUMN account_category SET DEFAULT 'other';
ALTER TABLE users ALTER COLUMN account_category SET NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_category_check;
ALTER TABLE users
  ADD CONSTRAINT users_account_category_check CHECK (
    account_category IN ('patient', 'caregiver', 'clinician', 'researcher', 'lab_staff', 'other')
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id
  ON users(github_id)
  WHERE github_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
  ON users(google_id)
  WHERE google_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid
  ON users(firebase_uid)
  WHERE firebase_uid IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id
  ON verification_tokens(user_id);
