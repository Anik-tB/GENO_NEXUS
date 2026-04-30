import { Router, type Request, type Response, type NextFunction } from "express";
import * as virusTrackerService from "../services/virus-tracker.service";
import { validate, timeSeriesQuerySchema, latestMutationsQuerySchema } from "../validators/input.validator";

const router = Router();

/**
 * GET /api/viz/virus/outbreaks
 * Returns current global outbreak map data.
 */
router.get("/outbreaks", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await virusTrackerService.getOutbreakMap();
    res.json({
      success: true,
      data: result.data,
      cached: result.cached,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/viz/virus/timeseries?months=12
 * Returns historical case data as time-series for chart rendering.
 */
router.get(
  "/timeseries",
  validate(timeSeriesQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { months } = req.query as unknown as { months: number };
      const result = await virusTrackerService.getTimeSeries(months);
      res.json({
        success: true,
        data: result.data,
        cached: result.cached,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/viz/virus/mutations/latest?limit=20
 * Returns the latest mutation events.
 */
router.get(
  "/mutations/latest",
  validate(latestMutationsQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query as unknown as { limit: number };
      const result = await virusTrackerService.getLatestMutations(limit);
      res.json({
        success: true,
        data: result.data,
        cached: result.cached,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
