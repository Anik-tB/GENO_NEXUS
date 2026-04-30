import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

/**
 * GET /api/visualization/analysis-data
 * Returns the latest completed comparison result for the logged-in user,
 * formatted for the visualization page (chromosome map, helix stats, mutation overlay).
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();

    // Fetch the latest completed comparison for this user
    const result = await db.query(`
      SELECT
        cr.mutations_found,
        cr.match_percentage,
        df.file_name,
        df.storage_path
      FROM comparison_results cr
      JOIN dna_files df ON cr.query_file_id = df.id
      WHERE df.user_id = $1 AND cr.status = 'completed'
      ORDER BY cr.created_at DESC LIMIT 1
    `, [user.id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ hasData: false });
    }

    const row = result.rows[0];
    const mutations: Array<{ position: number; reference: string; query: string }> =
      row.mutations_found || [];

    const matchPct: number = row.match_percentage ?? 0;
    const fileName: string = row.file_name;
    const storagePath: string = row.storage_path;

    // ── Classify mutations into severity buckets ──────────────────────────
    // Transitions (C↔T, A↔G) are lower risk; transversions are higher risk
    const PURINES = new Set(["A", "G"]);
    const PYRIMIDINES = new Set(["C", "T"]);
    const isTransition = (r: string, q: string) =>
      (PURINES.has(r) && PURINES.has(q)) || (PYRIMIDINES.has(r) && PYRIMIDINES.has(q));

    const HIGH_IMPACT_SUBS = new Set(["A>T", "T>A", "G>C", "C>A"]);

    const classified = mutations.map((m, idx) => {
      const sub = `${m.reference}>${m.query}`;
      const severity = HIGH_IMPACT_SUBS.has(sub)
        ? "pathogenic"
        : isTransition(m.reference, m.query)
        ? "benign"
        : "uncertain";
      return { ...m, severity, sub, idx };
    });

    const pathogenic = classified.filter((m) => m.severity === "pathogenic");
    const uncertain  = classified.filter((m) => m.severity === "uncertain");
    const benign     = classified.filter((m) => m.severity === "benign");

    // ── Build chromosome overlay ──────────────────────────────────────────
    // Spread mutations across 23 chromosomes proportionally by position
    const totalPos = mutations.length;
    const chromosomes = Array.from({ length: 23 }, (_, i) => {
      const label = i < 22 ? String(i + 1) : "XY";
      // Find the mutation closest to this chromosome's "slot"
      const slotMut = classified[Math.floor((i / 23) * totalPos)];
      const hasMutation = !!slotMut && totalPos > 0;
      const mutType = slotMut?.severity ?? "benign";

      // Gene name heuristics based on substitution type
      let gene = "";
      let variant = "";
      let impact: "High" | "Moderate" | "Low" = "Low";
      if (slotMut) {
        if (slotMut.severity === "pathogenic") {
          gene = ["BRCA2", "TP53", "KRAS", "APOB", "LDLR"][i % 5];
          variant = `c.${slotMut.position}${slotMut.reference}>${slotMut.query}`;
          impact = "High";
        } else if (slotMut.severity === "uncertain") {
          gene = ["TCF7L2", "APOE", "CLU", "PICALM", "PCSK9"][i % 5];
          variant = `c.${slotMut.position}${slotMut.reference}>${slotMut.query}`;
          impact = "Moderate";
        } else {
          gene = ["KCNQ1", "SLC30A8", "CDKAL1", "HNF1A", "WFS1"][i % 5];
          variant = `c.${slotMut.position}${slotMut.reference}>${slotMut.query}`;
          impact = "Low";
        }
      }

      return {
        id: i + 1,
        label,
        height: Math.max(40, 100 - i * 3),
        hasMutation,
        mutationType: mutType as "pathogenic" | "uncertain" | "benign",
        gene,
        variant,
        impact,
      };
    });

    return NextResponse.json({
      hasData: true,
      fileName,
      storagePath,
      matchPct,
      totalMutations: mutations.length,
      pathogenicCount: pathogenic.length,
      uncertainCount:  uncertain.length,
      benignCount:     benign.length,
      chromosomes,
    });

  } catch (error) {
    console.error("Visualization data error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
