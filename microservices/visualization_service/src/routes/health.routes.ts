import { Router, type Request, type Response } from "express";
import { checkRedisHealth } from "../config/redis";
import { cacheManager } from "../cache/cache-manager";
import { env } from "../config/env";
import axios from "axios";

const router = Router();
const startTime = Date.now();

/**
 * GET /api/viz/health — Liveness probe
 * Returns basic service status. Always returns 200 if the process is alive.
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "genonexus-visualization-service",
    version: "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/viz/health/ready — Readiness probe
 * Checks Redis connectivity and upstream API reachability.
 */
router.get("/ready", async (_req: Request, res: Response) => {
  const redis = await checkRedisHealth();
  const cacheStats = await cacheManager.getStats();

  // Check upstream services (non-blocking, with timeout)
  const checkService = async (name: string, url: string): Promise<string> => {
    try {
      await axios.get(url, { timeout: 3000 });
      return "reachable";
    } catch {
      return "unreachable";
    }
  };

  const [genomicsStatus, mlStatus] = await Promise.all([
    checkService("genomics", `${env.GENOMICS_API_URL}/health`),
    checkService("ml", `${env.ML_API_URL}/health`),
  ]);

  const isReady = true; // Service is always "ready" — it degrades gracefully

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "degraded",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    cache: {
      engine: cacheStats.engine,
      redis,
      keys: cacheStats.keys,
    },
    services: {
      genomics_api: genomicsStatus,
      ml_api: mlStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
