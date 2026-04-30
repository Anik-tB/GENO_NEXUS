 import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import type { IncomingMessage } from "http";
import { env } from "../config/env";
import { logger } from "../middleware/request-logger";
import { generateLiveMutationEvent } from "../transformers/virus.transformer";
import type { WebSocketMessage } from "../types/index";

interface ClientConnection {
  ws: WebSocket;
  id: string;
  connectedAt: number;
  lastPong: number;
  subscriptions: Set<string>;
}

let wss: WebSocketServer | null = null;
const clients = new Map<string, ClientConnection>();
let simulationInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the WebSocket server for real-time virus mutation streaming.
 * Attaches to the existing HTTP server using path-based upgrade handling.
 */
export function initializeWebSocket(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ noServer: true });

  // Handle HTTP upgrade requests for WebSocket
  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);

    if (url.pathname === "/ws/virus-stream") {
      // Validate auth (API key from query param or header)
      const apiKey = url.searchParams.get("apiKey")
        || (request.headers["x-api-key"] as string);

      if (!apiKey || apiKey !== env.API_KEY) {
        logger.warn({ ip: request.socket.remoteAddress }, "WebSocket auth rejected");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Check max connections
      if (clients.size >= env.WS_MAX_CONNECTIONS) {
        logger.warn("WebSocket max connections reached");
        socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
        socket.destroy();
        return;
      }

      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle new connections
  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const client: ClientConnection = {
      ws,
      id: clientId,
      connectedAt: Date.now(),
      lastPong: Date.now(),
      subscriptions: new Set(["mutations"]), // Default subscription
    };

    clients.set(clientId, client);
    logger.info({ clientId, total: clients.size }, "WebSocket client connected");

    // Send welcome message
    sendToClient(ws, {
      type: "mutation_update",
      data: {
        message: "Connected to GenoNexus Virus Mutation Stream",
        clientId,
        activeClients: clients.size,
      },
      timestamp: new Date().toISOString(),
    });

    // Handle incoming messages
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "ping") {
          sendToClient(ws, { type: "heartbeat", data: {}, timestamp: new Date().toISOString() });
        } else if (msg.type === "subscribe" && msg.channel) {
          client.subscriptions.add(msg.channel);
        } else if (msg.type === "unsubscribe" && msg.channel) {
          client.subscriptions.delete(msg.channel);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    // Handle pong for heartbeat
    ws.on("pong", () => {
      client.lastPong = Date.now();
    });

    // Handle disconnect
    ws.on("close", () => {
      clients.delete(clientId);
      logger.info({ clientId, total: clients.size }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ clientId, error: err.message }, "WebSocket client error");
      clients.delete(clientId);
    });
  });

  // Start mutation simulation (dev mode broadcasts generated events)
  startMutationSimulation();

  // Start heartbeat to detect stale connections
  startHeartbeat();

  logger.info("WebSocket server initialized at /ws/virus-stream");
  return wss;
}

/**
 * Broadcasts a message to all connected clients with matching subscriptions.
 */
export function broadcast(message: WebSocketMessage, channel = "mutations"): void {
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN && client.subscriptions.has(channel)) {
      sendToClient(client.ws, message);
    }
  }
}

/**
 * Get the number of active WebSocket connections.
 */
export function getConnectionCount(): number {
  return clients.size;
}

/**
 * Gracefully close all WebSocket connections.
 */
export function closeAllConnections(): void {
  if (simulationInterval) clearInterval(simulationInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  for (const client of clients.values()) {
    sendToClient(client.ws, {
      type: "error",
      data: { message: "Server shutting down" },
      timestamp: new Date().toISOString(),
    });
    client.ws.close(1001, "Server shutting down");
  }

  clients.clear();
  wss?.close();
  logger.info("WebSocket server closed");
}

// -----------------------------------------------------------
// Internal Helpers
// -----------------------------------------------------------

function sendToClient(ws: WebSocket, message: WebSocketMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Simulates real-time mutation events by broadcasting generated data.
 * In production, this would be replaced by an upstream WebSocket/Kafka subscription.
 */
function startMutationSimulation(): void {
  simulationInterval = setInterval(() => {
    if (clients.size === 0) return; // Don't generate if nobody's listening

    const event = generateLiveMutationEvent();
    broadcast(
      {
        type: "mutation_update",
        data: event as unknown as Record<string, unknown>,
        timestamp: new Date().toISOString(),
      },
      "mutations",
    );
  }, 4000); // Match the frontend's 4-second interval
}

/**
 * Heartbeat: ping clients and disconnect stale ones.
 */
function startHeartbeat(): void {
  heartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, client] of clients.entries()) {
      if (now - client.lastPong > env.WS_HEARTBEAT_INTERVAL * 2) {
        logger.info({ clientId: id }, "Terminating stale WebSocket connection");
        client.ws.terminate();
        clients.delete(id);
      } else {
        client.ws.ping();
      }
    }
  }, env.WS_HEARTBEAT_INTERVAL);
}
