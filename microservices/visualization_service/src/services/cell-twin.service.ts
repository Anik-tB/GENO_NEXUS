import axios from "axios";
import { env } from "../config/env";
import { cacheManager, CacheKeys, CacheTTL } from "../cache/cache-manager";
import { toBaselineMetrics, toSimulationResult, toSimulationTimeline } from "../transformers/cell-twin.transformer";
import { logger } from "../middleware/request-logger";
import type { CellMetric, OrganelleStatus, SimulationResult, SimulationTimeline } from "../types/index";

const mlApi = axios.create({
  baseURL: env.ML_API_URL,
  timeout: 15000,
});

export async function getBaseline(): Promise<{ data: { metrics: CellMetric[]; organelles: OrganelleStatus[] }; cached: boolean }> {
  const key = CacheKeys.cellBaseline();
  const cached = await cacheManager.get<{ metrics: CellMetric[]; organelles: OrganelleStatus[] }>(key);
  if (cached) return { data: cached, cached: true };

  const data = toBaselineMetrics();
  await cacheManager.set(key, data, CacheTTL.CELL_BASELINE);
  return { data, cached: false };
}

export async function getSimulation(drugId: string): Promise<{ data: SimulationResult; cached: boolean }> {
  const key = CacheKeys.simulation(drugId);
  const cached = await cacheManager.get<SimulationResult>(key);
  if (cached) return { data: cached, cached: true };

  try {
    const response = await mlApi.get(`/api/ml/simulation/${drugId}`);
    const data = toSimulationResult(response.data);
    await cacheManager.set(key, data, CacheTTL.SIMULATION);
    return { data, cached: false };
  } catch (err) {
    logger.warn({ drugId, error: err }, "ML API unavailable — using default simulation");
    const data = toSimulationResult();
    await cacheManager.set(key, data, CacheTTL.SIMULATION);
    return { data, cached: false };
  }
}

export async function getTimeline(simId: string): Promise<{ data: SimulationTimeline; cached: boolean }> {
  const key = CacheKeys.simulationTimeline(simId);
  const cached = await cacheManager.get<SimulationTimeline>(key);
  if (cached) return { data: cached, cached: true };

  // Get or create simulation result first, then generate timeline
  const simResult = toSimulationResult();
  const data = toSimulationTimeline(simResult, 50);
  await cacheManager.set(key, data, CacheTTL.SIMULATION_TIMELINE);
  return { data, cached: false };
}

export async function getOrganelleStatus(simId: string, step?: number): Promise<{ data: OrganelleStatus[]; cached: boolean }> {
  // Use the timeline to get organelle status at a specific step
  const { data: timeline } = await getTimeline(simId);
  const targetStep = step ?? timeline.totalSteps;
  const timeStep = timeline.timeSteps[Math.min(targetStep, timeline.timeSteps.length - 1)];

  return { data: timeStep?.organelles || toBaselineMetrics().organelles, cached: false };
}
