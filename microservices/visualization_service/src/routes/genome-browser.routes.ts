import { Router, type Request, type Response, type NextFunction } from "express";
import * as genomeBrowserService from "../services/genome-browser.service";
import { validate, genomicRegionParamSchema, analysisIdParamSchema } from "../validators/input.validator";

const router = Router();

/**
 * GET /api/viz/genome/chromosomes
 * Returns full chromosome karyotype data for the chromosome map view.
 */
router.get("/chromosomes", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await genomeBrowserService.getChromosomeMap();
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
 * GET /api/viz/genome/region/:chr/:start/:end
 * Returns a specific genomic region in render-ready format.
 */
router.get(
  "/region/:chr/:start/:end",
  validate(genomicRegionParamSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chr, start, end } = req.params as unknown as { chr: string; start: number; end: number };
      const result = await genomeBrowserService.getGenomicRegion(chr, Number(start), Number(end));
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
 * GET /api/viz/genome/mutations/:analysisId
 * Returns mutation overlay data for the 3D viewer.
 */
router.get(
  "/mutations/:analysisId",
  validate(analysisIdParamSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await genomeBrowserService.getMutationOverlay(req.params.analysisId as string);
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
 * GET /api/viz/genome/helix-model
 * Returns pre-computed 3D helix vertex data for Three.js rendering.
 */
router.get("/helix-model", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = req.query.file as string | undefined;
    const result = await genomeBrowserService.getHelixModel(filename);
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

export default router;
