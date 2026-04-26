import { NextRequest, NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();
    
    // Update the result to dismissed so it stops aggressively failing on the UI
    await db.query(`UPDATE comparison_results SET status = 'dismissed' WHERE id = $1`, [params.id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to dismiss analysis:", err);
    return NextResponse.json({ error: "Failed to dismiss" }, { status: 500 });
  }
}
