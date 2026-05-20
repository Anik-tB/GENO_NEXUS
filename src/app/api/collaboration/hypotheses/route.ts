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

function generateHypoId(existingIds: string[]): string {
  const nums = existingIds
    .map(id => parseInt(id.replace("H-", ""), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 400;
  return `H-${max + 1}`;
}

// ── GET /api/collaboration/hypotheses ────────────────────────
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();

    // Fetch all active hypotheses for this workspace (all users)
    const result = await db.query(
      `SELECT h.*, hm_counts.msg_count
       FROM hypotheses h
       LEFT JOIN (
         SELECT hypothesis_id, COUNT(*) AS msg_count
         FROM hypothesis_messages
         GROUP BY hypothesis_id
       ) hm_counts ON hm_counts.hypothesis_id = h.id
       WHERE h.active = TRUE
       ORDER BY h.updated_at DESC
       LIMIT 50`
    );

    const hypotheses = result.rows.map(row => ({
      id:          row.id,
      title:       row.title,
      tags:        typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags ?? []),
      annotations: typeof row.annotations === "string" ? JSON.parse(row.annotations) : (row.annotations ?? []),
      confidence:  row.confidence,
      version:     row.version,
      active:      row.active,
      comments:    Number(row.msg_count ?? row.comments ?? 0),
      avatars:     typeof row.avatars === "string" ? JSON.parse(row.avatars) : (row.avatars ?? []),
      lastEdited:  relTime(row.updated_at),
      chatMessages: [],  // loaded separately on detail page
    }));

    return NextResponse.json({ success: true, data: hypotheses });
  } catch (err) {
    console.error("[hypotheses GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST /api/collaboration/hypotheses ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, tags = [], annotations = [] } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const db = assertDatabase();

    // Get all existing IDs to generate next one
    const existing = await db.query("SELECT id FROM hypotheses ORDER BY created_at DESC");
    const newId = generateHypoId(existing.rows.map((r: { id: string }) => r.id));

    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "AU";

    const result = await db.query(
      `INSERT INTO hypotheses
         (id, user_id, title, tags, annotations, confidence, version, active, comments, avatars)
       VALUES ($1, $2, $3, $4, $5, 50, 1, TRUE, 0, $6)
       RETURNING *`,
      [
        newId,
        user.id,
        title.trim(),
        JSON.stringify(tags),
        JSON.stringify(annotations),
        JSON.stringify([initials]),
      ]
    );

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id:          row.id,
        title:       row.title,
        tags:        row.tags ?? [],
        annotations: row.annotations ?? [],
        confidence:  row.confidence,
        version:     row.version,
        active:      row.active,
        comments:    0,
        avatars:     row.avatars ?? [],
        lastEdited:  "just now",
        chatMessages: [],
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[hypotheses POST]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function relTime(ts: string | Date): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
