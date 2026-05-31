import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await pool.query(`ALTER TABLE dna_files ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'`);
    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

main();
