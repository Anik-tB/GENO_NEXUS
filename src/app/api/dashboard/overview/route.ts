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
    
    // 1. Get all completed runs for the user to aggregate metrics
    const completedRes = await db.query(`
      SELECT 
        cr.mutations_found,
        cr.indels_found,
        cr.detected_organism,
        cr.analysis_metadata,
        cr.created_at
      FROM comparison_results cr
      JOIN dna_files df ON cr.query_file_id = df.id
      WHERE df.user_id = $1 AND cr.status = 'completed'
      ORDER BY cr.created_at DESC
    `, [user.id]);

    let totalMutations = 0;
    let urgentMarkers = 0;
    let totalAiConfidence = 0;
    let confidenceSamples = 0;
    let totalBasesAnalyzed = 0;

    for (const row of completedRes.rows) {
      const muts = row.mutations_found || [];
      const indels = row.indels_found || [];
      
      const allVars = [...muts, ...indels];
      totalMutations += allVars.length;
      
      allVars.forEach((v: any) => {
        if (v.severity === 'high') urgentMarkers++;
        if (typeof v.ai_confidence === 'number') {
          totalAiConfidence += v.ai_confidence;
          confidenceSamples++;
        }
      });
      
      if (row.analysis_metadata && row.analysis_metadata.query_length) {
        totalBasesAnalyzed += row.analysis_metadata.query_length;
      }
    }

    const avgConfidence = confidenceSamples > 0 ? (totalAiConfidence / confidenceSamples) * 100 : 0;
    
    let riskLevel = "Low";
    if (urgentMarkers > 0) riskLevel = "High";
    else if (totalMutations > 0) riskLevel = "Moderate";

    // 2. Generate Insight Banner
    let insightBanner = {
      title: "AI Insight · Standard System Baseline",
      text: "No active high-risk genomic signatures detected in recent cohorts. Continue standard monitoring protocols.",
      organism: "None"
    };

    if (completedRes.rows.length > 0) {
      const latest = completedRes.rows[0];
      const org = latest.detected_organism || "Unknown Sequence";
      const muts = latest.mutations_found || [];
      const indels = latest.indels_found || [];
      const latestUrgent = [...muts, ...indels].filter((m:any) => m.severity === 'high').length;
      
      if (latestUrgent > 0) {
        insightBanner = {
          title: `AI Insight · High Genetic Risk Detected`,
          text: `Mutation patterns in the recent ${org} cohort indicate severe pathogenic signatures. Immediate review recommended.`,
          organism: org
        };
      } else if (muts.length > 0 || indels.length > 0) {
        insightBanner = {
          title: `AI Insight · Moderate Genetic Risk Detected`,
          text: `Variants of unknown or moderate significance detected in the recent ${org} analysis. Clinical correlation required.`,
          organism: org
        };
      } else {
        insightBanner = {
          title: `AI Insight · Safe Cohort`,
          text: `The recent ${org} analysis perfectly matches the reference genome. No pathogenic variants detected.`,
          organism: org
        };
      }
    }

    // 3. Recent Activity Feed
    const activityRes = await db.query(`
      SELECT 
        cr.status, 
        cr.created_at, 
        q.file_name as file_name
      FROM comparison_results cr
      JOIN dna_files q ON cr.query_file_id = q.id
      WHERE q.user_id = $1
      ORDER BY cr.created_at DESC
      LIMIT 4
    `, [user.id]);

    const recentActivity = activityRes.rows.map(row => {
      const diffMs = Date.now() - new Date(row.created_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      let timeAgo = "Just now";
      if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else if (diffHours > 0) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else if (diffMins > 0) timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

      let status = "Processing";
      if (row.status === 'completed') status = "Complete";
      if (row.status === 'failed') status = "Failed";

      return {
        action: "Sequence Analysis",
        file: row.file_name,
        time: timeAgo,
        status: status,
        type: "analysis"
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        genesAnalyzed: totalBasesAnalyzed > 0 ? totalBasesAnalyzed.toLocaleString() : completedRes.rows.length.toString(),
        analyzedNote: totalBasesAnalyzed > 0 ? "bases aligned" : "sequences analyzed",
        mutationCount: totalMutations,
        urgentMarkers: urgentMarkers,
        riskLevel: riskLevel,
        avgConfidence: avgConfidence,
        insightBanner: insightBanner,
        recentActivity: recentActivity
      }
    });

  } catch (err) {
    console.error("Overview stats error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
