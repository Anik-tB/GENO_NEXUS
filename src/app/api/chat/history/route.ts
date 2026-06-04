import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

// GET: Fetch message history between two users
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const peerId = searchParams.get("peerId");
    const since = searchParams.get("since"); // ISO timestamp for polling

    if (!peerId) {
      return NextResponse.json({ error: "peerId is required" }, { status: 400 });
    }

    const db = assertDatabase();

    let query = `
      SELECT id, sender_id, receiver_id, content, file_url, file_type, created_at 
      FROM private_messages 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
    `;
    const params: (string)[] = [user.id, peerId];

    if (since) {
      query += ` AND created_at > $3`;
      params.push(since);
    }

    query += ` ORDER BY created_at ASC`;

    const res = await db.query(query, params);
    return NextResponse.json({ messages: res.rows });
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Send a private message directly via REST (no WebSocket required)
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
    const { receiverId, content, fileUrl, fileType } = body;

    if (!receiverId || (!content?.trim() && !fileUrl)) {
      return NextResponse.json({ error: "Missing receiverId or message content" }, { status: 400 });
    }

    const db = assertDatabase();
    const result = await db.query(
      `INSERT INTO private_messages (sender_id, receiver_id, content, file_url, file_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sender_id, receiver_id, content, file_url, file_type, created_at`,
      [user.id, receiverId, content?.trim() || null, fileUrl || null, fileType || null]
    );

    return NextResponse.json({ message: result.rows[0] });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
