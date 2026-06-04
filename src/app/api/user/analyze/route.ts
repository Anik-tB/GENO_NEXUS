import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { randomUUID } from "node:crypto";
import path from "path";
import fs from "fs";

// NCBI reference accessions for each organism — mirrors the Python engine's BUILTIN_REFERENCES
const ORGANISM_NCBI_URLS: Record<string, string> = {
  "HIV-1":               "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_001802.1&rettype=fasta&retmode=text",
  "HIV-2":               "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_001722.1&rettype=fasta&retmode=text",
  "SARS-CoV-2":          "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_045512.2&rettype=fasta&retmode=text",
  "Influenza-A":         "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_002016.1&rettype=fasta&retmode=text",
  "Influenza-B":         "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_002204.1&rettype=fasta&retmode=text",
  "Hepatitis-B":         "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_003977.2&rettype=fasta&retmode=text",
  "Hepatitis-C":         "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_004102.1&rettype=fasta&retmode=text",
  "Dengue-1":            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_001477.1&rettype=fasta&retmode=text",
  "Ebola":               "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_002549.1&rettype=fasta&retmode=text",
  "Monkeypox":           "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_063383.1&rettype=fasta&retmode=text",
  "BRCA1 (Homo sapiens)":"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NM_007294.4&rettype=fasta&retmode=text",
};

