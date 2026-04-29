import type { ChromosomeData, MutationOverlay, HelixVertexData, GenomicRegion } from "../types/index";

// -----------------------------------------------------------
// Genome Data Transformers
// Converts raw genomic API responses into frontend-ready formats
// -----------------------------------------------------------

/**
 * Transforms raw karyotype data into the chromosome map format
 * expected by the frontend GenomeBrowser component.
 */
export function toChromosomeMapJSON(rawData?: Record<string, unknown>[]): ChromosomeData[] {
  // If external API provides data, map it; otherwise use reference karyotype
  if (rawData && rawData.length > 0) {
    return rawData.map((entry, i) => ({
      id: (entry.id as number) || i + 1,
      label: (entry.label as string) || (i < 22 ? String(i + 1) : "XY"),
      height: (entry.height as number) || Math.max(40, 100 - i * 3),
      hasMutation: (entry.hasMutation as boolean) || false,
      mutationType: (entry.mutationType as ChromosomeData["mutationType"]) || "benign",
      gene: (entry.gene as string) || "",
      variant: (entry.variant as string) || "",
      impact: (entry.impact as ChromosomeData["impact"]) || "Low",
    }));
  }

  // Default human karyotype reference (hg38)
  return Array.from({ length: 23 }, (_, i) => ({
    id: i + 1,
    label: i < 22 ? String(i + 1) : "XY",
    height: Math.max(40, 100 - i * 3),
    hasMutation: [6, 11, 17].includes(i),
    mutationType: (i === 6 ? "pathogenic" : i === 11 ? "uncertain" : "benign") as ChromosomeData["mutationType"],
    gene: i === 6 ? "BRCA2" : i === 11 ? "TP53" : i === 17 ? "APOE" : "",
    variant: i === 6 ? "c.5946delT" : i === 11 ? "c.817C>T" : i === 17 ? "ε4 allele" : "",
    impact: (i === 6 ? "High" : i === 11 ? "Moderate" : "Low") as ChromosomeData["impact"],
  }));
}

/**
 * Converts a sequence string into Three.js-compatible vertex data
 * for rendering a double helix in 3D.
 */
export function toHelixVertices(sequence?: string, basePairCount = 200): HelixVertexData {
  const positions: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];

  const nucleotideColors: Record<string, [number, number, number]> = {
    A: [0.18, 0.8, 0.44],    // Green
    T: [0.91, 0.3, 0.24],    // Red
    G: [0.2, 0.6, 1.0],      // Blue
    C: [0.95, 0.77, 0.06],   // Yellow
  };

  const count = sequence ? Math.min(sequence.length, basePairCount) : basePairCount;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 10; // 5 full turns
    const y = t * 50 - 25;          // -25 to +25 vertical span
    const radius = 3;

    // Strand 1
    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;
    positions.push(x1, y, z1);
    normals.push(Math.cos(angle), 0, Math.sin(angle));

    // Strand 2 (180° offset)
    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;
    positions.push(x2, y, z2);
    normals.push(Math.cos(angle + Math.PI), 0, Math.sin(angle + Math.PI));

    // Colors based on nucleotide
    const base = sequence ? sequence[i]?.toUpperCase() : ["A", "T", "G", "C"][i % 4];
    const color = nucleotideColors[base || "A"] || nucleotideColors.A;
    colors.push(...color);  // Strand 1
    colors.push(...color);  // Strand 2
  }

  return { positions, colors, normals, basePairCount: count };
}

/**
 * Transforms variant call results into mutation overlay data
 * for the 3D viewer and chromosome map.
 */
export function toMutationOverlay(variants?: Record<string, unknown>[]): MutationOverlay[] {
  if (!variants || variants.length === 0) {
    // Default mutation set matching frontend mock data
    return [
      {
        position: 32_936_732,
        type: "pathogenic",
        gene: "BRCA2",
        variant: "c.5946delT",
        impact: "High",
        color: "#ef4444",
        confidence: 0.947,
      },
      {
        position: 7_578_406,
        type: "uncertain",
        gene: "TP53",
        variant: "c.817C>T",
        impact: "Moderate",
        color: "#f59e0b",
        confidence: 0.673,
      },
      {
        position: 44_908_684,
        type: "benign",
        gene: "APOE",
        variant: "ε4 allele",
        impact: "Low",
        color: "#10b981",
        confidence: 0.891,
      },
    ];
  }

  return variants.map((v) => {
    const type = classifyVariant(v.impact as string);
    return {
      position: (v.position as number) || 0,
      type,
      gene: (v.gene as string) || "Unknown",
      variant: (v.variant as string) || "",
      impact: (v.impact as MutationOverlay["impact"]) || "Low",
      color: type === "pathogenic" ? "#ef4444" : type === "uncertain" ? "#f59e0b" : "#10b981",
      confidence: (v.confidence as number) || 0,
    };
  });
}

/**
 * Transforms raw genomic region data into a structured format.
 */
export function toGenomicRegionJSON(raw?: Record<string, unknown>): GenomicRegion {
  return {
    chromosome: (raw?.chromosome as string) || "1",
    start: (raw?.start as number) || 0,
    end: (raw?.end as number) || 1000,
    sequence: (raw?.sequence as string) || "",
    genes: ((raw?.genes as Record<string, unknown>[]) || []).map((g) => ({
      name: (g.name as string) || "",
      start: (g.start as number) || 0,
      end: (g.end as number) || 0,
      strand: ((g.strand as string) || "+") as "+" | "-",
      type: (g.type as string) || "gene",
    })),
    gcContent: (raw?.gcContent as number) || 0,
  };
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

function classifyVariant(impact?: string): "pathogenic" | "uncertain" | "benign" {
  if (!impact) return "benign";
  const lower = impact.toLowerCase();
  if (lower === "high" || lower.includes("pathogenic")) return "pathogenic";
  if (lower === "moderate" || lower.includes("uncertain")) return "uncertain";
  return "benign";
}
