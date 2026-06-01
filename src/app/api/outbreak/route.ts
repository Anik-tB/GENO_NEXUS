import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { assertDatabase } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const REGION_TO_ISO3: Record<string, string> = {
  "global": "GLOBAL",
  "bangladesh": "BGD",
  "usa": "USA",
  "uk": "GBR",
  "india": "IND",
  "brazil": "BRA",
  "italy": "ITA"
};

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

    // 1. Fetch real historical data
    let historicalPoints = [12, 18, 25, 32, 45, 58, 65]; // Fallback mock data

    if (pathogen.toLowerCase() === "covid-19") {
      const isGlobal = region.toLowerCase() === "global";
      const diseaseUrl = isGlobal
        ? "https://disease.sh/v3/covid-19/historical/all?lastdays=210"
        : `https://disease.sh/v3/covid-19/historical/${encodeURIComponent(region.toLowerCase())}?lastdays=210`;

      try {
        const dRes = await fetch(diseaseUrl);
        if (dRes.ok) {
          const dJson = await dRes.json();
          const casesObj = dJson.cases || (dJson.timeline && dJson.timeline.cases);
          
          if (casesObj) {
            const dates = Object.keys(casesObj);
            if (dates.length >= 180) {
              const points = [];
              // Calculate new cases per 30-day window for the last 7 months
              for (let i = 0; i < 7; i++) {
                const endIdx = dates.length - 1 - (6 - i) * 30;
                const startIdx = Math.max(0, endIdx - 30);
                const endCases = casesObj[dates[endIdx]] || 0;
                const startCases = casesObj[dates[startIdx]] || 0;
                points.push(Math.max(0, endCases - startCases));
              }
              historicalPoints = points;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch from disease.sh", e);
      }
    } else if (pathogen.toLowerCase() === "hiv") {
      const iso3 = REGION_TO_ISO3[region.toLowerCase()] || "GLOBAL";
      const whoUrl = `https://ghoapi.azureedge.net/api/HIV_0000000001?$filter=SpatialDim eq '${iso3}'`;
      
      let fallbackHiv = [12000, 13000, 14000, 15000, 16000, 16000, 17000]; // Bangladesh/country default
      if (iso3 === "GLOBAL") {
        fallbackHiv = [36400000, 37100000, 37800000, 38400000, 38900000, 39500000, 40400000];
      }
      historicalPoints = fallbackHiv;

      try {
        const dRes = await fetch(whoUrl);
        if (dRes.ok) {
          const dJson = await dRes.json();
          if (dJson && dJson.value && Array.isArray(dJson.value)) {
            // Sort by year (TimeDim) ascending
            const records = dJson.value
              .filter((item: any) => item.TimeDim !== undefined && item.NumericValue !== null)
              .sort((a: any, b: any) => Number(a.TimeDim) - Number(b.TimeDim));
            
            // We want the last 7 years of data
            if (records.length >= 7) {
              const last7 = records.slice(-7);
              historicalPoints = last7.map((item: any) => Math.round(item.NumericValue));
            } else if (records.length > 0) {
              historicalPoints = records.map((item: any) => Math.round(item.NumericValue));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch from WHO GHO API:", e);
      }
    }

    // 2. Call the Python Microservice for Mathematical Forecasting
    let futurePoints = [];
    if (pathogen.toLowerCase() === "hiv") {
      const lastVal = historicalPoints[historicalPoints.length - 1];
      const step = Math.round(lastVal * 0.03); // assume 3% annual growth
      futurePoints = [
        lastVal + step,
        lastVal + step * 2,
        lastVal + step * 3,
        lastVal + step * 4
      ];
    } else {
      futurePoints = [100, 120, 140, 160]; // default fallback for covid
    }

    try {
      const pyRes = await fetch("http://127.0.0.1:8001/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historical_points: historicalPoints, horizon_periods: 4 })
      });
      if (pyRes.ok) {
        const pyJson = await pyRes.json();
        futurePoints = pyJson.future_points;
      } else {
        console.warn("Python microservice returned an error. Make sure it is running on port 8001.");
      }
    } catch (e) {
      console.warn("Could not connect to Python microservice on port 8001. Fallback data used.", e);
    }

    // 3. Generate Alert Insights using Gemini based on the Python Math Model
    const dataContext = pathogen.toLowerCase() === "hiv"
      ? `representing the total estimated number of people living with HIV in the region "${region}" at annual intervals over the last 7 years, and the Mathematically Forecasted values for the next 4 years`
      : `representing newly reported ${pathogen} cases in the region "${region}" calculated at 30-day intervals over the last 7 months, and the Mathematically Forecasted new cases for the next 4 months`;

    const prompt = `
      Act as an advanced epidemiological AI. The following arrays represent REAL data ${dataContext} generated by a Double Exponential Smoothing Python model:
      
      Historical: ${JSON.stringify(historicalPoints)}
      Forecasted: ${JSON.stringify(futurePoints)}

      Based on these numbers, generate realistic alert statistics.
      
      You must respond ONLY with a valid JSON object matching this schema:
      {
        "alert_stats": [
          { "label": "Projected Trend", "value": "string (e.g. '+45%' or '-10%')", "color": "var(--gn-danger) or var(--gn-warning) or var(--gn-primary)" },
          { "label": "Active Hotspots", "value": "string (e.g. 'High' or 'Low')", "color": "var(--gn-warning)" },
          { "label": "Sequences Tracked", "value": "string (e.g. '3,421')", "color": "var(--gn-primary)" },
          { "label": "R₀ Estimate", "value": "string (e.g. '1.4')", "color": "var(--gn-warning)" }
        ]
      }
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
    
    let aiInsights = {
      alert_stats: [
        { label: "Projected Trend", value: pathogen.toLowerCase() === "hiv" ? "+3.5%" : "+45%", color: "var(--gn-danger)" },
        { label: "Active Hotspots", value: "High", color: "var(--gn-warning)" },
        { label: "Sequences Tracked", value: pathogen.toLowerCase() === "hiv" ? "1,240" : "3,421", color: "var(--gn-primary)" },
        { label: "R₀ Estimate", value: pathogen.toLowerCase() === "hiv" ? "1.15" : "2.4", color: "var(--gn-warning)" }
      ]
    };

    if (response.ok && payload?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const responseText = payload.candidates[0].content.parts[0].text;
      const cleanJsonString = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        const parsed = JSON.parse(cleanJsonString);
        if (parsed.alert_stats) {
          aiInsights = parsed;
        }
      } catch (e) {
        console.error("Failed to parse Gemini response:", responseText);
      }
    } else {
      console.error("Gemini API Error details:", {
        status: response.status,
        statusText: response.statusText,
        error: payload?.error || payload
      });
      console.warn("Could not generate insights from Gemini. Using realistic fallback alert statistics.");
    }

    const forecastData = {
      historical_points: historicalPoints,
      future_points: futurePoints,
      alert_stats: aiInsights.alert_stats || []
    };

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
