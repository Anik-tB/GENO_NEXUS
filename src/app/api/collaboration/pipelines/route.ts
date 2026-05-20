import { NextRequest, NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) return null;
  return getUserFromSessionToken(token);
}

// ── GET /api/collaboration/pipelines ─────────────────────────
// Fetches pipeline_runs rows for the user.
// If none exist yet, auto-creates them from comparison_results.
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();
    const uid = user.id;

    // Check if user has any pipeline_runs
    const existing = await db.query(
      "SELECT COUNT(*) AS cnt FROM pipeline_runs WHERE user_id = $1",
      [uid]
    );

    if (parseInt(existing.rows[0]?.cnt ?? "0", 10) === 0) {
      // Auto-create from comparison_results
      await autoCreatePipelines(db, uid);
    }

    const result = await db.query(
      `SELECT * FROM pipeline_runs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 10`,
      [uid]
    );

    const pipelines = result.rows.map(row => ({
      id:       row.id,
      name:     row.name,
      status:   row.status,
      progress: row.progress,
      eta:      row.eta ?? undefined,
      stages:   typeof row.stages === "string" ? JSON.parse(row.stages) : (row.stages ?? []),
      logs:     typeof row.logs === "string" ? JSON.parse(row.logs) : (row.logs ?? []),
    }));

    return NextResponse.json({ success: true, data: pipelines });
  } catch (err) {
    console.error("[pipelines GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── PATCH /api/collaboration/pipelines ───────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, action } = await req.json();
    if (!id || !action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }

    const db = assertDatabase();

    const statusMap: Record<string, string> = {
      pause:  "paused",
      resume: "running",
      stop:   "failed",
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db.query(
      `UPDATE pipeline_runs SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [newStatus, id, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pipelines PATCH]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── Auto-create pipelines from comparison_results ────────────
async function autoCreatePipelines(db: any, userId: string) {
  try {
    const cr = await db.query(
      `SELECT cr.id, cr.status, cr.created_at, cr.match_percentage,
              q.file_name AS query_name
       FROM comparison_results cr
       JOIN dna_files q ON cr.query_file_id = q.id
       WHERE q.user_id = $1
       ORDER BY cr.created_at DESC
       LIMIT 6`,
      [userId]
    );

    for (const row of cr.rows) {
      const pipeId = `pipe-cr-${row.id}`;
      const status = row.status === "completed" ? "completed"
                   : row.status === "processing" ? "running"
                   : row.status === "failed" ? "failed"
                   : "queued";
      const progress = status === "completed" ? 100
                     : status === "running" ? Math.floor(Math.random() * 40 + 40)
                     : status === "failed" ? Math.floor(Math.random() * 50 + 10)
                     : 0;

      const stages = [
        { name: "Parse",    status: progress > 20 ? "done" : progress > 0 ? "active" : "pending" },
        { name: "Align",    status: progress > 45 ? "done" : progress > 20 ? "active" : "pending" },
        { name: "Call",     status: progress > 70 ? "done" : progress > 45 ? "active" : "pending" },
        { name: "Annotate", status: progress > 90 ? "done" : progress > 70 ? "active" : "pending" },
        { name: "Report",   status: progress >= 100 ? "done" : progress > 90 ? "active" : "pending" },
      ];

      const logs: string[] = [];
      if (progress > 0) logs.push(`[${fmtTs(row.created_at)}] Pipeline started for ${row.query_name}`);
      if (progress > 20) logs.push(`[${fmtTs(row.created_at)}] Sequence parsing complete`);
      if (progress > 45) logs.push(`[${fmtTs(row.created_at)}] Alignment: ${progress}% complete`);
      if (status === "completed") {
        logs.push(`[${fmtTs(row.created_at)}] Analysis complete — ${Number(row.match_percentage).toFixed(1)}% match`);
      }
      if (status === "failed") {
        logs.push(`[ERROR] Pipeline failed at ${progress}% — check input file format`);
      }

      await db.query(
        `INSERT INTO pipeline_runs (id, user_id, name, status, progress, stages, logs, comparison_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          pipeId, userId,
          `Analysis: ${row.query_name}`,
          status, progress,
          JSON.stringify(stages),
          JSON.stringify(logs),
          row.id,
        ]
      );
    }
  } catch (e) {
    console.error("[autoCreatePipelines]", e);
  }
}

function fmtTs(ts: string | Date): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
