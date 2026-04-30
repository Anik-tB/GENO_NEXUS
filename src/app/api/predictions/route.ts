import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();
    
    // 1. Find the user's latest local file upload
    const latestFile = await db.query(`
      SELECT id FROM dna_files
      WHERE user_id = $1 AND storage_path NOT LIKE 'http%'
      ORDER BY created_at DESC LIMIT 1
    `, [user.id]);

    if (latestFile.rowCount === 0) {
      return NextResponse.json({ error: "No uploaded file found. Please upload a genomic file first." }, { status: 404 });
    }

    // 2. Try to find a completed comparison for the latest file first
    let latestComparison = await db.query(`
      SELECT cr.mutations_found, cr.match_percentage, df.file_name, cr.detected_organism
      FROM comparison_results cr
      JOIN dna_files df ON cr.query_file_id = df.id
      WHERE cr.query_file_id = $1 AND cr.status = 'completed'
      ORDER BY cr.created_at DESC LIMIT 1
    `, [latestFile.rows[0].id]);

    // 3. If no completed result for the latest file, fall back to ANY completed comparison for this user
    if (latestComparison.rowCount === 0) {
      latestComparison = await db.query(`
        SELECT cr.mutations_found, cr.match_percentage, df.file_name, cr.detected_organism
        FROM comparison_results cr
        JOIN dna_files df ON cr.query_file_id = df.id
        WHERE df.user_id = $1 AND cr.status = 'completed'
        ORDER BY cr.created_at DESC LIMIT 1
      `, [user.id]);
    }

    if (latestComparison.rowCount === 0) {
      return NextResponse.json({ error: "No completed analysis found. Please upload a file and run the analysis first." }, { status: 404 });
    }

    const mutations = latestComparison.rows[0].mutations_found || [];
    const fileName = latestComparison.rows[0].file_name;
    const matchPct = latestComparison.rows[0].match_percentage;
    const organism = latestComparison.rows[0].detected_organism || "Unknown";

    // Send to Python FastAPI Engine
    const pyRes = await fetch("http://localhost:8000/predict_disease", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mutations, organism }),
    });

    if (!pyRes.ok) {
      throw new Error("Failed to fetch predictions from AI engine.");
    }

    const data = await pyRes.json();
    return NextResponse.json({
      success: true,
      predictions: data.predictions,
      meta: { fileName, matchPct, mutationCount: mutations.length }
    });

  } catch (error: any) {
    console.error("AI Prediction Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
