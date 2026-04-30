import axios from "axios";
import { env } from "../config/env";
import { cacheManager, CacheKeys, CacheTTL } from "../cache/cache-manager";
import { newickToHierarchy, getDefaultTree, getSampleTreeList } from "../transformers/phylo.transformer";
import { logger } from "../middleware/request-logger";
import type { PhyloTreeData, SampleTree } from "../types/index";

const genomicsApi = axios.create({
  baseURL: env.GENOMICS_API_URL,
  timeout: 10000,
});

export async function getTree(treeId: string): Promise<{ data: PhyloTreeData; cached: boolean }> {
  const key = CacheKeys.phyloTree(treeId);
  const cached = await cacheManager.get<PhyloTreeData>(key);
  if (cached) return { data: cached, cached: true };

  // Check if it's a built-in sample tree
  if (treeId === "sample-primate-evolution") {
    const data = getDefaultTree();
    await cacheManager.set(key, data, CacheTTL.PHYLO_TREE);
    return { data, cached: false };
  }

  // Try fetching from Genomics API
  try {
    const response = await genomicsApi.get(`/api/genomics/phylo/tree/${treeId}`);
    const rawData = response.data;

    let data: PhyloTreeData;
    if (typeof rawData === "string" || rawData?.newick) {
      // Newick format from API
      data = newickToHierarchy(rawData?.newick || rawData, rawData?.name);
    } else {
      // Already structured JSON
      data = rawData as PhyloTreeData;
    }

    await cacheManager.set(key, data, CacheTTL.PHYLO_TREE);
    return { data, cached: false };
  } catch (err) {
    logger.warn({ treeId, error: err }, "Genomics API unavailable — using default tree");
    const data = getDefaultTree();
    await cacheManager.set(key, data, CacheTTL.PHYLO_TREE);
    return { data, cached: false };
  }
}

export async function parseNewick(newickString: string, name?: string): Promise<PhyloTreeData> {
  const data = newickToHierarchy(newickString, name);
  // Cache the parsed result
  await cacheManager.set(CacheKeys.phyloTree(data.treeId), data, CacheTTL.PHYLO_TREE);
  return data;
}

export async function getSampleTrees(): Promise<{ data: SampleTree[]; cached: boolean }> {
  const key = CacheKeys.sampleTrees();
  const cached = await cacheManager.get<SampleTree[]>(key);
  if (cached) return { data: cached, cached: true };

  const data = getSampleTreeList();
  await cacheManager.set(key, data, CacheTTL.SAMPLE_TREES);
  return { data, cached: false };
}
