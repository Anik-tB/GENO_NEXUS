import { getRedisClient, isRedisAvailable } from "../config/redis";
import { logger } from "../middleware/request-logger";
import { env } from "../config/env";

// -----------------------------------------------------------
// In-Memory LRU Cache (Fallback when Redis is unavailable)
// -----------------------------------------------------------

interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

class InMemoryLRUCache {
  private cache = new Map<string, MemoryCacheEntry>();
  private readonly maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  flush(pattern: string): void {
    const prefix = pattern.replace(/\*/g, "");
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// -----------------------------------------------------------
// Unified Cache Manager
// -----------------------------------------------------------

const memoryCache = new InMemoryLRUCache(500);

export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(pattern: string): Promise<void>;
  getStats(): Promise<{ engine: string; keys: number }>;
}

export const cacheManager: CacheManager = {
  /**
   * Get a value from cache. Tries Redis first, falls back to memory.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis
      if (isRedisAvailable()) {
        const redis = getRedisClient();
        if (redis) {
          const data = await redis.get(key);
          if (data) {
            logger.debug({ key, engine: "redis" }, "Cache HIT");
            return JSON.parse(data) as T;
          }
        }
      }

      // Fallback to memory
      const memData = memoryCache.get(key);
      if (memData) {
        logger.debug({ key, engine: "memory" }, "Cache HIT");
        return JSON.parse(memData) as T;
      }

      logger.debug({ key }, "Cache MISS");
      return null;
    } catch (err) {
      logger.warn({ key, error: err }, "Cache get error");
      return null;
    }
  },

  /**
   * Set a value in cache. Writes to both Redis and memory.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? env.REDIS_CACHE_TTL;
    const serialized = JSON.stringify(value);

    try {
      // Write to Redis
      if (isRedisAvailable()) {
        const redis = getRedisClient();
        if (redis) {
          await redis.setex(key, ttl, serialized);
        }
      }

      // Always write to memory as backup
      memoryCache.set(key, serialized, ttl);
      logger.debug({ key, ttl }, "Cache SET");
    } catch (err) {
      // Still write to memory even if Redis fails
      memoryCache.set(key, serialized, ttl);
      logger.warn({ key, error: err }, "Cache set error (memory fallback used)");
    }
  },

  /**
   * Delete a key from both caches.
   */
  async del(key: string): Promise<void> {
    try {
      if (isRedisAvailable()) {
        const redis = getRedisClient();
        if (redis) await redis.del(key);
      }
      memoryCache.del(key);
    } catch (err) {
      logger.warn({ key, error: err }, "Cache del error");
      memoryCache.del(key);
    }
  },

  /**
   * Flush keys matching a pattern from both caches.
   */
  async flush(pattern: string): Promise<void> {
    try {
      if (isRedisAvailable()) {
        const redis = getRedisClient();
        if (redis) {
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
      }
      memoryCache.flush(pattern);
      logger.info({ pattern }, "Cache flushed");
    } catch (err) {
      logger.warn({ pattern, error: err }, "Cache flush error");
      memoryCache.flush(pattern);
    }
  },

  /**
   * Get cache statistics for health checks.
   */
  async getStats(): Promise<{ engine: string; keys: number }> {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        const info = await redis.dbsize();
        return { engine: "redis", keys: info };
      }
    }
    return { engine: "memory", keys: memoryCache.size };
  },
};

// -----------------------------------------------------------
// Cache Key Builders (namespaced by service)
// -----------------------------------------------------------

export const CacheKeys = {
  // Genome Browser
  chromosomeMap: () => "viz:genome:chrmap",
  genomicRegion: (chr: string, start: number, end: number) =>
    `viz:genome:region:${chr}:${start}:${end}`,
  mutationOverlay: (analysisId: string) => `viz:genome:mutations:${analysisId}`,
  helixModel: (filename?: string) => `viz:genome:helix-model${filename ? ':' + filename : ''}`,

  // Cell Twin
  cellBaseline: () => "viz:cell:baseline",
  simulation: (drugId: string) => `viz:cell:sim:${drugId}`,
  simulationTimeline: (simId: string) => `viz:cell:timeline:${simId}`,

  // Phylogenetic Tree
  phyloTree: (treeId: string) => `viz:phylo:tree:${treeId}`,
  sampleTrees: () => "viz:phylo:sample-trees",

  // Virus Tracker
  outbreakMap: () => "viz:virus:outbreaks",
  timeSeries: (months: number) => `viz:virus:timeseries:${months}`,
  latestMutations: () => "viz:virus:mutations:latest",
};

// TTL values in seconds
export const CacheTTL = {
  CHROMOSOME_MAP: 86400,       // 24 hours — static data
  GENOMIC_REGION: 3600,        // 1 hour
  MUTATION_OVERLAY: 1800,      // 30 minutes
  HELIX_MODEL: 86400,          // 24 hours
  CELL_BASELINE: 86400,        // 24 hours
  SIMULATION: 3600,            // 1 hour
  SIMULATION_TIMELINE: 3600,   // 1 hour
  PHYLO_TREE: 21600,           // 6 hours
  SAMPLE_TREES: 86400,         // 24 hours
  OUTBREAK_MAP: 300,           // 5 minutes — near real-time
  TIME_SERIES: 900,            // 15 minutes
  LATEST_MUTATIONS: 60,        // 1 minute
};
