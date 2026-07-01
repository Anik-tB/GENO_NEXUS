import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

const PURINES = new Set(["A", "G"]);
const PYRIMIDINES = new Set(["C", "T"]);
const HIGH_IMPACT = new Set(["A>T", "T>A", "G>C", "C>A"]);

function classify(ref: string, query: string): "pathogenic" | "uncertain" | "benign" {
  const sub = `${ref}>${query}`;
  if (HIGH_IMPACT.has(sub)) return "pathogenic";
  const isTransition =
    (PURINES.has(ref) && PURINES.has(query)) ||
    (PYRIMIDINES.has(ref) && PYRIMIDINES.has(query));
  return isTransition ? "benign" : "uncertain";
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();

    const result = await db.query(`
      SELECT cr.mutations_found, cr.match_percentage, df.file_name
      FROM comparison_results cr
      JOIN dna_files df ON cr.query_file_id = df.id
      WHERE df.user_id = $1 AND cr.status = 'completed'
      ORDER BY cr.created_at DESC LIMIT 1
    `, [user.id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ mutations: [] });
    }

    const raw: any[] = result.rows[0].mutations_found || [];

    const mutations = raw.map((m: any) => {
      let severity: "pathogenic" | "uncertain" | "benign" = "uncertain";
      if (m.severity === "high" || m.severity === "pathogenic") {
        severity = "pathogenic";
      } else if (m.severity === "low" || m.severity === "benign") {
        severity = "benign";
      } else if (m.severity === "medium" || m.severity === "uncertain") {
        severity = "uncertain";
      } else {
        severity = classify(m.reference, m.query);
      }
      return {
        ...m,
        severity,
        sub: `${m.reference}>${m.query}`,
      };
    });

    return NextResponse.json({
      mutations,
      matchPct: result.rows[0].match_percentage,
      fileName: result.rows[0].file_name,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ mutations: [] });
  }
}
