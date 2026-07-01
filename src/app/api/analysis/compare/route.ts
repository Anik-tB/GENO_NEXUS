import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { randomUUID } from "node:crypto";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromSessionToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { queryFileId, referenceFileId } = body;

    if (!queryFileId || !referenceFileId) {
      return NextResponse.json({ error: "Missing file IDs" }, { status: 400 });
    }

    const db = assertDatabase();

    // Cache check: if a completed comparison already exists for these file IDs, return it
    const existing = await db.query(
      `SELECT id FROM comparison_results 
       WHERE query_file_id = $1 AND reference_file_id = $2 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [queryFileId, referenceFileId]
    );
    if (existing.rows && existing.rows.length > 0) {
      return NextResponse.json({ success: true, comparisonId: existing.rows[0].id, cached: true });
    }

    // Fetch paths from DB
    const queryFileRes = await db.query(`SELECT storage_path FROM dna_files WHERE id = $1 AND user_id = $2`, [queryFileId, user.id]);
    const refFileRes = await db.query(`SELECT storage_path FROM dna_files WHERE id = $1 AND user_id = $2`, [referenceFileId, user.id]);

    if (queryFileRes.rowCount === 0 || refFileRes.rowCount === 0) {
      return NextResponse.json({ error: "Files not found or unauthorized" }, { status: 404 });
    }

    const queryDbPath = queryFileRes.rows[0].storage_path;
    const refPathOrUrl = refFileRes.rows[0].storage_path;

    const absoluteQueryPath = path.join(process.cwd(), "public", queryDbPath);
    let querySequence = "";
    try {
      querySequence = fs.readFileSync(absoluteQueryPath, "utf-8");
    } catch (err) {
      console.error("Failed to read query sequence from disk:", err);
      return NextResponse.json({ error: "Failed to read query file. It may have been deleted during a server restart." }, { status: 404 });
    }
    
    let pythonReqBody: any = {
      query_sequence: querySequence
    };

    if (refPathOrUrl.startsWith("http")) {
      pythonReqBody.reference_url = refPathOrUrl;
    } else {
      const absoluteRefPath = path.join(process.cwd(), "public", refPathOrUrl);
      try {
        const refSequence = fs.readFileSync(absoluteRefPath, "utf-8");
        pythonReqBody.reference_sequence = refSequence;
      } catch (err) {
        console.error("Failed to read reference sequence from disk:", err);
        return NextResponse.json({ error: "Failed to read reference file." }, { status: 404 });
      }
    }

    // Create a processing record
    const resultId = randomUUID();
    await db.query(`
      INSERT INTO comparison_results
        (id, query_file_id, reference_file_id, status)
      VALUES
        ($1, $2, $3, 'processing')
    `, [resultId, queryFileId, referenceFileId]);

    // Background processing (Call the Python FastAPI Microservice)
    fetch(`${process.env.PYTHON_API_URL || "http://127.0.0.1:8000"}/compare`, {
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
        `, [user.id, "Analysis Complete", "Genomic comparison started successfully and is now complete.", "success", `/dashboard/results/${resultId}`]);
      } else {
        await db.query(`UPDATE comparison_results SET status = 'failed' WHERE id = $1`, [resultId]);
      }
    })
    .catch(async err => {
      console.error("FastAPI call failed:", err);
      // Failsafe to update database when the engine fails
      try {
        await db.query(`UPDATE comparison_results SET status = 'failed' WHERE id = $1`, [resultId]);
      } catch (dbErr) {
        console.error("Failed to mark as failed in DB:", dbErr);
      }
    });

    return NextResponse.json({ success: true, comparisonId: resultId });

  } catch (error) {
    console.error("Failed to start comparison:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

