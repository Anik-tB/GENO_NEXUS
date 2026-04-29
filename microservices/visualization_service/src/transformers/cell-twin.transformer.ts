import type { CellMetric, SimulationResult, OrganelleStatus, SimulationTimeline, SimulationTimeStep } from "../types/index";

// -----------------------------------------------------------
// Cell Twin Data Transformers
// Converts simulation API outputs into frontend-ready formats
// -----------------------------------------------------------

const BASELINE_METRICS: CellMetric[] = [
  { label: "ATP Production", unit: "μmol/min", value: 24.5, base: 24.5, color: "var(--gn-primary)", barPercent: 45 },
  { label: "Membrane Potential", unit: "mV", value: -70, base: -70, color: "var(--gn-blue)", barPercent: 70 },
  { label: "Drug Binding", unit: "%", value: 0, base: 0, color: "var(--gn-warning)", barPercent: 0 },
  { label: "Protein Synthesis", unit: "pg/hr", value: 8.2, base: 8.2, color: "var(--gn-success)", barPercent: 21 },
];

const BASELINE_ORGANELLES: OrganelleStatus[] = [
  { name: "Nucleus", status: "Active", healthy: true },
  { name: "Mitochondria", status: "Optimal", healthy: true },
  { name: "Endoplasmic Reticulum", status: "Active", healthy: true },
  { name: "Golgi Apparatus", status: "Normal", healthy: true },
];

/**
 * Returns baseline (pre-drug) cellular metrics matching
 * the frontend DigitalCellTwin component's BASE_METRICS shape.
 */
export function toBaselineMetrics(): { metrics: CellMetric[]; organelles: OrganelleStatus[] } {
  return {
    metrics: BASELINE_METRICS,
    organelles: BASELINE_ORGANELLES,
  };
}

/**
 * Transforms raw ML API simulation output into the format
 * expected by the frontend DigitalCellTwin component.
 */
export function toSimulationResult(raw?: Record<string, unknown>): SimulationResult {
  if (raw && raw.metrics) {
    const rawMetrics = raw.metrics as Record<string, unknown>[];
    return {
      simulationId: (raw.simulationId as string) || generateId(),
      drugId: (raw.drugId as string) || "unknown",
      drugName: (raw.drugName as string) || "Unknown Drug",
      status: (raw.status as SimulationResult["status"]) || "completed",
      metrics: rawMetrics.map(toMetricEntry),
      organelles: ((raw.organelles as Record<string, unknown>[]) || []).map(toOrganelleEntry),
      totalTimeSteps: (raw.totalTimeSteps as number) || 100,
      completedAt: (raw.completedAt as string) || new Date().toISOString(),
    };
  }

  // Default drug interaction result (matches frontend DRUG_METRICS)
  return {
    simulationId: generateId(),
    drugId: "demo-drug",
    drugName: "Imatinib (Gleevec)",
    status: "completed",
    metrics: [
      { label: "ATP Production", unit: "μmol/min", value: 12.1, base: 24.5, color: "var(--gn-primary)", barPercent: 22 },
      { label: "Membrane Potential", unit: "mV", value: -55, base: -70, color: "var(--gn-blue)", barPercent: 55 },
      { label: "Drug Binding", unit: "%", value: 87.4, base: 0, color: "var(--gn-warning)", barPercent: 87 },
      { label: "Protein Synthesis", unit: "pg/hr", value: 3.6, base: 8.2, color: "var(--gn-success)", barPercent: 9 },
    ],
    organelles: [
      { name: "Nucleus", status: "Active", healthy: true },
      { name: "Mitochondria", status: "Stressed", healthy: false },
      { name: "Endoplasmic Reticulum", status: "Active", healthy: true },
      { name: "Golgi Apparatus", status: "Slowed", healthy: false },
    ],
    totalTimeSteps: 100,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Generates a time-series of simulation steps for playback.
 * Interpolates between baseline and final state over N steps.
 */
export function toSimulationTimeline(
  finalResult: SimulationResult,
  totalSteps = 50,
): SimulationTimeline {
  const baseline = toBaselineMetrics();
  const steps: SimulationTimeStep[] = [];

  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps; // 0 to 1 interpolation factor

    const metrics: CellMetric[] = baseline.metrics.map((bm, idx) => {
      const finalMetric = finalResult.metrics[idx] || bm;
      const interpolatedValue = bm.value + (finalMetric.value - bm.value) * easeInOutCubic(t);
      const barPercent = Math.min(100, Math.abs(interpolatedValue) / Math.abs(bm.base + 30) * 100);

      return {
        ...bm,
        value: Math.round(interpolatedValue * 10) / 10,
        barPercent: Math.round(barPercent),
      };
    });

    const organelles: OrganelleStatus[] = baseline.organelles.map((bo, idx) => {
      const finalOrg = finalResult.organelles[idx] || bo;
      // Organelles degrade past 60% of the simulation
      const isHealthy = t < 0.6 ? bo.healthy : finalOrg.healthy;
      return {
        name: bo.name,
        status: isHealthy ? bo.status : finalOrg.status,
        healthy: isHealthy,
      };
    });

    steps.push({
      timeStep: i,
      timestamp: i * 100, // ms
      metrics,
      organelles,
    });
  }

  return {
    simulationId: finalResult.simulationId,
    totalDuration: totalSteps * 100,
    totalSteps,
    timeSteps: steps,
  };
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

function toMetricEntry(raw: Record<string, unknown>): CellMetric {
  const value = (raw.value as number) || 0;
  const base = (raw.base as number) || 0;
  return {
    label: (raw.label as string) || "Unknown",
    unit: (raw.unit as string) || "",
    value,
    base,
    color: (raw.color as string) || "var(--gn-primary)",
    barPercent: Math.min(100, Math.abs(value) / Math.abs(base + 30) * 100),
  };
}

function toOrganelleEntry(raw: Record<string, unknown>): OrganelleStatus {
  return {
    name: (raw.name as string) || "Unknown",
    status: (raw.status as string) || "Unknown",
    healthy: (raw.healthy as boolean) ?? true,
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function generateId(): string {
  return `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
