import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { assertDatabase } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "Global";
    const pathogen = searchParams.get("pathogen") || "Influenza Strain A";
    const horizon = searchParams.get("horizon") || "1 Year";

    const db = assertDatabase();

    // Check if we have a recent forecast in the DB (cached for 1 hour)
    const cachedResult = await db.query(
      `SELECT * FROM outbreak_forecasts 
       WHERE region = $1 AND pathogen = $2 AND horizon = $3 
       AND created_at > NOW() - INTERVAL '1 hour'
       ORDER BY created_at DESC LIMIT 1`,
      [region, pathogen, horizon]
    );

    if (cachedResult.rows.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          historical_points: cachedResult.rows[0].historical_points,
          future_points: cachedResult.rows[0].future_points,
          alert_stats: cachedResult.rows[0].alert_stats,
        },
        cached: true,
      });
    }

    // Generate new forecast using Gemini
    const prompt = `
      Act as an advanced epidemiological AI. Generate realistic mock outbreak transmission data for the pathogen "${pathogen}" in the region "${region}" over a time horizon of "${horizon}".
      
      You must respond ONLY with a valid JSON object matching this schema:
      {
        "historical_points": [array of 7 integers representing past transmission rates],
        "future_points": [array of 4 integers representing projected transmission rates],
        "alert_stats": [
          { "label": "Projected Rise", "value": "string (e.g. '45%')", "color": "var(--gn-danger) or var(--gn-warning)" },
          { "label": "Active Regions", "value": "string (e.g. '12')", "color": "var(--gn-warning)" },
          { "label": "Sequences Tracked", "value": "string (e.g. '3,421')", "color": "var(--gn-primary)" },
          { "label": "R₀ Estimate", "value": "string (e.g. '2.4')", "color": "var(--gn-warning)" }
        ]
      }
      
      Make the numbers realistic based on the pathogen type (e.g., SARS-CoV-2 might have a higher R0 and faster spread than Ebola). Make the future points follow a logical trend (either rising or falling).
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel || "gemini-2.5-flash"}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.candidates || !payload.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("Failed to generate content from Gemini");
    }

    const responseText = payload.candidates[0].content.parts[0].text;

    const forecastData = JSON.parse(responseText);

    // Save to database
    await db.query(
      `INSERT INTO outbreak_forecasts (region, pathogen, horizon, historical_points, future_points, alert_stats)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        region, 
        pathogen, 
        horizon, 
        JSON.stringify(forecastData.historical_points), 
        JSON.stringify(forecastData.future_points), 
        JSON.stringify(forecastData.alert_stats)
      ]
    );

    return NextResponse.json({
      success: true,
      data: forecastData,
      cached: false,
    });

  } catch (error) {
    console.error("GET /api/outbreak error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
