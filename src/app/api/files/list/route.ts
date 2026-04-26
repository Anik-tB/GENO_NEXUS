import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

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

    const db = assertDatabase();

    const result = await db.query(`
      SELECT id, file_name, file_size, file_type, storage_path, status, created_at
      FROM dna_files 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user.id]);

    return NextResponse.json({ success: true, files: result.rows });
  } catch (error) {
    console.error("Failed to list files:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
