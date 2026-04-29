import { Router, type Request, type Response, type NextFunction } from "express";
import * as cellTwinService from "../services/cell-twin.service";
import { validate, drugIdParamSchema, simulationIdParamSchema, timeStepQuerySchema } from "../validators/input.validator";

const router = Router();

/**
 * GET /api/viz/cell-twin/baseline
 * Returns baseline (pre-drug) cellular metrics.
 */
router.get("/baseline", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await cellTwinService.getBaseline();
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
 * GET /api/viz/cell-twin/simulation/:drugId
 * Returns drug interaction simulation result.
 */
router.get(
  "/simulation/:drugId",
  validate(drugIdParamSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await cellTwinService.getSimulation(req.params.drugId as string);
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
 * GET /api/viz/cell-twin/timeline/:simId
 * Returns time-series playback data for a simulation.
 */
router.get(
  "/timeline/:simId",
  validate(simulationIdParamSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await cellTwinService.getTimeline(req.params.simId as string);
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
 * GET /api/viz/cell-twin/organelles/:simId
 * Returns organelle status at a specific time step.
 */
router.get(
  "/organelles/:simId",
  validate(simulationIdParamSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const step = req.query.step ? Number(req.query.step) : undefined;
      const result = await cellTwinService.getOrganelleStatus(req.params.simId as string, step);
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
