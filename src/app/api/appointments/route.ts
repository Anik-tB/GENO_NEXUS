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
      return NextResponse.json({ error: "Only patients can book appointments" }, { status: 403 });
    }

    const { doctorName, specialistType, hospitalName, date, time } = await req.json();
    if (!doctorName || !specialistType || !hospitalName || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = assertDatabase();

    // Ensure the table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_name TEXT NOT NULL,
        specialist_type TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Insert appointment
    const result = await db.query(`
      INSERT INTO appointments (patient_id, doctor_name, specialist_type, hospital_name, appointment_date, appointment_time)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [user.id, doctorName, specialistType, hospitalName, date, time]);

    return NextResponse.json({ success: true, appointment: result.rows[0] });

  } catch (error: any) {
    console.error("Error booking appointment:", error);
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
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_name TEXT NOT NULL,
        specialist_type TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Fetch user's appointments
    const result = await db.query(`
      SELECT * FROM appointments
      WHERE patient_id = $1
      ORDER BY appointment_date ASC, appointment_time ASC
    `, [user.id]);

    return NextResponse.json({ success: true, appointments: result.rows });

  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
