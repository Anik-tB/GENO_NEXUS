import { z } from "zod";

// -----------------------------------------------------------
// Genome Browser Validators
// -----------------------------------------------------------

export const chromosomeParamSchema = z.object({
  chr: z.string().regex(/^([1-9]|1[0-9]|2[0-2]|X|Y|XY)$/, "Invalid chromosome identifier"),
});

export const genomicRegionParamSchema = z.object({
  chr: z.string().regex(/^([1-9]|1[0-9]|2[0-2]|X|Y)$/, "Invalid chromosome"),
  start: z.coerce.number().int().positive().max(300_000_000, "Start position out of range"),
  end: z.coerce.number().int().positive().max(300_000_000, "End position out of range"),
}).refine((data) => data.end > data.start, {
  message: "End position must be greater than start position",
});

export const analysisIdParamSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID format"),
});

// -----------------------------------------------------------
// Cell Twin Validators
// -----------------------------------------------------------

export const drugIdParamSchema = z.object({
  drugId: z.string().min(1).max(100, "Drug ID too long"),
});

export const simulationIdParamSchema = z.object({
  simId: z.string().min(1).max(100, "Simulation ID too long"),
});

export const timeStepQuerySchema = z.object({
  step: z.coerce.number().int().nonnegative().optional(),
});

// -----------------------------------------------------------
// Phylogenetic Tree Validators
// -----------------------------------------------------------

export const treeIdParamSchema = z.object({
  treeId: z.string().min(1).max(100, "Tree ID too long"),
});

export const newickUploadSchema = z.object({
  newick: z.string()
    .min(3, "Newick string too short")
    .max(10_000_000, "Newick string exceeds 10MB limit")
    .refine((s) => s.includes("(") && s.includes(")"), "Invalid Newick format — must contain parentheses"),
  name: z.string().max(200).optional(),
});

// -----------------------------------------------------------
// Virus Tracker Validators
// -----------------------------------------------------------

export const timeSeriesQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(60).default(12),
});

export const latestMutationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// -----------------------------------------------------------
// WebSocket Message Validator
// -----------------------------------------------------------

export const wsMessageSchema = z.object({
  type: z.enum(["subscribe", "unsubscribe", "ping"]),
  channel: z.string().optional(),
});

// -----------------------------------------------------------
// Middleware: Validate Request Helper
// -----------------------------------------------------------

import type { Request, Response, NextFunction } from "express";

type ValidationTarget = "params" | "query" | "body";

export function validate(schema: z.ZodSchema, target: ValidationTarget = "params") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request parameters",
        details: errors,
      });
      return;
    }

    // Overwrite with parsed/coerced values
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
