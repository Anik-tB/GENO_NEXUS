import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.accountCategory !== 'patient') {
      return NextResponse.json({ error: "Only patients can request DNA analysis appointments" }, { status: 403 });
    }

    const { patientName, analysisType } = await req.json();
    if (!patientName || !analysisType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = assertDatabase();

    // Ensure the table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS dna_appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        patient_name TEXT NOT NULL,
        analysis_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Insert booking
    const result = await db.query(`
      INSERT INTO dna_appointments (patient_id, patient_name, analysis_type, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [user.id, patientName, analysisType]);

    // Send a notification to the user
    await db.query(`
      INSERT INTO user_notifications (user_id, title, message, type, link)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      "DNA Ingestion Requested",
      `Your request for ${analysisType} DNA Analysis has been booked. A care coordinator will upload your DNA sample soon.`,
      "info",
      "/user/dashboard"
    ]);

    return NextResponse.json({ success: true, appointment: result.rows[0] });

  } catch (error: any) {
    console.error("Error creating DNA appointment:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();

    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS dna_appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        patient_name TEXT NOT NULL,
        analysis_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    let query = "";
    let params: any[] = [];

    if (user.accountCategory === 'patient') {
      query = `SELECT * FROM dna_appointments WHERE patient_id = $1 ORDER BY created_at DESC`;
      params = [user.id];
    } else if (user.accountCategory === 'caregiver') {
      // Caregiver sees all pending requests to process them
      query = `SELECT * FROM dna_appointments WHERE status = 'pending' ORDER BY created_at DESC`;
    } else {
      return NextResponse.json({ success: true, appointments: [] });
    }

    const result = await db.query(query, params);
    return NextResponse.json({ success: true, appointments: result.rows });

  } catch (error: any) {
    console.error("Error fetching DNA appointments:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
