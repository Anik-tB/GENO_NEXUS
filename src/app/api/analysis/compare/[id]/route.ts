import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify the user owns one of the files being compared to ensure security
    const result = await db.query(`
      SELECT cr.id, cr.status, cr.match_percentage, cr.mutations_found,
             cr.detected_organism, cr.alignment_score, cr.indels_found,
             cr.analysis_metadata, cr.created_at
      FROM comparison_results cr
      JOIN dna_files df ON cr.query_file_id = df.id
      WHERE cr.id = $1 AND df.user_id = $2
    `, [id, user.id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Comparison not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, result: result.rows[0] });
  } catch (error) {
    console.error("Failed to check status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
