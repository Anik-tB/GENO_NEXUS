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

    // Temporarily disable DB
    // const db = assertDatabase();

    // Check if we have a recent forecast in the DB (cached for 1 hour)
    /*
    const cachedResult = await db.query(
      `SELECT * FROM outbreak_forecasts 
       WHERE region = $1 AND pathogen = $2 AND horizon = $3 
       AND created_at > NOW() - INTERVAL '1 hour'
       ORDER BY created_at DESC LIMIT 1`,
      [region, pathogen, horizon]
    );
    */

    // Temporarily disable cache to force fetching from the new ML model
    /*
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
    */

    // 1. Fetch real historical data
    let historicalPoints = Array.from({ length: 24 }, (_, i) => 12 + i * 2 + Math.floor(Math.random() * 5)); // Fallback mock data

    if (pathogen.toLowerCase() === "covid-19") {
      const isGlobal = region.toLowerCase() === "global";
      const diseaseUrl = isGlobal
        ? "https://disease.sh/v3/covid-19/historical/all?lastdays=730"
        : `https://disease.sh/v3/covid-19/historical/${encodeURIComponent(region.toLowerCase())}?lastdays=730`;

      try {
        const dRes = await fetch(diseaseUrl);
        if (dRes.ok) {
          const dJson = await dRes.json();
          const casesObj = dJson.cases || (dJson.timeline && dJson.timeline.cases);
          
          if (casesObj) {
            const dates = Object.keys(casesObj);
            if (dates.length >= 600) {
              const points = [];
              // Calculate new cases per 30-day window for the last 24 months
              for (let i = 0; i < 24; i++) {
                const endIdx = dates.length - 1 - (23 - i) * 30;
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
      
      let fallbackHiv = [
        12000, 12500, 13000, 13500, 14000, 14500, 15000, 15500, 16000, 16500,
        17000, 17500, 18000, 18500, 19000, 19500, 20000, 20500, 21000, 21500
      ]; // Bangladesh/country default
      if (iso3 === "GLOBAL") {
        fallbackHiv = [
          30000000, 31000000, 32000000, 33000000, 34000000, 34500000, 35000000, 35500000,
          36000000, 36400000, 37100000, 37800000, 38400000, 38900000, 39500000, 40400000,
          40800000, 41200000, 41600000, 42000000
        ];
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
            
            // We want the last 20 years of data
            if (records.length >= 20) {
              const last20 = records.slice(-20);
              historicalPoints = last20.map((item: any) => Math.round(item.NumericValue));
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
    
    let horizonPeriods = 4;
    if (pathogen.toLowerCase() === "hiv") {
      if (horizon === "6 Months") horizonPeriods = 1; // HIV is annual
      if (horizon === "1 Year") horizonPeriods = 1;
      if (horizon === "5 Years") horizonPeriods = 5;
    } else {
      if (horizon === "6 Months") horizonPeriods = 6;
      if (horizon === "1 Year") horizonPeriods = 12;
      if (horizon === "5 Years") horizonPeriods = 60;
    }

    let alertStats = [];

    try {
      const pyRes = await fetch("http://127.0.0.1:8001/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          historical_points: historicalPoints, 
          horizon_periods: horizonPeriods,
          region: region,
          pathogen: pathogen
        })
      });
      if (pyRes.ok) {
        const pyJson = await pyRes.json();
        futurePoints = pyJson.future_points;
        alertStats = pyJson.alert_stats || [];
      } else {
        console.warn("Python microservice returned an error. Make sure it is running on port 8001.");
      }
    } catch (e) {
      console.warn("Could not connect to Python microservice on port 8001. Fallback data used.", e);
    }

    // 3. Fallback alert stats if microservice didn't provide them
    if (alertStats.length === 0) {
      alertStats = [
        { label: "ML SERVER OFFLINE", value: "ERR", color: "var(--gn-danger)" },
        { label: "Check Port 8001", value: "OFF", color: "var(--gn-warning)" },
        { label: "Sequences Tracked", value: "---", color: "var(--gn-primary)" },
        { label: "R₀ Estimate", value: "---", color: "var(--gn-warning)" }
      ];
    }

    const forecastData = {
      historical_points: historicalPoints,
      future_points: futurePoints,
      alert_stats: alertStats
    };

    // Temporarily disable DB insert
    /*
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
    */

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
