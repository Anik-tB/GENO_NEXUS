import express from "express";
import { createServer } from "http";
import helmet from "helmet";
import { env } from "./config/env";
import { createRedisClient, closeRedis } from "./config/redis";
import { corsMiddleware } from "./middleware/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { apiRateLimiter } from "./middleware/rate-limiter";
import { requestLogger, logger } from "./middleware/request-logger";
import { initializeWebSocket, closeAllConnections } from "./websocket/virus-stream";

// Route imports
import healthRoutes from "./routes/health.routes";
import genomeBrowserRoutes from "./routes/genome-browser.routes";
import cellTwinRoutes from "./routes/cell-twin.routes";
import phyloTreeRoutes from "./routes/phylo-tree.routes";
import virusTrackerRoutes from "./routes/virus-tracker.routes";

// -----------------------------------------------------------
// Express Application Setup
// -----------------------------------------------------------

const app = express();

// Core middleware
app.use(helmet({ contentSecurityPolicy: false })); // CSP handled by Next.js frontend
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));  // For Newick file uploads
app.use(requestLogger);
app.use(apiRateLimiter);
app.use(authMiddleware);

// -----------------------------------------------------------
// API Routes — all under /api/viz/
// -----------------------------------------------------------

app.use("/api/viz/health", healthRoutes);
app.use("/api/viz/genome", genomeBrowserRoutes);
app.use("/api/viz/cell-twin", cellTwinRoutes);
app.use("/api/viz/phylo", phyloTreeRoutes);
app.use("/api/viz/virus", virusTrackerRoutes);

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: "The requested visualization endpoint does not exist",
    availableEndpoints: {
      health: "/api/viz/health",
      genome: "/api/viz/genome/chromosomes",
      cellTwin: "/api/viz/cell-twin/baseline",
      phylo: "/api/viz/phylo/sample-trees",
      virus: "/api/viz/virus/outbreaks",
      websocket: "ws://localhost:" + env.PORT + "/ws/virus-stream",
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// -----------------------------------------------------------
// Server Startup
// -----------------------------------------------------------

const server = createServer(app);

// Initialize Redis (non-blocking — falls back to memory if unavailable)
createRedisClient();

// Initialize WebSocket for virus mutation streaming
initializeWebSocket(server);

server.listen(env.PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🧬 GenoNexus Visualization Service                        ║
║   ─────────────────────────────────────                      ║
║                                                              ║
║   REST API:    http://localhost:${env.PORT}/api/viz/health${" ".repeat(Math.max(0, 10 - String(env.PORT).length))}║
║   WebSocket:   ws://localhost:${env.PORT}/ws/virus-stream${" ".repeat(Math.max(0, 10 - String(env.PORT).length))}║
║   Environment: ${env.NODE_ENV.padEnd(44)}║
║                                                              ║
║   Endpoints:                                                 ║
║   ├─ GET  /api/viz/genome/chromosomes                        ║
║   ├─ GET  /api/viz/genome/helix-model                        ║
║   ├─ GET  /api/viz/cell-twin/baseline                        ║
║   ├─ GET  /api/viz/phylo/sample-trees                        ║
║   ├─ GET  /api/viz/virus/outbreaks                           ║
║   └─ WS   /ws/virus-stream                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// -----------------------------------------------------------
// Graceful Shutdown
// -----------------------------------------------------------

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received — starting graceful shutdown`);

  // Close WebSocket connections
  closeAllConnections();

  // Close Redis
  await closeRedis();

  // Close HTTP server
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { app, server };
