import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

// Returns user IDs that have been active in the last 5 minutes (sent/received a message)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ onlineIds: [] });
    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ onlineIds: [] });

    const db = assertDatabase();
    
    // A user is "online" if they sent a message in the last 5 minutes
    const res = await db.query(
      `SELECT DISTINCT sender_id AS id FROM private_messages
       WHERE created_at > NOW() - INTERVAL '5 minutes'
         AND sender_id != $1`,
      [user.id]
    );

    const onlineIds = res.rows.map((r: { id: string }) => r.id);
    return NextResponse.json({ onlineIds });
  } catch (error) {
    console.error("Presence check failed:", error);
    return NextResponse.json({ onlineIds: [] });
  }
}
