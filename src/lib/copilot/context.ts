import type { DatabaseQueryExecutor } from "@/lib/db";

export interface CopilotVariant {
  position?: number;
  reference?: string;
  query?: string;
  reference_base?: string;
  query_base?: string;
  type?: string;
  severity?: string;
  ai_confidence?: number;
  functional_region?: string;
  drug_resistance_site?: boolean;
  in_functional_domain?: boolean;
}

export interface KnownMutationHit {
  position: number;
  reference_base: string;
  query_base: string;
  severity: string;
  functional_annotation: string | null;
  clinical_significance: string | null;
  drug_resistance: boolean;
  source: string | null;
}

export interface CopilotFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string | Date;
}

export interface CopilotComparison {
  id: string;
  status: string;
  match_percentage: number | string | null;
  mutations_found: CopilotVariant[];
  indels_found: CopilotVariant[];
  detected_organism: string | null;
  alignment_score: number | string | null;
  analysis_metadata: Record<string, unknown> | null;
  created_at: string | Date;
  query_file_name: string;
  reference_file_name: string;
}

export interface CopilotReport {
  id: string;
  name: string;
  status: string;
  created_at: string | Date;
}

export interface CopilotMetrics {
  totalVariants: number;
  snpCount: number;
  indelCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  drugResistanceCount: number;
  averageConfidence: number | null;
  affectedGenes: string[];
  riskLevel: "none" | "low" | "moderate" | "high";
}

export interface CopilotContext {
  files: CopilotFile[];
  comparisons: CopilotComparison[];
  reports: CopilotReport[];
  latestCompleted: CopilotComparison | null;
  latestComparison: CopilotComparison | null;
  knownMutationHits: KnownMutationHit[];
  metrics: CopilotMetrics;
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function toNumber(value: number | string | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeComparison(row: any): CopilotComparison {
  return {
    id: row.id,
    status: row.status,
    match_percentage: row.match_percentage,
    mutations_found: parseJsonArray<CopilotVariant>(row.mutations_found),
    indels_found: parseJsonArray<CopilotVariant>(row.indels_found),
    detected_organism: row.detected_organism,
    alignment_score: row.alignment_score,
    analysis_metadata: parseJsonObject(row.analysis_metadata),
    created_at: row.created_at,
    query_file_name: row.query_file_name,
    reference_file_name: row.reference_file_name,
  };
}

function variantConfidence(variant: CopilotVariant): number | null {
  return typeof variant.ai_confidence === "number" && Number.isFinite(variant.ai_confidence)
    ? variant.ai_confidence
    : null;
}

function buildMetrics(comparison: CopilotComparison | null): CopilotMetrics {
  if (!comparison) {
    return {
      totalVariants: 0,
      snpCount: 0,
      indelCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      drugResistanceCount: 0,
      averageConfidence: null,
      affectedGenes: [],
      riskLevel: "none",
    };
  }

  const variants = [...comparison.mutations_found, ...comparison.indels_found];
  const confidenceValues = variants
    .map(variantConfidence)
    .filter((value): value is number => value !== null);

  const affectedGenes = Array.from(
    new Set(
      variants
        .map((variant) => variant.functional_region)
        .filter((gene): gene is string => Boolean(gene && gene !== "Intergenic")),
    ),
  ).slice(0, 8);

  const highCount = variants.filter((variant) => variant.severity === "high").length;
  const mediumCount = variants.filter((variant) => variant.severity === "medium").length;
  const lowCount = variants.filter((variant) => variant.severity === "low").length;
  const drugResistanceCount = variants.filter((variant) => variant.drug_resistance_site).length;

  let riskLevel: CopilotMetrics["riskLevel"] = "low";
  if (variants.length === 0) riskLevel = "none";
  else if (highCount > 0 || drugResistanceCount > 0) riskLevel = "high";
  else if (mediumCount > 0) riskLevel = "moderate";

  return {
    totalVariants: variants.length,
    snpCount: comparison.mutations_found.length,
    indelCount: comparison.indels_found.length,
    highCount,
    mediumCount,
    lowCount,
    drugResistanceCount,
    averageConfidence: confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : null,
    affectedGenes,
    riskLevel,
  };
}

function getVariantPositions(comparison: CopilotComparison | null) {
  if (!comparison) return [];
  const positions = [...comparison.mutations_found, ...comparison.indels_found]
    .map((variant) => variant.position)
    .filter((position): position is number => typeof position === "number" && Number.isFinite(position));

  return Array.from(new Set(positions)).slice(0, 50);
}

export function getAllVariants(comparison: CopilotComparison | null): CopilotVariant[] {
  if (!comparison) return [];
  return [...comparison.mutations_found, ...comparison.indels_found];
}

export function getMatchPercentage(comparison: CopilotComparison | null): number | null {
  return comparison ? toNumber(comparison.match_percentage) : null;
}

export async function getCopilotContext(
  userId: string,
  db: DatabaseQueryExecutor,
): Promise<CopilotContext> {
  const [filesResult, comparisonsResult, reportsResult] = await Promise.all([
    db.query(
      `
        SELECT id, file_name, file_size, file_type, status, created_at
        FROM dna_files
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 8
      `,
      [userId],
    ),
    db.query(
      `
        SELECT
          cr.id,
          cr.status,
          cr.match_percentage,
          cr.mutations_found,
          cr.indels_found,
          cr.detected_organism,
          cr.alignment_score,
          cr.analysis_metadata,
          cr.created_at,
          query_file.file_name AS query_file_name,
          reference_file.file_name AS reference_file_name
        FROM comparison_results cr
        JOIN dna_files query_file ON cr.query_file_id = query_file.id
        JOIN dna_files reference_file ON cr.reference_file_id = reference_file.id
        WHERE query_file.user_id = $1
        ORDER BY cr.created_at DESC
        LIMIT 6
      `,
      [userId],
    ),
    db.query(
      `
        SELECT id, name, status, created_at
        FROM reports
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `,
      [userId],
    ),
  ]);

  const comparisons = comparisonsResult.rows.map(normalizeComparison);
  const latestCompleted = comparisons.find((comparison) => comparison.status === "completed") ?? null;
  const latestComparison = comparisons[0] ?? null;
  const metrics = buildMetrics(latestCompleted);
  const organism = latestCompleted?.detected_organism;
  const positions = getVariantPositions(latestCompleted);

  let knownMutationHits: KnownMutationHit[] = [];
  if (organism && positions.length > 0) {
    try {
      const knownResult = await db.query(
        `
          SELECT
            position,
            reference_base,
            query_base,
            severity,
            functional_annotation,
            clinical_significance,
            drug_resistance,
            source
          FROM known_mutations
          WHERE organism = $1
            AND position = ANY($2::int[])
          ORDER BY
            CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
            position ASC
          LIMIT 20
        `,
        [organism, positions],
      );

      knownMutationHits = knownResult.rows;
    } catch (error) {
      console.warn("Copilot known mutation enrichment unavailable:", error);
    }
  }

  return {
    files: filesResult.rows,
    comparisons,
    reports: reportsResult.rows,
    latestCompleted,
    latestComparison,
    knownMutationHits,
    metrics,
  };
}
