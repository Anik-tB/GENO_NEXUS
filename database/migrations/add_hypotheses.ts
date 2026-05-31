import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hypotheses (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        tags JSONB,
        annotations JSONB,
        confidence INTEGER DEFAULT 50,
        version INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT TRUE,
        comments INTEGER DEFAULT 0,
        avatars JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hypothesis_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hypothesis_id TEXT NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_hypotheses_user_id ON hypotheses(user_id);
      CREATE INDEX IF NOT EXISTS idx_hypothesis_messages_hypo_id ON hypothesis_messages(hypothesis_id);
    `);
    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

main();
