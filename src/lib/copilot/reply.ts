import {
  getAllVariants,
  getMatchPercentage,
  type CopilotComparison,
  type CopilotContext,
  type CopilotVariant,
  type KnownMutationHit,
} from "@/lib/copilot/context";

export interface CopilotReply {
  reply: string;
  suggestions: string[];
  meta: {
    hasData: boolean;
    latestComparisonId: string | null;
    riskLevel: string;
    organism: string | null;
  };
}

const DISCLAIMER =
  "Use this as research decision-support, not as a standalone diagnosis.";

function formatPercent(value: number | null) {
  return value === null ? "unknown" : `${value.toFixed(2)}%`;
}

function formatConfidence(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value * 100)}%`;
}

function severityWeight(variant: CopilotVariant) {
  const severity = variant.severity ?? "";
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  if (severity === "low") return 1;
  return 0;
}

function variantLabel(variant: CopilotVariant) {
  const position = variant.position ? `pos ${variant.position}` : "unknown locus";
  if (variant.reference && variant.query) {
    return `${position} ${variant.reference}>${variant.query}`;
  }
  if (variant.reference_base && variant.query_base) {
    return `${position} ${variant.reference_base}>${variant.query_base}`;
  }
  return `${position} ${variant.type ?? "variant"}`;
}

function variantRegion(variant: CopilotVariant) {
  return variant.functional_region && variant.functional_region !== "Intergenic"
    ? variant.functional_region
    : "intergenic/uncertain region";
}

function sortImportantVariants(variants: CopilotVariant[]) {
  return [...variants].sort((a, b) => {
    const severityDelta = severityWeight(b) - severityWeight(a);
    if (severityDelta !== 0) return severityDelta;

    const drugDelta = Number(Boolean(b.drug_resistance_site)) - Number(Boolean(a.drug_resistance_site));
    if (drugDelta !== 0) return drugDelta;

    return (b.ai_confidence ?? 0) - (a.ai_confidence ?? 0);
  });
}

function findKnownHit(variant: CopilotVariant, hits: KnownMutationHit[]) {
  return hits.find((hit) => {
    if (hit.position !== variant.position) return false;
    const variantRef = variant.reference ?? variant.reference_base;
    const variantQuery = variant.query ?? variant.query_base;
    if (!variantRef || !variantQuery) return true;
    return hit.reference_base === variantRef && hit.query_base === variantQuery;
  });
}

function latestStatusText(context: CopilotContext) {
  const latest = context.latestComparison;
  if (!latest) {
    if (context.files.length === 0) {
      return "No genomic files are uploaded yet. Upload a query sequence and a reference sequence or NCBI link, then run an analysis.";
    }

    const newestFile = context.files[0];
    return `I found ${context.files.length} uploaded file${context.files.length === 1 ? "" : "s"}, but no comparison results yet. Latest file: ${newestFile.file_name} (${newestFile.status}).`;
  }

  if (latest.status === "processing") {
    return `The latest comparison is still processing: ${latest.query_file_name} vs ${latest.reference_file_name}. I can summarize it as soon as the pipeline completes.`;
  }

  if (latest.status === "failed") {
    return `The latest comparison failed: ${latest.query_file_name} vs ${latest.reference_file_name}. Check that the query and reference belong to the same organism and that both files are parseable FASTA/FASTQ/VCF-style inputs.`;
  }

  const match = getMatchPercentage(latest);
  return `Latest completed comparison: ${latest.query_file_name} vs ${latest.reference_file_name}, ${formatPercent(match)} match, organism ${latest.detected_organism ?? "unknown"}.`;
}

function buildNoDataReply(context: CopilotContext) {
  return [
    latestStatusText(context),
    "",
    "Once an analysis completes, I can explain high-risk loci, affected genes, drug-resistance markers, confidence scores, and report-ready next steps.",
  ].join("\n");
}

function buildSummary(context: CopilotContext) {
  const latest = context.latestCompleted;
  if (!latest) return buildNoDataReply(context);

  const match = getMatchPercentage(latest);
  const metrics = context.metrics;
  const genes = metrics.affectedGenes.length ? metrics.affectedGenes.join(", ") : "no mapped coding regions";

  const lines = [
    `Latest genomic summary for ${latest.query_file_name}:`,
    `- Organism: ${latest.detected_organism ?? "unknown"}`,
    `- Reference match: ${formatPercent(match)}`,
    `- Variants: ${metrics.totalVariants} total (${metrics.snpCount} SNPs, ${metrics.indelCount} indels)`,
    `- Risk mix: ${metrics.highCount} high, ${metrics.mediumCount} medium, ${metrics.lowCount} low`,
    `- Drug-resistance markers: ${metrics.drugResistanceCount}`,
    `- Affected regions: ${genes}`,
  ];

  if (metrics.averageConfidence !== null) {
    lines.push(`- Mean AI confidence: ${formatConfidence(metrics.averageConfidence)}`);
  }

  if (metrics.riskLevel === "high") {
    lines.push("");
    lines.push("Priority: review high-severity or resistance-associated loci before signing reports.");
  } else if (metrics.riskLevel === "moderate") {
    lines.push("");
    lines.push("Priority: moderate variants need interpretation against phenotype, sample quality, and reference choice.");
  } else {
    lines.push("");
    lines.push("Priority: no high-risk signatures were detected in the latest completed comparison.");
  }

  lines.push(DISCLAIMER);
  return lines.join("\n");
}

function buildHighRiskReply(context: CopilotContext) {
  const latest = context.latestCompleted;
  if (!latest) return buildNoDataReply(context);

  const highVariants = sortImportantVariants(getAllVariants(latest)).filter(
    (variant) => variant.severity === "high" || variant.drug_resistance_site,
  );

  if (highVariants.length === 0) {
    return [
      `I do not see high-severity or known drug-resistance loci in ${latest.query_file_name}.`,
      `The latest run still has ${context.metrics.mediumCount} medium-severity and ${context.metrics.lowCount} low-severity variants worth routine review.`,
      DISCLAIMER,
    ].join("\n");
  }

  const top = highVariants.slice(0, 6).map((variant) => {
    const hit = findKnownHit(variant, context.knownMutationHits);
    const known = hit?.clinical_significance ? `; catalog: ${hit.clinical_significance}` : "";
    const resistance = variant.drug_resistance_site ? "; drug-resistance site" : "";
    return `- ${variantLabel(variant)} in ${variantRegion(variant)}: ${variant.severity ?? "unknown"} severity, confidence ${formatConfidence(variant.ai_confidence)}${resistance}${known}`;
  });

  return [
    `High-priority loci in ${latest.query_file_name}:`,
    ...top,
    "",
    `I found ${highVariants.length} high-priority marker${highVariants.length === 1 ? "" : "s"} total. Prioritize confirmatory review of these sites and verify the reference organism (${latest.detected_organism ?? "unknown"}).`,
    DISCLAIMER,
  ].join("\n");
}

function buildDrugResistanceReply(context: CopilotContext) {
  const latest = context.latestCompleted;
  if (!latest) return buildNoDataReply(context);

  const resistanceVariants = sortImportantVariants(getAllVariants(latest)).filter(
    (variant) => variant.drug_resistance_site,
  );

  if (resistanceVariants.length === 0) {
    return [
      `No known drug-resistance markers were detected in the latest ${latest.detected_organism ?? "organism"} analysis.`,
      "If this is a clinical workflow, still compare against the latest validated resistance database before changing therapy.",
      DISCLAIMER,
    ].join("\n");
  }

  const lines = resistanceVariants.slice(0, 6).map((variant) => {
    const hit = findKnownHit(variant, context.knownMutationHits);
    const source = hit?.source ? ` (${hit.source})` : "";
    const clinical = hit?.clinical_significance ? `: ${hit.clinical_significance}` : "";
    return `- ${variantLabel(variant)} in ${variantRegion(variant)}${source}${clinical}`;
  });

  return [
    `Drug-resistance review for ${latest.query_file_name}:`,
    ...lines,
    "",
    `Detected ${resistanceVariants.length} resistance-associated marker${resistanceVariants.length === 1 ? "" : "s"}. Treat this as a triage signal and validate with domain-specific guidelines before any therapeutic decision.`,
    DISCLAIMER,
  ].join("\n");
}

function buildFilesReply(context: CopilotContext) {
  if (context.files.length === 0) return buildNoDataReply(context);

  const lines = context.files.slice(0, 5).map((file) => {
    const sizeMb = Number(file.file_size) > 0 ? `${(Number(file.file_size) / 1024 / 1024).toFixed(2)} MB` : "size unknown";
    return `- ${file.file_name}: ${file.status}, ${file.file_type}, ${sizeMb}`;
  });

  return [
    `I found ${context.files.length} recent genomic file${context.files.length === 1 ? "" : "s"}:`,
    ...lines,
    "",
    latestStatusText(context),
  ].join("\n");
}

function buildReportsReply(context: CopilotContext) {
  if (context.reports.length === 0) {
    return [
      "No reports have been generated yet.",
      context.latestCompleted
        ? "A completed analysis is available, so you can generate a comprehensive genomic profile from the Reports page."
        : "Run an analysis first, then generate a report from the completed comparison.",
    ].join("\n");
  }

  const lines = context.reports.slice(0, 5).map((report) => `- ${report.name}: ${report.status}`);
  return [`Recent reports:`, ...lines].join("\n");
}

function findRequestedVariant(message: string, comparison: CopilotComparison | null) {
  const normalized = message.toLowerCase();
  const positionMatch = normalized.match(/\b(?:position|pos|locus|site)\s*#?:?\s*(\d{1,9})\b/);
  if (!positionMatch || !comparison) return null;

  const position = Number(positionMatch[1]);
  return getAllVariants(comparison).find((variant) => variant.position === position) ?? null;
}

function buildExplainReply(message: string, context: CopilotContext) {
  const latest = context.latestCompleted;
  if (!latest) return buildNoDataReply(context);

  const variant = findRequestedVariant(message, latest);
  if (!variant) {
    const topVariant = sortImportantVariants(getAllVariants(latest))[0];
    if (!topVariant) return buildSummary(context);

    return [
      "I can explain a specific locus if you ask like: \"explain position 184\".",
      "",
      `Most important current variant: ${variantLabel(topVariant)} in ${variantRegion(topVariant)}.`,
      `It is marked ${topVariant.severity ?? "unknown"} severity with ${formatConfidence(topVariant.ai_confidence)} confidence${topVariant.drug_resistance_site ? " and overlaps a drug-resistance site" : ""}.`,
      DISCLAIMER,
    ].join("\n");
  }

  const hit = findKnownHit(variant, context.knownMutationHits);
  const evidence = [
    `- Locus: ${variantLabel(variant)}`,
    `- Region: ${variantRegion(variant)}`,
    `- Variant type: ${variant.type ?? "unknown"}`,
    `- Severity: ${variant.severity ?? "unknown"}`,
    `- AI confidence: ${formatConfidence(variant.ai_confidence)}`,
    `- Functional domain: ${variant.in_functional_domain ? "yes" : "not mapped"}`,
    `- Drug-resistance site: ${variant.drug_resistance_site ? "yes" : "no"}`,
  ];

  if (hit) {
    evidence.push(`- Known catalog evidence: ${hit.clinical_significance ?? hit.functional_annotation ?? "matched known mutation catalog"}`);
  }

  return [
    `Explanation for ${variantLabel(variant)}:`,
    ...evidence,
    "",
    "Why it was flagged: the engine weighs mutation class, coding-region overlap, local sequence context, codon position, known resistance loci, and classifier confidence.",
    "Recommended next step: confirm the locus against the raw alignment and review it with the relevant organism-specific evidence database.",
    DISCLAIMER,
  ].join("\n");
}

function buildNextStepsReply(context: CopilotContext) {
  if (!context.latestCompleted) return buildNoDataReply(context);

  const steps = [];
  if (context.metrics.highCount > 0) {
    steps.push("- Review high-severity loci and confirm them against the alignment.");
  }
  if (context.metrics.drugResistanceCount > 0) {
    steps.push("- Cross-check drug-resistance markers with a validated resistance guideline/database.");
  }
  if (context.reports.length === 0) {
    steps.push("- Generate a report after review so the findings are documented.");
  }
  if (context.metrics.highCount === 0 && context.metrics.drugResistanceCount === 0) {
    steps.push("- Continue routine quality checks: reference choice, coverage, sample identity, and variant thresholds.");
  }

  return [
    "Suggested next steps:",
    ...steps,
    "- Keep clinical interpretation separate from automated scoring unless reviewed by a qualified professional.",
    DISCLAIMER,
  ].join("\n");
}

function detectIntent(message: string) {
  const normalized = message.toLowerCase();
  if (/\b(hello|hi|hey|start|online)\b/.test(normalized)) return "summary";
  if (/\b(file|upload|sample|vcf|fasta|fastq|bam)\b/.test(normalized)) return "files";
  if (/\b(report|pdf|signed|export)\b/.test(normalized)) return "reports";
  if (/\b(drug|resistance|therapy|treatment|antiviral|pharma)\b/.test(normalized)) return "drug";
  if (/\b(high|risk|urgent|danger|pathogenic|severe|loci|locus)\b/.test(normalized)) return "high";
  if (/\b(explain|why|evidence|confidence|position|pos|site)\b/.test(normalized)) return "explain";
  if (/\b(next|recommend|should|action|triage)\b/.test(normalized)) return "next";
  if (/\b(status|processing|failed|complete|completed)\b/.test(normalized)) return "status";
  return "summary";
}

export function buildGreeting(context: CopilotContext): CopilotReply {
  const reply = context.latestCompleted
    ? buildSummary(context)
    : buildNoDataReply(context);

  return {
    reply,
    suggestions: buildSuggestions(context),
    meta: buildMeta(context),
  };
}

function buildSuggestions(context: CopilotContext) {
  if (!context.latestCompleted) {
    return ["Check analysis status", "What should I upload?", "Show recent files"];
  }

  if (context.metrics.riskLevel === "high") {
    return ["Show high-risk loci", "Explain drug resistance", "What should I do next?"];
  }

  return ["Summarize latest analysis", "Show affected genes", "Any report ready?"];
}

function buildMeta(context: CopilotContext) {
  return {
    hasData: Boolean(context.latestCompleted),
    latestComparisonId: context.latestCompleted?.id ?? null,
    riskLevel: context.metrics.riskLevel,
    organism: context.latestCompleted?.detected_organism ?? null,
  };
}

export function buildCopilotReply(message: string, context: CopilotContext): CopilotReply {
  const intent = detectIntent(message);
  let reply: string;

  switch (intent) {
    case "files":
      reply = buildFilesReply(context);
      break;
    case "reports":
      reply = buildReportsReply(context);
      break;
    case "drug":
      reply = buildDrugResistanceReply(context);
      break;
    case "high":
      reply = buildHighRiskReply(context);
      break;
    case "explain":
      reply = buildExplainReply(message, context);
      break;
    case "next":
      reply = buildNextStepsReply(context);
      break;
    case "status":
      reply = latestStatusText(context);
      break;
    default:
      reply = buildSummary(context);
      break;
  }

  return {
    reply,
    suggestions: buildSuggestions(context),
    meta: buildMeta(context),
  };
}
