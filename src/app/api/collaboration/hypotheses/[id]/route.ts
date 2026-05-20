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

interface RouteParams { params: Promise<{ id: string }> }

// ── GET /api/collaboration/hypotheses/[id] ───────────────────
// Returns full hypothesis including chat messages
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = assertDatabase();

    const [hypoRes, msgRes] = await Promise.all([
      db.query("SELECT * FROM hypotheses WHERE id = $1 AND active = TRUE", [id]),
      db.query(
        `SELECT id, author, text, is_ai, created_at
         FROM hypothesis_messages WHERE hypothesis_id = $1
         ORDER BY created_at ASC`,
        [id]
      ),
    ]);

    if (hypoRes.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = hypoRes.rows[0];
    const chatMessages = msgRes.rows.map((m: {
      id: number; author: string; text: string; is_ai: boolean; created_at: string;
    }) => ({
      id:     m.id,
      author: m.author,
      text:   m.text,
      isAI:   m.is_ai,
      time:   new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }));

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
        comments:    chatMessages.length,
        avatars:     row.avatars ?? [],
        lastEdited:  relTime(row.updated_at),
        chatMessages,
      },
    });
  } catch (err) {
    console.error("[hypotheses/[id] GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── PATCH /api/collaboration/hypotheses/[id] ─────────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const db = assertDatabase();

    const allowed = ["title", "tags", "annotations", "confidence", "version", "active"];
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    for (const key of allowed) {
      if (key in body) {
        const val = ["tags", "annotations"].includes(key)
          ? JSON.stringify(body[key])
          : body[key];
        sets.push(`${key} = $${idx}`);
        vals.push(val);
        idx++;
      }
    }

    // Handle new chat message
    if (body.message) {
      const { author, text, isAI = false } = body.message;
      await db.query(
        `INSERT INTO hypothesis_messages (hypothesis_id, author, text, is_ai)
         VALUES ($1, $2, $3, $4)`,
        [id, author, text, isAI]
      );
      // Update comment count
      await db.query(
        `UPDATE hypotheses SET comments = (
           SELECT COUNT(*) FROM hypothesis_messages WHERE hypothesis_id = $1
         ), updated_at = NOW() WHERE id = $1`,
        [id]
      );
      return NextResponse.json({ success: true });
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    vals.push(id);
    await db.query(
      `UPDATE hypotheses SET ${sets.join(", ")}, updated_at = NOW()
       WHERE id = $${idx}`,
      vals
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hypotheses/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE /api/collaboration/hypotheses/[id] ────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = assertDatabase();

    await db.query(
      "UPDATE hypotheses SET active = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hypotheses/[id] DELETE]", err);
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
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
