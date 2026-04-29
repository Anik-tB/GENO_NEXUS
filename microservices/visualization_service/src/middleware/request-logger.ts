import pino from "pino";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
    : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.headers['x-api-key']"],
    censor: "[REDACTED]",
  },
});

/**
 * Express middleware that logs every request with method, path, status, and duration.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn(logData, "Request completed with error");
    } else {
      logger.info(logData, "Request completed");
    }
  });

  next();
}
