import { NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();
    
    // Query historical analysis results for the current user.
    // We join dna_files to get ownership and file names.
    const res = await db.query(`
      SELECT 
        cr.id, 
        cr.status, 
        cr.match_percentage,
        cr.created_at, 
        q.file_name as query_name, 
        r.file_name as ref_name
      FROM comparison_results cr
      JOIN dna_files q ON cr.query_file_id = q.id
      JOIN dna_files r ON cr.reference_file_id = r.id
      WHERE q.user_id = $1
      ORDER BY cr.created_at DESC
      LIMIT 15
    `, [user.id]);

    return NextResponse.json({ success: true, history: res.rows });
  } catch (err) {
    console.error("History fetch error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
