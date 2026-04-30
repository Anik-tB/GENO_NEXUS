import type { OutbreakPoint, MutationEvent, TimeSeriesData } from "../types/index";

// -----------------------------------------------------------
// Virus Tracker Data Transformers
// -----------------------------------------------------------

const DEFAULT_OUTBREAKS: OutbreakPoint[] = [
  { id: "na", label: "North America", x: "18%", y: "32%", severity: 3, variant: "Alpha", cases: 142000, lastUpdated: new Date().toISOString() },
  { id: "eu", label: "Europe", x: "45%", y: "27%", severity: 4, variant: "Delta", cases: 287000, lastUpdated: new Date().toISOString() },
  { id: "sa", label: "South America", x: "26%", y: "58%", severity: 2, variant: "Gamma", cases: 83000, lastUpdated: new Date().toISOString() },
  { id: "af", label: "Africa", x: "48%", y: "52%", severity: 2, variant: "Beta", cases: 61000, lastUpdated: new Date().toISOString() },
  { id: "as", label: "South Asia", x: "65%", y: "42%", severity: 5, variant: "Omicron", cases: 412000, lastUpdated: new Date().toISOString() },
  { id: "sea", label: "SE Asia", x: "74%", y: "50%", severity: 3, variant: "Lambda", cases: 115000, lastUpdated: new Date().toISOString() },
  { id: "me", label: "Middle East", x: "57%", y: "38%", severity: 2, variant: "Mu", cases: 44000, lastUpdated: new Date().toISOString() },
];

const DEFAULT_MUTATIONS: MutationEvent[] = [
  { time: "00:12", label: "Omicron BA.2.75.2 — spike S:R346T detected", severity: "high" },
  { time: "00:09", label: "Delta AY.4.2 — increased transmissibility flagged", severity: "high" },
  { time: "00:07", label: "Alpha B.1.1.7 — neutralizing antibody escape +12%", severity: "med" },
  { time: "00:04", label: "Beta B.1.351 — E484K reversion observed", severity: "low" },
  { time: "00:02", label: "Gamma P.1 — ACE2 binding affinity stable", severity: "low" },
];

const CHART_DATA = [42, 61, 88, 115, 142, 187, 224, 287, 341, 412, 387, 312];
const CHART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function toOutbreakMapJSON(raw?: Record<string, unknown>[]): OutbreakPoint[] {
  if (raw && raw.length > 0) {
    return raw.map((entry) => ({
      id: (entry.id as string) || `outbreak-${Date.now()}`,
      label: (entry.label as string) || (entry.region as string) || "Unknown",
      x: (entry.x as string) || (entry.longitude ? `${entry.longitude}%` : "50%"),
      y: (entry.y as string) || (entry.latitude ? `${entry.latitude}%` : "50%"),
      severity: Math.min(5, Math.max(1, (entry.severity as number) || 1)),
      variant: (entry.variant as string) || "Unknown",
      cases: (entry.cases as number) || 0,
      lastUpdated: (entry.lastUpdated as string) || new Date().toISOString(),
    }));
  }
  return DEFAULT_OUTBREAKS;
}

export function toTimeSeriesJSON(raw?: Record<string, unknown>, months = 12): TimeSeriesData {
  if (raw && raw.data) {
    return {
      data: (raw.data as number[]).slice(0, months),
      labels: (raw.labels as string[])?.slice(0, months) || CHART_MONTHS.slice(0, months),
      period: "monthly",
      unit: "thousands",
    };
  }
  return {
    data: CHART_DATA.slice(0, months),
    labels: CHART_MONTHS.slice(0, months),
    period: "monthly",
    unit: "thousands",
  };
}

export function toMutationFeedJSON(raw?: Record<string, unknown>[], limit = 20): MutationEvent[] {
  if (raw && raw.length > 0) {
    return raw.slice(0, limit).map((entry) => ({
      time: (entry.time as string) || "Live",
      label: (entry.label as string) || (entry.description as string) || "Mutation event",
      severity: classifySeverity((entry.severity as string) || (entry.impact as string)),
      position: entry.position as number | undefined,
      variant: entry.variant as string | undefined,
      region: entry.region as string | undefined,
    }));
  }
  return DEFAULT_MUTATIONS.slice(0, limit);
}

export function generateLiveMutationEvent(): MutationEvent {
  const position = Math.floor(Math.random() * 29000) + 1000;
  const severities: MutationEvent["severity"][] = ["low", "med", "high"];
  const variants = ["BA.2.75.2", "AY.4.2", "B.1.1.7", "B.1.351", "P.1", "JN.1", "XBB.1.5"];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return {
    time: "Live",
    label: `${variant} — sequence position ${position} analyzed`,
    severity: severities[Math.floor(Math.random() * severities.length)],
    position,
    variant,
  };
}

function classifySeverity(value?: string): MutationEvent["severity"] {
  if (!value) return "low";
  const lower = value.toLowerCase();
  if (lower === "high" || lower === "critical") return "high";
  if (lower === "medium" || lower === "moderate" || lower === "med") return "med";
  return "low";
}
