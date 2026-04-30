import { Router, type Request, type Response, type NextFunction } from "express";
import * as phyloTreeService from "../services/phylo-tree.service";
import { validate, treeIdParamSchema, newickUploadSchema } from "../validators/input.validator";
import { uploadRateLimiter } from "../middleware/rate-limiter";

const router = Router();

/**
 * GET /api/viz/phylo/tree/:treeId
 * Fetches and returns a precomputed phylogenetic tree in D3.js-compatible format.
 */
router.get(
  "/tree/:treeId",
  validate(treeIdParamSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await phyloTreeService.getTree(req.params.treeId as string);
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
 * POST /api/viz/phylo/parse
 * Accepts a Newick-format string and returns hierarchical JSON.
 * Rate-limited to prevent abuse.
 */
router.post(
  "/parse",
  uploadRateLimiter,
  validate(newickUploadSchema, "body"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { newick, name } = req.body as { newick: string; name?: string };
      const data = await phyloTreeService.parseNewick(newick, name);
      res.json({
        success: true,
        data,
        cached: false,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/viz/phylo/sample-trees
 * Lists available sample phylogenetic trees.
 */
router.get("/sample-trees", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await phyloTreeService.getSampleTrees();
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
