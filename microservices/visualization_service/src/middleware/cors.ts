import corsLib from "cors";
import { env } from "../config/env";

/**
 * CORS middleware configured from environment variables.
 * Allows the Next.js frontend and any other whitelisted origins.
 */
export const corsMiddleware = corsLib({
  origin: env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  credentials: true,
  maxAge: 86400, // 24h preflight cache
});
