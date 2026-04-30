import axios from "axios";
import { env } from "../config/env";
import { cacheManager, CacheKeys, CacheTTL } from "../cache/cache-manager";
import { toOutbreakMapJSON, toTimeSeriesJSON, toMutationFeedJSON } from "../transformers/virus.transformer";
import { logger } from "../middleware/request-logger";
import type { OutbreakPoint, TimeSeriesData, MutationEvent } from "../types/index";

const mlApi = axios.create({
  baseURL: env.ML_API_URL,
  timeout: 10000,
});

export async function getOutbreakMap(): Promise<{ data: OutbreakPoint[]; cached: boolean }> {
  const key = CacheKeys.outbreakMap();
  const cached = await cacheManager.get<OutbreakPoint[]>(key);
  if (cached) return { data: cached, cached: true };

  try {
    const response = await mlApi.get("/api/ml/outbreaks/current");
    const data = toOutbreakMapJSON(response.data?.outbreaks);
    await cacheManager.set(key, data, CacheTTL.OUTBREAK_MAP);
    return { data, cached: false };
  } catch (err) {
    logger.warn("ML API unavailable — using default outbreak data");
    const data = toOutbreakMapJSON();
    await cacheManager.set(key, data, CacheTTL.OUTBREAK_MAP);
    return { data, cached: false };
  }
}

export async function getTimeSeries(months: number): Promise<{ data: TimeSeriesData; cached: boolean }> {
  const key = CacheKeys.timeSeries(months);
  const cached = await cacheManager.get<TimeSeriesData>(key);
  if (cached) return { data: cached, cached: true };

  try {
    const response = await mlApi.get("/api/ml/outbreaks/timeseries", { params: { months } });
    const data = toTimeSeriesJSON(response.data, months);
    await cacheManager.set(key, data, CacheTTL.TIME_SERIES);
    return { data, cached: false };
  } catch (err) {
    logger.warn("ML API unavailable — using default time series data");
    const data = toTimeSeriesJSON(undefined, months);
    await cacheManager.set(key, data, CacheTTL.TIME_SERIES);
    return { data, cached: false };
  }
}

export async function getLatestMutations(limit: number): Promise<{ data: MutationEvent[]; cached: boolean }> {
  const key = CacheKeys.latestMutations();
  const cached = await cacheManager.get<MutationEvent[]>(key);
  if (cached) return { data: cached.slice(0, limit), cached: true };

  try {
    const response = await mlApi.get("/api/ml/mutations/latest", { params: { limit } });
    const data = toMutationFeedJSON(response.data?.mutations, limit);
    await cacheManager.set(key, data, CacheTTL.LATEST_MUTATIONS);
    return { data, cached: false };
  } catch (err) {
    logger.warn("ML API unavailable — using default mutation data");
    const data = toMutationFeedJSON(undefined, limit);
    await cacheManager.set(key, data, CacheTTL.LATEST_MUTATIONS);
    return { data, cached: false };
  }
}
