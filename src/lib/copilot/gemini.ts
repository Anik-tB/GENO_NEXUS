import { env } from "@/lib/env";
import {
  getAllVariants,
  getMatchPercentage,
  type CopilotContext,
} from "@/lib/copilot/context";

type CopilotHistoryMessage = {
  role: "user" | "assistant" | "ai";
  text: string;
};

type AskGeminiCopilotOptions = {
  context: CopilotContext;
  message: string;
  history?: CopilotHistoryMessage[];
  systemInstruction?: string;
  responseMimeType?: string;
  maxOutputTokens?: number;
};

export class CopilotApiConfigurationError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured. Add it to .env.local to use the real Genome Copilot API.");
    this.name = "CopilotApiConfigurationError";
  }
}

export class CopilotApiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CopilotApiRequestError";
  }
}

const GENONEXUS_PROJECT_CONTEXT = [
  "GenoNexus is a secure genomics analysis dashboard for biomedical research decision-support.",
  "Core workflows include genomic file upload, reference selection by NCBI URL or local file, sequence comparison, variant extraction, severity scoring, report generation, and visualization.",
  "The current genomics engine supports FASTA, FASTQ, VCF, and BAM-style workflows, organism-aware reference matching, Needleman-Wunsch alignment, SNP/indel extraction, and Random Forest severity classification.",
  "Important organism context can include HIV-1, HIV-2, SARS-CoV-2, influenza, hepatitis B/C, dengue, Ebola, and monkeypox when present in the user's analysis data.",
  "Dashboard modules include analysis, upload, reports, predictions, drug-gene review, outbreak monitoring, collaboration, profile/security, and visualization.",
].join("\n");

function confidenceToPercent(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value * 100)
    : null;
}

function summarizeVariants(context: CopilotContext) {
  const variants = getAllVariants(context.latestCompleted)
    .sort((a, b) => {
      const severityWeight = { high: 3, medium: 2, low: 1 } as Record<string, number>;
      const severityDelta = (severityWeight[b.severity ?? ""] ?? 0) - (severityWeight[a.severity ?? ""] ?? 0);
      if (severityDelta !== 0) return severityDelta;
      return Number(Boolean(b.drug_resistance_site)) - Number(Boolean(a.drug_resistance_site));
    })
    .slice(0, 20);

  return variants.map((variant) => ({
    position: variant.position ?? null,
    change: variant.reference && variant.query
      ? `${variant.reference}>${variant.query}`
      : variant.reference_base && variant.query_base
        ? `${variant.reference_base}>${variant.query_base}`
        : null,
    type: variant.type ?? null,
    severity: variant.severity ?? null,
    confidence_percent: confidenceToPercent(variant.ai_confidence),
    region: variant.functional_region ?? null,
    drug_resistance_site: Boolean(variant.drug_resistance_site),
    in_functional_domain: Boolean(variant.in_functional_domain),
  }));
}

function buildCompactContext(context: CopilotContext) {
  const latest = context.latestCompleted;
  const latestAny = context.latestComparison;

  return {
    project_context: GENONEXUS_PROJECT_CONTEXT,
    latest_completed_analysis: latest
      ? {
          comparison_id: latest.id,
          query_file: latest.query_file_name,
          reference_file: latest.reference_file_name,
          status: latest.status,
          organism: latest.detected_organism,
          match_percentage: getMatchPercentage(latest),
          alignment_score: latest.alignment_score,
          created_at: latest.created_at,
          analysis_metadata: latest.analysis_metadata,
        }
      : null,
    latest_any_analysis: latestAny
      ? {
          comparison_id: latestAny.id,
          query_file: latestAny.query_file_name,
          reference_file: latestAny.reference_file_name,
          status: latestAny.status,
          organism: latestAny.detected_organism,
          match_percentage: getMatchPercentage(latestAny),
          created_at: latestAny.created_at,
        }
      : null,
    metrics: context.metrics,
    recent_files: context.files.slice(0, 5).map((file) => ({
      file_name: file.file_name,
      file_type: file.file_type,
      status: file.status,
      file_size: file.file_size,
      created_at: file.created_at,
    })),
    recent_reports: context.reports.slice(0, 4).map((report) => ({
      name: report.name,
      status: report.status,
      created_at: report.created_at,
    })),
    top_variants: summarizeVariants(context),
    known_mutation_catalog_hits: context.knownMutationHits.slice(0, 12),
  };
}

function buildSystemInstruction() {
  return [
    "You are Genome Copilot inside GenoNexus.",
    "Use the GenoNexus project context and authenticated user's live application context as your grounding.",
    "Answer using only the provided context. If context is missing, say what is missing and what the user should do next.",
    "Be concise, practical, and evidence-grounded. Mention loci, organism, match percentage, severity, confidence, affected regions, and drug-resistance markers when relevant.",
    "Do not invent variants, genes, diagnoses, or therapy decisions. Do not claim clinical certainty from automated results.",
    "Always keep medical language as research decision-support and recommend qualified review for clinical action.",
    "Use plain text with short bullets when helpful. Do not return JSON.",
  ].join("\n");
}

function buildPrompt(options: AskGeminiCopilotOptions) {
  const history = (options.history ?? []).slice(-8).map((entry) => ({
    role: entry.role === "user" ? "user" : "assistant",
    text: entry.text.slice(0, 1500),
  }));

  return [
    "Application context:",
    JSON.stringify(buildCompactContext(options.context), null, 2),
    "",
    "Recent conversation:",
    JSON.stringify(history, null, 2),
    "",
    `User question: ${options.message}`,
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getGeminiModelPath(model: string) {
  const normalized = model.trim().replace(/^models\//, "") || "gemini-2.5-flash";
  return encodeURIComponent(normalized);
}

function extractGeminiResponseText(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) {
    return "";
  }

  const textParts: string[] = [];
  for (const candidate of payload.candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
      continue;
    }

    for (const part of candidate.content.parts) {
      if (isRecord(part) && typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function extractGeminiErrorMessage(payload: unknown, status: number) {
  if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  return `Gemini API request failed with status ${status}.`;
}

export async function askGeminiCopilot(options: AskGeminiCopilotOptions) {
  if (!env.geminiApiKey) {
    throw new CopilotApiConfigurationError();
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModelPath(env.geminiModel)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.geminiApiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: options.systemInstruction || buildSystemInstruction() }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(options) }],
          },
        ],
        generationConfig: {
          maxOutputTokens: options.maxOutputTokens || 700,
          temperature: 0.2,
          topP: 0.9,
          responseMimeType: options.responseMimeType || "text/plain",
        },
      }),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CopilotApiRequestError(extractGeminiErrorMessage(payload, response.status));
  }

  const text = extractGeminiResponseText(payload);
  if (!text) {
    throw new CopilotApiRequestError("Gemini API returned an empty copilot response.");
  }

  return text;
}