// Detect organism from the FASTA header line (mirrors Python engine logic)
function detectOrganism(header: string): string {
  const h = header.toUpperCase();
  const patterns: Record<string, string[]> = {
    "BRCA1 (Homo sapiens)": ["BRCA1", "HOMO SAPIENS", "NC_000017", "NM_007294"],
    "HIV-1":       ["HIV-1", "HIV1", "HUMAN IMMUNODEFICIENCY VIRUS 1", "NC_001802"],
    "HIV-2":       ["HIV-2", "HIV2", "HUMAN IMMUNODEFICIENCY VIRUS 2", "NC_001722"],
    "SARS-CoV-2":  ["SARS-COV-2", "SARS2", "COVID", "NC_045512", "SEVERE ACUTE"],
    "Influenza-A": ["INFLUENZA A", "H1N1", "H3N2", "NC_002016"],
    "Influenza-B": ["INFLUENZA B", "NC_002204"],
    "Hepatitis-B": ["HEPATITIS B", "HBV", "NC_003977"],
    "Hepatitis-C": ["HEPATITIS C", "HCV", "NC_004102"],
    "Dengue-1":    ["DENGUE", "DENV", "NC_001477"],
    "Ebola":       ["EBOLA", "EBOV", "NC_002549"],
    "Monkeypox":   ["MONKEYPOX", "MPXV", "NC_063383"],
  };
  for (const [organism, tokens] of Object.entries(patterns)) {
    if (tokens.some(t => h.includes(t))) return organism;
  }
  return "Unknown";
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();

    // 1. Get the user's latest locally uploaded file
    const queryRes = await db.query(`
      SELECT id, storage_path, file_name FROM dna_files
      WHERE user_id = $1 AND storage_path NOT LIKE 'http%'
      ORDER BY created_at DESC LIMIT 1
    `, [user.id]);

    if (!queryRes.rowCount || queryRes.rowCount === 0) {
      return NextResponse.json({ error: "No uploaded file found. Please upload a genomic file first." }, { status: 400 });
    }

    const queryFile = queryRes.rows[0];
    const queryFileId = queryFile.id;
    const absoluteQueryPath = path.join(process.cwd(), "public", queryFile.storage_path);

    // 2. Read the FASTA header from the file to detect the organism
    let detectedOrganism = "Unknown";
    try {
      const fileContent = fs.readFileSync(absoluteQueryPath, "utf-8");
      const firstLine = fileContent.split(/\r?\n/)[0] || "";
      detectedOrganism = detectOrganism(firstLine);
    } catch {
      return NextResponse.json({ error: "Could not read uploaded file." }, { status: 500 });
    }

    // 3. Look up the correct NCBI reference URL for this organism
    const referenceUrl = ORGANISM_NCBI_URLS[detectedOrganism];
    if (!referenceUrl) {
      return NextResponse.json({
        error: `Could not determine the correct reference genome for your file (detected: ${detectedOrganism}). Please ensure your FASTA file has a descriptive header line (e.g. ">SARS-CoV-2 ...").`
      }, { status: 400 });
    }

    // 4. Check if we already have a comparison running or completed for this exact file
    const existingCheck = await db.query(`
      SELECT id, status FROM comparison_results
      WHERE query_file_id = $1
      ORDER BY created_at DESC LIMIT 1
    `, [queryFileId]);

    if (existingCheck.rowCount && existingCheck.rowCount > 0) {
      const existing = existingCheck.rows[0];
      // If already completed or processing, don't re-run
      if (existing.status === "completed" || existing.status === "processing") {
        return NextResponse.json({ success: true, comparisonId: existing.id, status: existing.status });
      }
    }

    // 5. Create or look up the NCBI reference as a virtual dna_files entry
    let refFileId: string;
    const existingRef = await db.query(`
      SELECT id FROM dna_files WHERE storage_path = $1 AND user_id = $2 LIMIT 1
    `, [referenceUrl, user.id]);

    if (existingRef.rowCount && existingRef.rowCount > 0) {
      refFileId = existingRef.rows[0].id;
    } else {
      refFileId = randomUUID();
      await db.query(`
        INSERT INTO dna_files (id, user_id, file_name, file_size, file_type, storage_path, status, progress)
        VALUES ($1, $2, $3, 0, 'fasta', $4, 'success', 100)
      `, [refFileId, user.id, `${detectedOrganism} (NCBI Reference)`, referenceUrl]);
    }

    // 6. Create processing record and trigger the Python engine
    const resultId = randomUUID();
    await db.query(`
      INSERT INTO comparison_results (id, query_file_id, reference_file_id, status)
      VALUES ($1, $2, $3, 'processing')
    `, [resultId, queryFileId, refFileId]);

    // Fire-and-forget to Python engine
    fetch("http://localhost:8000/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query_path: absoluteQueryPath, reference_url: referenceUrl }),
    })
    .then(async res => {
      if (!res.ok) throw new Error("FastAPI returned error");
      return res.json();
    })
    .then(async data => {
      if (data.match_percentage !== undefined) {
        await db.query(`
          UPDATE comparison_results
          SET status = 'completed',
              match_percentage = $1,
              mutations_found  = $2,
              detected_organism = $3,
              alignment_score  = $4,
              indels_found     = $5,
              analysis_metadata = $6
          WHERE id = $7
        `, [
          data.match_percentage,
          JSON.stringify(data.mutations_found),
          data.detected_organism ?? null,
          data.alignment_score ?? null,
          JSON.stringify(data.indels_found ?? []),
          JSON.stringify(data.analysis_metadata ?? {}),
          resultId,
        ]);
        // Update the file status to success
        await db.query(`UPDATE dna_files SET status = 'success', progress = 100 WHERE id = $1`, [queryFileId]);

        // Send Notification
        await db.query(`
          INSERT INTO user_notifications (user_id, title, message, type, link)
          VALUES ($1, $2, $3, $4, $5)
        `, [user.id, "Analysis Complete", "Your DNA analysis has finished processing. You can view your insights now.", "success", "/user/results"]);
      } else {
        await db.query(`UPDATE comparison_results SET status = 'failed' WHERE id = $1`, [resultId]);
      }
    })
    .catch(async err => {
      console.error("Patient analysis failed:", err);
      await db.query(`UPDATE comparison_results SET status = 'failed' WHERE id = $1`, [resultId]);
    });

    return NextResponse.json({ success: true, comparisonId: resultId, organism: detectedOrganism });

  } catch (error) {
    console.error("Patient analyze error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
