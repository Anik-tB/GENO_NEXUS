import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

// GET: Fetch unread message counts grouped by sender
export async function GET() {
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

    const db = assertDatabase();
    
    const result = await db.query(
      `SELECT sender_id, COUNT(*) as count 
       FROM private_messages 
       WHERE receiver_id = $1 AND is_read = FALSE
       GROUP BY sender_id`,
      [user.id]
    );

    const unreadCounts = result.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.sender_id] = parseInt(row.count, 10);
      return acc;
    }, {});

    return NextResponse.json({ unread: unreadCounts });
  } catch (error) {
    console.error("Failed to fetch unread counts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
