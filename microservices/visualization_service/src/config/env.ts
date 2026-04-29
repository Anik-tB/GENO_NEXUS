import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4500),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // External service URLs
  GENOMICS_API_URL: z.string().url().default("http://localhost:8000"),
  ML_API_URL: z.string().url().default("http://localhost:8001"),
  COLLABORATION_API_URL: z.string().url().default("http://localhost:8002"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_CACHE_TTL: z.coerce.number().default(300),

  // Security
  JWT_SECRET: z.string().default("genonexus-viz-jwt-secret-change-in-production"),
  API_KEY: z.string().default("genonexus-viz-api-key-change-in-production"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  // WebSocket
  WS_HEARTBEAT_INTERVAL: z.coerce.number().default(30000),
  WS_MAX_CONNECTIONS: z.coerce.number().default(100),

  // Logging
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
