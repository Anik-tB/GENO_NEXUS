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

// ── GET /api/collaboration/alerts ────────────────────────────
// Returns undismissed alerts. Auto-generates from high-severity variants.
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();
    const uid = user.id;

    // Auto-generate alerts from high-severity mutations not yet alerted
    await autoGenerateAlerts(db, uid);

    const result = await db.query(
      `SELECT id, type, title, desc_text AS desc, gene, action, region, created_at
       FROM collab_alerts
       WHERE user_id = $1 AND dismissed = FALSE
       ORDER BY created_at DESC
       LIMIT 10`,
      [uid]
    );

    const alerts = result.rows.map((row: any) => ({
      id:     row.id,
      type:   row.type,
      title:  row.title,
      desc:   row.desc,
      gene:   row.gene ?? undefined,
      action: row.action ?? undefined,
      region: row.region ?? undefined,
      time:   relTime(row.created_at),
      dismissed: false,
    }));

    return NextResponse.json({ success: true, data: alerts });
  } catch (err) {
    console.error("[alerts GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── PATCH /api/collaboration/alerts ──────────────────────────
// Dismiss one or all alerts
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, dismissAll } = await req.json();
    const db = assertDatabase();

    if (dismissAll) {
      await db.query(
        "UPDATE collab_alerts SET dismissed = TRUE WHERE user_id = $1",
        [user.id]
      );
    } else if (id) {
      await db.query(
        "UPDATE collab_alerts SET dismissed = TRUE WHERE id = $1 AND user_id = $2",
        [id, user.id]
      );
    } else {
      return NextResponse.json({ error: "id or dismissAll required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[alerts PATCH]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── Auto-generate alerts from high-severity variants ─────────
async function autoGenerateAlerts(db: any, userId: string) {
  try {
    // Find completed analyses with high-severity mutations not yet alerted
    const result = await db.query(
      `SELECT cr.id, cr.mutations_found, cr.detected_organism, q.file_name
       FROM comparison_results cr
       JOIN dna_files q ON cr.query_file_id = q.id
       WHERE q.user_id = $1
         AND cr.status = 'completed'
         AND cr.mutations_found IS NOT NULL
         AND cr.mutations_found != '[]'
         AND NOT EXISTS (
           SELECT 1 FROM collab_alerts
           WHERE user_id = $1
             AND auto_gen = TRUE
             AND desc_text LIKE '%' || q.file_name || '%'
         )
       ORDER BY cr.created_at DESC
       LIMIT 5`,
      [userId]
    );

    for (const row of result.rows) {
      let mutations: any[] = [];
      try {
        mutations = typeof row.mutations_found === "string"
          ? JSON.parse(row.mutations_found)
          : (row.mutations_found ?? []);
      } catch { continue; }

      const highSev = mutations.filter((m: any) => m?.severity === "high" || m?.severity === "critical");
      if (highSev.length === 0) continue;

      const firstGene = highSev[0]?.gene ?? highSev[0]?.position ?? null;
      const organism  = row.detected_organism ? ` (${row.detected_organism})` : "";

      const alertType = highSev.length >= 5 ? "critical" : "warning";
      const title     = `${highSev.length} high-severity variant${highSev.length > 1 ? "s" : ""} detected`;
      const desc      = `Found in ${row.file_name}${organism}. Immediate clinical review recommended.`;

      await db.query(
        `INSERT INTO collab_alerts (user_id, type, title, desc_text, gene, action, auto_gen)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [
          userId,
          alertType,
          title,
          desc,
          firstGene,
          "Review in Analysis Dashboard",
        ]
      );
    }
  } catch (e) {
    console.error("[autoGenerateAlerts]", e);
  }
}

function relTime(ts: string | Date): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}
