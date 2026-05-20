import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { assertDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { getCopilotContext } from "@/lib/copilot/context";
import { buildGreeting } from "@/lib/copilot/reply";
import {
  askGeminiCopilot,
  CopilotApiConfigurationError,
  CopilotApiRequestError,
} from "@/lib/copilot/gemini";

export const runtime = "nodejs";

const copilotRequestSchema = z.object({
  message: z.string().trim().min(1).max(1500),
  mode: z.enum(["chat", "prevention_plan"]).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "ai"]),
        text: z.string().max(3000),
      }),
    )
    .max(12)
    .optional(),
});

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __genonexusCopilotRateLimit__: Map<string, RateLimitBucket> | undefined;
}

const rateLimitStore =
  global.__genonexusCopilotRateLimit__ ??
  (global.__genonexusCopilotRateLimit__ = new Map<string, RateLimitBucket>());

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 24;

async function getAuthedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) return null;
  return getUserFromSessionToken(token);
}

function checkCopilotRateLimit(userId: string) {
  const now = Date.now();
  const bucket = rateLimitStore.get(userId);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function getCopilotApiErrorResponse(error: unknown) {
  if (error instanceof CopilotApiConfigurationError) {
    return NextResponse.json(
      {
        error: error.message,
        missingConfiguration: true,
      },
      { status: 503 },
    );
  }

  if (error instanceof CopilotApiRequestError) {
    return NextResponse.json(
      {
        error: error.message,
        provider: "gemini",
      },
      { status: 502 },
    );
  }

  return null;
}

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = assertDatabase();
    const context = await getCopilotContext(user.id, db);
    const greeting = buildGreeting(context);
    const reply = await askGeminiCopilot({
      context,
      message: "Give the user a concise opening summary of the latest GenoNexus analysis. If no completed analysis exists, explain what is missing.",
    });

    return NextResponse.json({
      success: true,
      reply,
      suggestions: greeting.suggestions,
      meta: greeting.meta,
      provider: "gemini",
      model: env.geminiModel,
    });
  } catch (error) {
    const apiError = getCopilotApiErrorResponse(error);
    if (apiError) return apiError;

    console.error("GET /api/copilot error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkCopilotRateLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many copilot requests. Please wait a moment.", retryAfterSeconds: limit.retryAfterSeconds },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parsed = copilotRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid copilot request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const db = assertDatabase();
    const context = await getCopilotContext(user.id, db);
    const greeting = buildGreeting(context);

    let systemInstruction: string | undefined;
    if (parsed.data.mode === "prevention_plan") {
      systemInstruction = [
        "You are Genome Copilot, an expert clinical genomics assistant inside GenoNexus.",
        "Your task is to generate a personalized, evidence-grounded clinical prevention plan for the patient based on their predicted disease risk and contributing genes.",
        "Use the provided GenoNexus project context and the user's genomic analysis context as your clinical grounding.",
        "Return the prevention plan in standard JSON format as a list of sections containing 'title' and 'content' keys.",
        "Example format:",
        "[",
        "  { \"title\": \"Medication Adjustment\", \"content\": \"Standard treatments may fail...\" },",
        "  { \"title\": \"Enhanced Screening\", \"content\": \"Given the BRCA1 mutation, initiate annual MRIs starting at age 25...\" }",
        "]",
        "Provide exactly 2 to 4 actionable, highly-specific sections. Avoid generic advice where possible; customize it to the specific disease, genes, and risk context.",
        "Do not output markdown code blocks (e.g. ```json), do not output any other text or headers. Just return raw, valid JSON."
      ].join("\n");
    }

    const reply = await askGeminiCopilot({
      context,
      message: parsed.data.message,
      history: parsed.data.history,
      systemInstruction,
      responseMimeType: parsed.data.mode === "prevention_plan" ? "application/json" : "text/plain",
      maxOutputTokens: parsed.data.mode === "prevention_plan" ? 1500 : 700,
    });

    return NextResponse.json({
      success: true,
      reply,
      suggestions: greeting.suggestions,
      meta: greeting.meta,
      provider: "gemini",
      model: env.geminiModel,
    });
  } catch (error) {
    const apiError = getCopilotApiErrorResponse(error);
    if (apiError) return apiError;

    console.error("POST /api/copilot error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
