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

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({ results: [] });
    }

    const db = assertDatabase();
    
    const queryText = `
      (
        SELECT 
          id, 
          file_name as title, 
          'DNA File' as type, 
          created_at, 
          status, 
          NULL::numeric as match_percentage
        FROM dna_files
        WHERE user_id = $1 AND file_name ILIKE $2
      )
      UNION ALL
      (
        SELECT 
          cr.id, 
          df1.file_name || ' vs ' || df2.file_name as title, 
          'Comparison' as type, 
          cr.created_at, 
          cr.status,
          cr.match_percentage
        FROM comparison_results cr
        JOIN dna_files df1 ON cr.query_file_id = df1.id
        JOIN dna_files df2 ON cr.reference_file_id = df2.id
        WHERE df1.user_id = $1 
          AND (df1.file_name ILIKE $2 OR df2.file_name ILIKE $2)
      )
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const { rows: results } = await db.query(queryText, [user.id, `%${query}%`]);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
