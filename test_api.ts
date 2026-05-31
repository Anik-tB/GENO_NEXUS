import { config } from "dotenv";
config({ path: ".env.local" });

import { assertDatabase } from "./src/lib/db";
import { NextResponse } from "next/server";

async function main() {
  const db = assertDatabase();
  const crResult = await db.query(
    `SELECT
       cr.id,
       cr.created_at,
       cr.match_percentage,
       cr.mutations,
       cr.severity,
       q.file_name AS query_name,
       r.file_name AS ref_name,
       u.email AS author_email
     FROM comparison_results cr
     JOIN dna_files q ON cr.query_file_id = q.id
     LEFT JOIN dna_files r ON cr.reference_file_id = r.id
     JOIN users u ON q.user_id = u.id
     ORDER BY cr.created_at DESC
     LIMIT 1`
  );
  
  const row = crResult.rows[0];
  console.log("Raw row created_at:", row.created_at, typeof row.created_at);
  const ts = new Date(row.created_at).getTime();
  console.log("ts:", ts);
  console.log("Date.now():", Date.now());
  
  const diffMs = Date.now() - ts;
  const secs = Math.floor(diffMs / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  console.log("diffMs:", diffMs);
  console.log("secs:", secs);
  console.log("mins:", mins);
  console.log("hrs:", hrs);
}

main().finally(() => process.exit(0));
