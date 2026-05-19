import { NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

function relTimeLabel(createdAt: string | Date): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function dateLabel(createdAt: string | Date): string {
  const dt = new Date(createdAt);
  const diffDays = Math.floor((Date.now() - dt.getTime()) / 86400000);
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Today ${timeStr}`;
  if (diffDays === 1) return `Yesterday ${timeStr}`;
  return `${diffDays} days ago`;
}

function parseJSON(val: unknown): any[] {
  if (!val) return [];
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  if (Array.isArray(val)) return val;
  return [];
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();
    const uid = user.id;

    // ── 1. File count ─────────────────────────────────────────────────────────
    let totalFiles = 0;
    try {
      const r = await db.query(`SELECT COUNT(*) AS cnt FROM dna_files WHERE user_id = $1`, [uid]);
      totalFiles = parseInt(r.rows[0]?.cnt ?? "0", 10);
    } catch (e) {
      console.error("[collab/stats] file count error:", e);
    }

    // ── 2. Analysis history ───────────────────────────────────────────────────
    let rows: any[] = [];
    try {
      const r = await db.query(
        `SELECT
           cr.status,
           cr.created_at,
           cr.match_percentage,
           cr.mutations_found,
           cr.indels_found,
           cr.detected_organism,
           q.file_name AS query_name,
           r2.file_name AS ref_name
         FROM comparison_results cr
         JOIN dna_files q ON cr.query_file_id = q.id
         JOIN dna_files r2 ON cr.reference_file_id = r2.id
         WHERE q.user_id = $1
         ORDER BY cr.created_at DESC
         LIMIT 20`,
        [uid]
      );
      rows = r.rows;
    } catch (e) {
      console.error("[collab/stats] history query error:", e);
    }

    // ── 3. Compute impact stats ───────────────────────────────────────────────
    let totalVariants = 0;
    let completedCount = 0;
    let runningCount = 0;
    const totalAnalyses = rows.length;

    for (const row of rows) {
      if (row.status === "completed") {
        completedCount++;
        const muts = parseJSON(row.mutations_found);
        const indels = parseJSON(row.indels_found);
        totalVariants += muts.length + indels.length;
      } else if (row.status === "processing") {
        runningCount++;
      }
    }

    const collabScore = Math.min(
      99,
      (completedCount > 0 ? 40 : 0) +
      (totalFiles > 0 ? 20 : 0) +
      (totalVariants > 0 ? 20 : 0) +
      Math.min(19, Math.round((completedCount / Math.max(1, totalAnalyses)) * 19))
    );

    // ── 4. Build activity stream ──────────────────────────────────────────────
    const streams = rows.map((row, idx) => {
      const ts = new Date(row.created_at).getTime();
      const muts = parseJSON(row.mutations_found);
      const indels = parseJSON(row.indels_found);
      const allVars = [...muts, ...indels];
      const urgentCount = allVars.filter((v: any) => v?.severity === "high").length;
      const mutCount = allVars.length;

      let type: "model" | "data" | "pipeline" | "note" | "alert" | "mutation" = "data";
      let desc = `Analysis of ${row.query_name || "file"} completed.`;

      if (row.status === "failed") {
        type = "alert";
        desc = `Analysis of ${row.query_name || "file"} failed — check pipeline logs.`;
      } else if (row.status === "processing") {
        type = "pipeline";
        desc = `Processing ${row.query_name || "file"} vs ${row.ref_name || "reference"} — in progress.`;
      } else if (urgentCount > 0) {
        type = "mutation";
        desc = `Detected ${urgentCount} high-severity variant${urgentCount > 1 ? "s" : ""} in ${row.query_name || "file"}${row.detected_organism ? ` (${row.detected_organism})` : ""}.`;
      } else if (mutCount > 0) {
        type = "model";
        desc = `Analysis of ${row.query_name || "file"}: ${mutCount} variant${mutCount > 1 ? "s" : ""} found — ${Number(row.match_percentage)?.toFixed(1) ?? "—"}% match.`;
      } else {
        type = "data";
        desc = `${row.query_name || "File"} vs ${row.ref_name || "reference"}: ${Number(row.match_percentage)?.toFixed(1) ?? "100"}% match — no variants detected.`;
      }

      return { id: 2000 + idx, type, author: user.email, desc, time: relTimeLabel(row.created_at), ts };
    });

    // ── 5. Build research timeline ────────────────────────────────────────────
    const timeline = rows.slice(0, 10).map((row, idx) => {
      const muts = parseJSON(row.mutations_found);
      const indels = parseJSON(row.indels_found);
      const mutCount = muts.length + indels.length;
      const matchPct = Number(row.match_percentage);

      let type: "version" | "milestone" | "edit" | "access" = "version";
      let title = `Analysis: ${row.query_name || "file"}`;
      let detail = `Compared against ${row.ref_name || "reference"}.`;

      if (row.status === "failed") {
        type = "edit"; title = `Failed: ${row.query_name || "file"}`;
        detail = `Analysis failed — check pipeline configuration.`;
      } else if (row.status === "processing") {
        type = "access"; title = `Processing: ${row.query_name || "file"}`;
        detail = `Analysis in progress against ${row.ref_name || "reference"}.`;
      } else if (matchPct >= 99) {
        type = "milestone"; title = `Perfect Match: ${row.query_name || "file"}`;
        detail = `${matchPct.toFixed(2)}% match — no variants detected.`;
      } else if (mutCount > 5) {
        type = "version"; title = `High-Variant: ${row.query_name || "file"}`;
        detail = `${mutCount} variants, ${matchPct.toFixed(1)}% match to reference.`;
      } else {
        type = "edit"; title = `Complete: ${row.query_name || "file"}`;
        detail = `${mutCount} variant${mutCount !== 1 ? "s" : ""} — ${matchPct.toFixed(1)}% match to reference.`;
      }

      return {
        id: 3000 + idx,
        type,
        title,
        author: user.email,
        time: dateLabel(row.created_at),
        detail,
      };
    });

    // ── 6. Fetch exact contributions for graph ────────────────────────────────
    let contributors: any[] = [];
    let contributions: Record<string, { date: string; count: number }[]> = { "Workspace": [] };

    try {
      const crResult = await db.query(
        `SELECT
           u.id AS user_id,
           u.first_name,
           u.last_name,
           u.email,
           DATE(cr.created_at) AS date,
           COUNT(cr.id) AS count
         FROM comparison_results cr
         JOIN dna_files q ON cr.query_file_id = q.id
         JOIN users u ON q.user_id = u.id
         WHERE cr.created_at >= NOW() - INTERVAL '1 year'
         GROUP BY u.id, u.first_name, u.last_name, u.email, DATE(cr.created_at)
         ORDER BY date ASC`
      );

      const userMap = new Map();
      const workspaceCounts: Record<string, number> = {};

      for (const row of crResult.rows) {
        const uid = String(row.user_id);
        if (!userMap.has(uid)) {
          const fn = row.first_name || "";
          const ln = row.last_name || "";
          const emailStr = row.email || "Unknown";
          const init = (fn.charAt(0) + ln.charAt(0)).toUpperCase() || emailStr.substring(0, 2).toUpperCase();
          const name = fn || ln ? `${fn} ${ln}`.trim() : emailStr;
          
          userMap.set(uid, { id: uid, name, initials: init });
          contributions[uid] = [];
        }

        const dateStr = new Date(row.date).toISOString().split('T')[0];
        const count = parseInt(row.count, 10);

        contributions[uid].push({ date: dateStr, count });

        // Aggregate for Workspace
        workspaceCounts[dateStr] = (workspaceCounts[dateStr] || 0) + count;
      }

      contributors = Array.from(userMap.values());
      contributions["Workspace"] = Object.entries(workspaceCounts).map(([date, count]) => ({ date, count }));

    } catch (e) {
      console.error("[collab/stats] exact contributions error:", e);
    }

    const activeUserName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const activeUserInitials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "GN";

    return NextResponse.json({
      success: true,
      data: {
        activeUser: {
          id: String(user.id),
          name: activeUserName,
          initials: activeUserInitials,
          role: "Researcher", // default role
          color: "#10b981"
        },
        impactStats: {
          activeResearchers: contributors.length || 1,
          sharedDatasets: totalFiles,
          pipelinesExecuted: totalAnalyses,
          variantsIdentified: totalVariants,
          collabScore,
        },
        streams,
        timeline,
        runningCount,
        contributors,
        contributions,
      },
    });
  } catch (err) {
    console.error("[collab/stats] top-level error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
