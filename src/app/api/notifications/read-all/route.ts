import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

export async function PATCH(req: NextRequest) {
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
    
    await db.query(
      `UPDATE user_notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
      [user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
