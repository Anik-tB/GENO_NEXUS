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

    // Fetch paths from DB
    const queryFileRes = await db.query(`SELECT storage_path FROM dna_files WHERE id = $1 AND user_id = $2`, [queryFileId, user.id]);
    const refFileRes = await db.query(`SELECT storage_path FROM dna_files WHERE id = $1 AND user_id = $2`, [referenceFileId, user.id]);

    if (queryFileRes.rowCount === 0 || refFileRes.rowCount === 0) {
      return NextResponse.json({ error: "Files not found or unauthorized" }, { status: 404 });
    }

    const queryDbPath = queryFileRes.rows[0].storage_path;
    const refPathOrUrl = refFileRes.rows[0].storage_path;

    const absoluteQueryPath = path.join(process.cwd(), "public", queryDbPath);
    
    let pythonReqBody: any = {
      query_path: absoluteQueryPath
    };

    if (refPathOrUrl.startsWith("http")) {
      pythonReqBody.reference_url = refPathOrUrl;
    } else {
      pythonReqBody.reference_path = path.join(process.cwd(), "public", refPathOrUrl);
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

