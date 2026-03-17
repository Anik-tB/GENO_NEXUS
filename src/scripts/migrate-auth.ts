import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

async function runMigration() {
  console.log("Starting auth migration...");
  const client = await pool.connect();
  try {
    // 1. Add new columns to users table
    console.log("Adding columns to users table...");
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified timestamp with time zone,
      ADD COLUMN IF NOT EXISTS github_id varchar(255) UNIQUE;
    `);

    // 2. Make password_hash nullable
    console.log("Making password_hash nullable...");
    await client.query(`
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    `);

    // 3. Create verification_tokens table
    console.log("Creating verification_tokens table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token varchar(255) NOT NULL UNIQUE,
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
    `);

    console.log("Auth migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
