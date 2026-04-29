import axios from "axios";
import { env } from "../config/env";
import { cacheManager, CacheKeys, CacheTTL } from "../cache/cache-manager";
import { toChromosomeMapJSON, toHelixVertices, toMutationOverlay, toGenomicRegionJSON } from "../transformers/genome.transformer";
import { UpstreamError } from "../middleware/error-handler";
import { logger } from "../middleware/request-logger";
import type { ChromosomeData, HelixVertexData, MutationOverlay, GenomicRegion } from "../types/index";
import fs from "fs/promises";
import path from "path";

const genomicsApi = axios.create({
  baseURL: env.GENOMICS_API_URL,
  timeout: 10000,
});

export async function getChromosomeMap(): Promise<{ data: ChromosomeData[]; cached: boolean }> {
  const key = CacheKeys.chromosomeMap();
  const cached = await cacheManager.get<ChromosomeData[]>(key);
  if (cached) return { data: cached, cached: true };

  try {
    const response = await genomicsApi.get("/api/genomics/chromosomes");
    const data = toChromosomeMapJSON(response.data);
    await cacheManager.set(key, data, CacheTTL.CHROMOSOME_MAP);
    return { data, cached: false };
  } catch (err) {
    logger.warn({ error: err }, "Genomics API unavailable — using default karyotype");
    const data = toChromosomeMapJSON();
    await cacheManager.set(key, data, CacheTTL.CHROMOSOME_MAP);
    return { data, cached: false };
  }
}

export async function getGenomicRegion(chr: string, start: number, end: number): Promise<{ data: GenomicRegion; cached: boolean }> {
  const key = CacheKeys.genomicRegion(chr, start, end);
  const cached = await cacheManager.get<GenomicRegion>(key);
  if (cached) return { data: cached, cached: true };

  try {
    const response = await genomicsApi.get(`/api/genomics/region/${chr}/${start}/${end}`);
    const data = toGenomicRegionJSON(response.data);
    await cacheManager.set(key, data, CacheTTL.GENOMIC_REGION);
    return { data, cached: false };
  } catch (err) {
    logger.warn({ chr, start, end, error: err }, "Genomics API unavailable — returning empty region");
    const data = toGenomicRegionJSON({ chromosome: chr, start, end });
    return { data, cached: false };
  }
}

export async function getMutationOverlay(analysisId: string): Promise<{ data: MutationOverlay[]; cached: boolean }> {
  const key = CacheKeys.mutationOverlay(analysisId);
  const cached = await cacheManager.get<MutationOverlay[]>(key);
  if (cached) return { data: cached, cached: true };

  try {
    const response = await genomicsApi.get(`/api/genomics/analysis/${analysisId}/mutations`);
    const data = toMutationOverlay(response.data?.mutations);
    await cacheManager.set(key, data, CacheTTL.MUTATION_OVERLAY);
    return { data, cached: false };
  } catch (err) {
    logger.warn({ analysisId, error: err }, "Genomics API unavailable — using default mutations");
    const data = toMutationOverlay();
    await cacheManager.set(key, data, CacheTTL.MUTATION_OVERLAY);
    return { data, cached: false };
  }
}

export async function getHelixModel(filename?: string): Promise<{ data: HelixVertexData; cached: boolean }> {
  const key = CacheKeys.helixModel(filename);
  const cached = await cacheManager.get<HelixVertexData>(key);
  if (cached) return { data: cached, cached: true };

  if (filename) {
    try {
      const filePath = path.join(process.cwd(), "..", "..", "public", "uploads", filename);
      const content = await fs.readFile(filePath, "utf-8");
      
      let sequence = content.replace(/\r/g, "");
      if (sequence.startsWith(">")) {
        sequence = sequence.split("\n").slice(1).join("");
      } else {
        sequence = sequence.replace(/\n/g, "");
      }
      
      const data = toHelixVertices(sequence);
      await cacheManager.set(key, data, CacheTTL.HELIX_MODEL);
      return { data, cached: false };
    } catch (err) {
      logger.warn({ filename, error: err }, "Failed to read uploaded DNA file — generating default helix model");
    }
  }

  try {
    const response = await genomicsApi.get("/api/genomics/reference-sequence", { params: { length: 200 } });
    const data = toHelixVertices(response.data?.sequence);
    await cacheManager.set(key, data, CacheTTL.HELIX_MODEL);
    return { data, cached: false };
  } catch (err) {
    logger.warn("Genomics API unavailable — generating default helix model");
    const data = toHelixVertices(undefined, 200);
    await cacheManager.set(key, data, CacheTTL.HELIX_MODEL);
    return { data, cached: false };
  }
}
