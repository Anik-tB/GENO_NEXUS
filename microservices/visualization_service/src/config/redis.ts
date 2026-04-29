import Redis from "ioredis";
import { env, isDevelopment } from "./env";
import { logger } from "../middleware/request-logger";

let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Creates and returns the Redis client. Handles connection failures gracefully
 * so the service can still run with the in-memory cache fallback.
 */
export function createRedisClient(): Redis | null {
  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn("Redis: Max reconnection attempts reached, giving up");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    client.on("connect", () => {
      redisAvailable = true;
      logger.info("✅ Redis connected");
    });

    client.on("error", (err) => {
      redisAvailable = false;
      if (isDevelopment) {
        logger.warn(`Redis unavailable: ${err.message} — using in-memory cache`);
      }
    });

    client.on("close", () => {
      redisAvailable = false;
    });

    // Attempt connection (non-blocking)
    client.connect().catch(() => {
      logger.warn("Redis connection failed — falling back to in-memory cache");
    });

    redisClient = client;
    return client;
  } catch {
    logger.warn("Redis initialization failed — falling back to in-memory cache");
    return null;
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/**
 * Gracefully closes the Redis connection.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
    redisAvailable = false;
  }
}

/**
 * Health check for readiness probes.
 */
export async function checkRedisHealth(): Promise<"connected" | "disconnected"> {
  if (!redisClient || !redisAvailable) return "disconnected";
  try {
    await redisClient.ping();
    return "connected";
  } catch {
    return "disconnected";
  }
}
