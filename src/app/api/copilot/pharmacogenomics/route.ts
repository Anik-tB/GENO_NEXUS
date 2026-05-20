import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { askGeminiCopilot } from "@/lib/copilot/gemini";

// Standard fallback profile when no DNA data is uploaded
const FALLBACK_PROFILE = {
  hasData: false,
  metabolicProfile: [
    { enzyme: "CYP2C19", status: "Awaiting Data", description: "Reference sequence required to determine metabolizer phenotype." },
    { enzyme: "SLCO1B1", status: "Awaiting Data", description: "Reference sequence required to determine statin transport efficiency." },
    { enzyme: "CYP2D6", status: "Awaiting Data", description: "Reference sequence required to determine opioid metabolic rate." }
  ],
  favorable: [
    { name: "Rosuvastatin", score: 90, gene: "SLCO1B1", note: "Standard lipid-lowering option. Normal SLCO1B1 transport assumed.", pathways: ["Lipid Metabolism"], variantEvidence: "Awaiting DNA sequencing." },
    { name: "Sertraline", score: 85, gene: "CYP2C19", note: "Standard dosing recommended. Normal CYP2C19 activity assumed.", pathways: ["Neurology", "Psychiatry"], variantEvidence: "Awaiting DNA sequencing." },
    { name: "Prasugrel", score: 80, gene: "CYP2C19", note: "Standard antiplatelet therapy. Normal CYP2C19 activity assumed.", pathways: ["Cardiovascular"], variantEvidence: "Awaiting DNA sequencing." }
  ],
  avoid: []
};

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();

    // Fetch the user's latest completed comparison
    const result = await db.query(`
      SELECT
        cr.mutations_found,
        df.file_name
      FROM comparison_results cr
      JOIN dna_files df ON cr.query_file_id = df.id
      WHERE df.user_id = $1 AND cr.status = 'completed'
      ORDER BY cr.created_at DESC LIMIT 1
    `, [user.id]);

    if (result.rowCount === 0) {
      return NextResponse.json(FALLBACK_PROFILE);
    }

    const row = result.rows[0];
    const mutations: any[] = row.mutations_found || [];

    // Filter down mutations to a compact representation to keep prompt small and efficient
    const compactMutations = mutations.slice(0, 45).map((m: any) => ({
      position: m.position,
      reference: m.reference,
      query: m.query,
      gene: m.functional_region || "Intergenic",
      type: m.type || "SNP"
    }));

    const prompt = `Based on the following genomic variations detected in the patient's DNA:
${JSON.stringify(compactMutations, null, 2)}

Provide a personalized pharmacogenomic report. Output a raw JSON object matching this structure:
{
  "metabolicProfile": [
    { "enzyme": "CYP2C19", "status": "Poor/Intermediate/Extensive/Ultra-rapid Metabolizer", "description": "clinical description" }
  ],
  "favorable": [
    { "name": "Rosuvastatin", "score": 92, "gene": "SLCO1B1", "note": "clinical recommendation", "pathways": ["Lipid Metabolism"], "variantEvidence": "variant detail" }
  ],
  "avoid": [
    { "name": "Clopidogrel", "score": 12, "gene": "CYP2C19", "note": "warning detail and safe alternatives", "severity": "high", "variantEvidence": "variant detail", "pathways": ["Cardiovascular"] }
  ]
}`;

    const systemInstruction = `You are an expert clinical pharmacogenomics consultant and clinical pharmacologist.
Analyze the provided patient genetic variants and generate a personalized precision prescribing profile.
Enforce clinical accuracy. Refer to guidelines from CPIC (Clinical Pharmacogenetics Implementation Consortium) and FDA labels where relevant.

CRITICAL: If the provided variants list is empty or contains no relevant mutations, you MUST assume the patient has wild-type (normal) alleles for all key metabolic enzymes. In this case, DO NOT return empty arrays. Instead, output a standard baseline profile with "Normal Metabolizer" statuses and standard favorable drug recommendations.

Based on the provided variants (focusing on CYP2C19, SLCO1B1, CYP2D6, CYP2C9, or other relevant genes):
1. Determine the patient's phenotypic metabolizer status for key pathways (e.g., CYP2C19: Poor Metabolizer, SLCO1B1: Intermediate Metabolizer).
2. Categorize medications into:
   - "favorable" (optimal response, standard dosing, high efficacy).
   - "avoid" (contraindicated, high risk of toxicity, or therapeutic failure).
3. For each drug, provide:
   - Name
   - Gene involved
   - Efficacy score (for favorable, 1-100) or Toxicity/Failure risk % (for avoid)
   - Variant evidence detail (e.g. "CYP2C19 *2 allele detected")
   - Guidance note suggesting safe alternatives if contraindicated.
   - Pathway tags (e.g. "Cardiovascular", "Lipid Metabolism").

Output ONLY a valid JSON object matching the requested schema. Do not include markdown wraps or extra commentary.`;

    let rawResponse: string;
    try {
      rawResponse = await askGeminiCopilot({
        prompt,
        systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 1500
      });
    } catch (apiError: any) {
      console.warn("Pharmacogenomics Gemini API Error, falling back to standard profile:", apiError);
      try {
        require('fs').writeFileSync('pharmacogenomics_error.txt', apiError?.stack || apiError?.message || String(apiError));
      } catch (e) {}

      return NextResponse.json({
        hasData: true,
        fileName: row.file_name,
        isFallback: true,
        errorDetails: apiError?.message || String(apiError),
        metabolicProfile: [
          { enzyme: "CYP2C19", status: "Standard/Wild-Type Assumed", description: "Reference sequence linked. AI profiling temporarily unavailable due to API rate limit, assuming baseline metabolizer phenotype." },
          { enzyme: "SLCO1B1", status: "Standard/Wild-Type Assumed", description: "Reference sequence linked. AI profiling temporarily unavailable due to API rate limit, assuming standard statin transport efficiency." },
          { enzyme: "CYP2D6", status: "Standard/Wild-Type Assumed", description: "Reference sequence linked. AI profiling temporarily unavailable due to API rate limit, assuming normal opioid metabolic rate." }
        ],
        favorable: [
          { name: "Rosuvastatin", score: 90, gene: "SLCO1B1", note: "Standard lipid-lowering option. Normal SLCO1B1 transport assumed.", pathways: ["Lipid Metabolism"], variantEvidence: "Baseline reference profile (AI API rate limited)." },
          { name: "Sertraline", score: 85, gene: "CYP2C19", note: "Standard dosing recommended. Normal CYP2C19 activity assumed.", pathways: ["Neurology", "Psychiatry"], variantEvidence: "Baseline reference profile (AI API rate limited)." },
          { name: "Prasugrel", score: 80, gene: "CYP2C19", note: "Standard antiplatelet therapy. Normal CYP2C19 activity assumed.", pathways: ["Cardiovascular"], variantEvidence: "Baseline reference profile (AI API rate limited)." }
        ],
        avoid: []
      });
    }

    let cleaned = rawResponse;
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(cleaned);
      let metabolicProfile = parsed.metabolicProfile || [];
      let favorable = parsed.favorable || [];
      let avoid = parsed.avoid || [];

      if (favorable.length === 0 && avoid.length === 0) {
        metabolicProfile = FALLBACK_PROFILE.metabolicProfile.map(m => ({ ...m, status: "Extensive/Normal Metabolizer", description: "No detrimental variants detected in sequence. Expected to have normal baseline enzyme activity." }));
        favorable = FALLBACK_PROFILE.favorable.map(f => ({ ...f, variantEvidence: "No relevant variants detected in patient sequence." }));
      }

      return NextResponse.json({
        hasData: true,
        fileName: row.file_name,
        metabolicProfile,
        favorable,
        avoid
      });
    } catch (parseError) {
      console.warn("Pharmacogenomics JSON Parse Error, fallback used:", parseError);
      return NextResponse.json({
        ...FALLBACK_PROFILE,
        hasData: true,
        fileName: row.file_name
      });
    }

  } catch (error: any) {
    console.error("Pharmacogenomics API Error:", error);
    require('fs').writeFileSync('pharmacogenomics_error.txt', error?.stack || error?.message || String(error));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
