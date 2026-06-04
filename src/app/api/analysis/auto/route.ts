import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { randomUUID } from "node:crypto";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();

    // 1. Automatically find the latest local upload
    const queryRes = await db.query(`
      SELECT id, storage_path FROM dna_files 
      WHERE user_id = $1 AND storage_path NOT LIKE 'http%' 
      ORDER BY created_at DESC LIMIT 1
    `, [user.id]);

    // 2. Automatically find the latest reference (URL or local file)
    const refRes = await db.query(`
      SELECT id, storage_path FROM dna_files 
      WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 2
    `, [user.id]);

    // Ensure we have at least 2 distinct files: one query, one reference
    if (queryRes.rowCount === 0 || refRes.rowCount === 0) {
      return NextResponse.json({ error: "Missing either a local upload or a referenced NCBI link." }, { status: 400 });
    }

    // Pick the oldest of the two most-recent as reference to avoid self-comparison
    const allFiles = refRes.rows;
    const queryFile = queryRes.rows[0];
    const refFile = allFiles.find((f: any) => f.id !== queryFile.id) ?? allFiles[allFiles.length - 1];

    if (!refFile || refFile.id === queryFile.id) {
      return NextResponse.json({ error: "Missing either a local upload or a referenced NCBI link." }, { status: 400 });
    }

    const queryFileId = queryFile.id;
    const refFileId = refFile.id;
    const queryDbPath = queryFile.storage_path;
    const refPathOrUrl = refFile.storage_path;

    // 3. Check if we ALREADY compared these exact two files
    const existingCheck = await db.query(`
      SELECT id FROM comparison_results 
      WHERE query_file_id = $1 AND reference_file_id = $2
    `, [queryFileId, refFileId]);

    if (existingCheck.rowCount && existingCheck.rowCount > 0 && existingCheck.rows[0]?.id) {
      // Already running or completed, no need to bombard the Python server
      return NextResponse.json({ success: true, comparisonId: existingCheck.rows[0].id });
    }

    const absoluteQueryPath = path.join(process.cwd(), "public", queryDbPath);
    const resultId = randomUUID();

    let pythonReqBody: any = { query_path: absoluteQueryPath };
    if (refPathOrUrl.startsWith("http")) {
      pythonReqBody.reference_url = refPathOrUrl;
    } else {
      pythonReqBody.reference_path = path.join(process.cwd(), "public", refPathOrUrl);
    }

    await db.query(`
      INSERT INTO comparison_results (id, query_file_id, reference_file_id, status)
      VALUES ($1, $2, $3, 'processing')
    `, [resultId, queryFileId, refFileId]);

    // Background trigger
    fetch("http://localhost:8000/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pythonReqBody)
    })
    .then(async res => {
      if (!res.ok) throw new Error("FastAPI returned error");
      return res.json();
    })
    .then(async data => {
      if (data.match_percentage !== undefined) {
        await db.query(`
          UPDATE comparison_results 
          SET status = 'completed',
              match_percentage = $1,
              mutations_found = $2,
              detected_organism = $3,
              alignment_score = $4,
              indels_found = $5,
              analysis_metadata = $6
          WHERE id = $7
        `, [
          data.match_percentage,
          JSON.stringify(data.mutations_found),
          data.detected_organism ?? null,
          data.alignment_score ?? null,
          JSON.stringify(data.indels_found ?? []),
          JSON.stringify(data.analysis_metadata ?? {}),
          resultId
        ]);

        await db.query(`
          INSERT INTO user_notifications (user_id, title, message, type, link)
          VALUES ($1, $2, $3, $4, $5)
        `, [user.id, "Analysis Complete", "Automated analysis pipeline completed successfully.", "success", `/dashboard/results/${resultId}`]);
      } else {
        await db.query(`UPDATE comparison_results SET status = 'failed' WHERE id = $1`, [resultId]);
      }
    })
    .catch(async err => {
      console.error("FastAPI call failed:", err);
      // Failsafe
      await db.query(`UPDATE comparison_results SET status = 'failed' WHERE id = $1`, [resultId]);
    });

    return NextResponse.json({ success: true, comparisonId: resultId });

  } catch (error) {
    console.error("Auto trigger failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
