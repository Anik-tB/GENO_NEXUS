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
    const mutations: any[] = row.mutations_found || [];
    const indels: any[] = row.indels_found || [];

    const matchPct: number = row.match_percentage ?? 0;
    const fileName: string = row.file_name;
    const storagePath: string = row.storage_path;
    const organism: string = row.detected_organism || "Unknown";

    // Bioinformatics metrics
    const refLength = row.reference_length || (mutations.length > 0 ? Math.max(...mutations.map((m: any) => m.position)) : 30000);
    const transitionsCount = mutations.filter(m => m.type === 'Transition').length;
    const transversionsCount = mutations.filter(m => m.type === 'Transversion').length;
    const tsTvRatio = transversionsCount > 0 ? (transitionsCount / transversionsCount).toFixed(2) : (transitionsCount > 0 ? "∞" : "0.00");
    
    const genomeKb = refLength > 0 ? refLength / 1000 : 1;
    const mutFreq = (mutations.length / genomeKb).toFixed(2);

    const insertions = indels.filter(i => i.type === 'insertion').length;
    const deletions = indels.filter(i => i.type === 'deletion').length;
    const indelRatio = deletions > 0 ? (insertions / deletions).toFixed(2) : (insertions > 0 ? "∞" : "0.00");

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

    // ── Build advanced chromosome mapping ─────────────────────────────────
    // Add small buffer so the last mutation doesn't fall out of bounds
    const binSize = (refLength + 10) / 23;

    const chromosomes = Array.from({ length: 23 }, (_, i) => {
      const label = i < 22 ? String(i + 1) : "XY";
      const chromStart = i * binSize;
      const chromEnd = (i + 1) * binSize;
      
      // Find all mutations that fall into this chromosome's bucket
      const chrMutations = classified
        .filter(m => m.position >= chromStart && m.position < chromEnd)
        .map(m => {
          const relativePosPct = ((m.position - chromStart) / binSize) * 100;
          
          let impact = "Low";
          if (m.severity === "pathogenic") impact = "High";
          if (m.severity === "uncertain") impact = "Moderate";
          
          return {
            id: m.idx,
            position: m.position,
            relativePosPct: Math.min(98, Math.max(2, relativePosPct)), // Keep within visual bounds
            type: m.type || "SNP",
            severity: m.severity as "pathogenic" | "uncertain" | "benign",
            variant: `g.${m.position}${m.reference}>${m.query}`,
            gene: m.functional_region || "Intergenic",
            impact,
            ai_confidence: m.ai_confidence || 0.5,
          };
        });

      return {
        id: i + 1,
        label,
        height: Math.max(40, 100 - i * 3), // Visual staggered height
        mutations: chrMutations,
      };
    });

    return NextResponse.json({
      hasData: true,
      fileName,
      storagePath,
      organism,
      matchPct,
      totalMutations: mutations.length,
      pathogenicCount: pathogenic.length,
      uncertainCount:  uncertain.length,
      benignCount:     benign.length,
      tsTvRatio,
      mutFreq,
      indelRatio,
      chromosomes,
    });

  } catch (error) {
    console.error("Visualization data error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
