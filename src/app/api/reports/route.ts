import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

async function getAuthedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) return null;
  return getUserFromSessionToken(token);
}

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = assertDatabase();
    
    const result = await db.query(
      `SELECT id, name, patient_id, size_bytes, status, created_at 
       FROM reports 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ success: true, reports: result.rows });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = assertDatabase();
    
    let body: any = null;
    const text = await req.text();
    if (text) {
      try { body = JSON.parse(text); } catch (e) {}
    }

    // Attempt to get the latest comparison result for the user
    const latestComparison = await db.query(`
      SELECT cr.id as comp_id, cr.mutations_found, cr.match_percentage, df.file_name, cr.detected_organism
      FROM comparison_results cr
      JOIN dna_files df ON cr.query_file_id = df.id
      WHERE df.user_id = $1 AND cr.status = 'completed'
      ORDER BY cr.created_at DESC LIMIT 1
    `, [user.id]);

    if (latestComparison.rowCount === 0) {
      return NextResponse.json({ error: "No completed analysis found. Please run an analysis first to generate a report." }, { status: 404 });
    }

    const compData = latestComparison.rows[0];
    const mutations = compData.mutations_found || [];
    const patientId = compData.file_name;
    const comparisonId = compData.comp_id;
    const sizeBytes = Math.floor(Math.random() * 2000000) + 500000; // Simulated PDF size

    let reportName = "";
    let content: any = {};

    if (body && body.disease) {
      // Export from specific Prediction
      reportName = `${body.disease} Risk Assessment`;
      content = {
        synopsis: `Targeted AI analysis reveals a ${body.severity} risk profile for ${body.disease}. Model confidence is ${body.confidence}%. ${body.insight || ''}`,
        findings: [
          { 
            gene: body.genes || "Multiple", 
            variant: "Detected", 
            risk: body.severity.charAt(0).toUpperCase() + body.severity.slice(1), 
            implication: `Pathogenic markers identified linked to ${body.disease}.` 
          }
        ],
        risks: [
          { 
            label: body.disease, 
            pct: body.risk || 0, 
            color: body.severity === 'high' ? 'var(--gn-danger)' : body.severity === 'medium' ? 'var(--gn-warning)' : 'var(--gn-success)' 
          }
        ]
      };
    } else {
      // Generate Comprehensive Report from actual mutations
      reportName = "Comprehensive Genomic Profile";
      
      const highRiskCount = mutations.filter((m: any) => m.severity === 'high').length;
      const drCount = mutations.filter((m: any) => m.drug_resistance_site).length;
      
      const snpsCount = mutations.filter((m: any) => m.type !== 'Insertion' && m.type !== 'Deletion').length;
      const indelsCount = mutations.filter((m: any) => m.type === 'Insertion' || m.type === 'Deletion').length;
      const transitionsCount = mutations.filter((m: any) => m.type === 'Transition').length;
      const transversionsCount = mutations.filter((m: any) => m.type === 'Transversion').length;
      const tsTvRatio = transversionsCount === 0 ? "N/A" : (transitionsCount / transversionsCount).toFixed(2);

      let synopsis = `Analysis of ${patientId} completed successfully with a ${compData.match_percentage}% match to the reference genome. `;
      if (highRiskCount > 0) {
        synopsis += `The profile indicates ${highRiskCount} high-severity mutations requiring clinical review. `;
      } else {
        synopsis += `No high-severity mutations were detected in the analyzed sequences. `;
      }
      if (drCount > 0) {
        synopsis += `WARNING: ${drCount} potential drug-resistance markers were identified.`;
      }

      const qc = {
        totalVariants: mutations.length,
        snps: snpsCount,
        indels: indelsCount,
        tsTvRatio: tsTvRatio,
        matchPercentage: compData.match_percentage
      };

      const recommendations = [];
      if (highRiskCount > 0) {
        recommendations.push("Immediate clinical review of high-severity variants by a certified genomic specialist.");
        recommendations.push("Consider confirmatory Sanger sequencing for high-confidence pathogenic markers.");
      }
      if (drCount > 0) {
        recommendations.push("Consult protocol guidelines; avoid contraindicated pharmacological agents due to identified resistance markers.");
      }
      if (highRiskCount === 0 && drCount === 0) {
        recommendations.push("Routine follow-up. No actionable high-risk pathogenic variants detected.");
      }

      const methodology = "Genomic analysis performed using GenoNexus Sequence Alignment Pipeline. Sequences were mapped against reference genomes to identify structural and single-nucleotide variations. Variant classification and severity scoring driven by proprietary heuristic AI modeling and algorithmic benchmarking.";

      // Take top 6 most severe mutations for findings
      const topMutations = [...mutations]
        .sort((a: any, b: any) => {
          const sMap: any = { high: 3, medium: 2, low: 1 };
          return (sMap[b.severity] || 0) - (sMap[a.severity] || 0);
        })
        .slice(0, 6);

      const findings = topMutations.map((m: any) => ({
        gene: m.functional_region || "Intergenic",
        variant: m.type === 'Insertion' || m.type === 'Deletion' ? m.type : `${m.reference}>${m.query}`,
        risk: m.severity ? m.severity.charAt(0).toUpperCase() + m.severity.slice(1) : "Unknown",
        implication: m.drug_resistance_site ? "Known drug-resistance site." : `Pos: ${m.position} (Conf: ${Math.round(m.ai_confidence * 100)}%)`
      }));

      const totalMutations = mutations.length || 1; 
      const drRiskPct = Math.min(100, Math.round((drCount / totalMutations) * 100 * 5));
      const overallRiskPct = Math.min(100, Math.round(((highRiskCount * 3 + mutations.filter((m:any) => m.severity === 'medium').length) / totalMutations) * 100));

      content = {
        synopsis,
        qc,
        findings: findings.length > 0 ? findings : [{ gene: "N/A", variant: "None", risk: "Low", implication: "No significant variants detected." }],
        risks: [
          { label: "Overall Pathogenic Risk", pct: overallRiskPct, color: overallRiskPct > 50 ? 'var(--gn-danger)' : overallRiskPct > 20 ? 'var(--gn-warning)' : 'var(--gn-success)' },
          { label: "Drug Resistance Potential", pct: drRiskPct, color: drRiskPct > 0 ? 'var(--gn-danger)' : 'var(--gn-success)' }
        ],
        recommendations,
        methodology
      };
    }

    const result = await db.query(
      `INSERT INTO reports (user_id, comparison_id, name, patient_id, size_bytes, status, content) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, patient_id, size_bytes, status, created_at`,
      [user.id, comparisonId, reportName, patientId, sizeBytes, 'Signed', JSON.stringify(content)]
    );

    return NextResponse.json({ success: true, report: result.rows[0] });
  } catch (error) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
