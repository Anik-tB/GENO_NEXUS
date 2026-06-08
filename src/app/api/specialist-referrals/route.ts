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

    if (user.accountCategory !== 'caregiver') {
      return NextResponse.json({ error: "Only care coordinators can refer patients" }, { status: 403 });
    }

    const { patientId, fileId, specialistName, specialistType, hospitalName } = await req.json();

    if (!patientId || !specialistName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = assertDatabase();

    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS specialist_referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coordinator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE,
        specialist_name TEXT NOT NULL,
        specialist_type TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Ensure column exists for older dbs
    await db.query(`ALTER TABLE specialist_referrals ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE;`);

    // Create the referral
    const result = await db.query(`
      INSERT INTO specialist_referrals (patient_id, coordinator_id, file_id, specialist_name, specialist_type, hospital_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [patientId, user.id, fileId || null, specialistName, specialistType, hospitalName]);

    return NextResponse.json({ success: true, referral: result.rows[0] });

  } catch (error: any) {
    console.error("Referral creation error:", error);
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

    // Ensure table exists (in case GET is called before POST)
    await db.query(`
      CREATE TABLE IF NOT EXISTS specialist_referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coordinator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE,
        specialist_name TEXT NOT NULL,
        specialist_type TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // Ensure column exists for older dbs
    await db.query(`ALTER TABLE specialist_referrals ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE;`);

    let query = "";
    let params: any[] = [];
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (user.accountCategory === 'patient') {
      if (fileId) {
        query = `SELECT * FROM specialist_referrals WHERE patient_id = $1 AND file_id = $2 ORDER BY created_at DESC`;
        params = [user.id, fileId];
      } else {
        query = `SELECT * FROM specialist_referrals WHERE patient_id = $1 ORDER BY created_at DESC`;
        params = [user.id];
      }
    } else if (user.accountCategory === 'caregiver') {
      const patientId = searchParams.get('patientId');
      if (patientId && fileId) {
        query = `SELECT * FROM specialist_referrals WHERE patient_id = $1 AND coordinator_id = $2 AND file_id = $3 ORDER BY created_at DESC`;
        params = [patientId, user.id, fileId];
      } else if (patientId) {
        query = `SELECT * FROM specialist_referrals WHERE patient_id = $1 AND coordinator_id = $2 ORDER BY created_at DESC`;
        params = [patientId, user.id];
      } else {
        query = `SELECT * FROM specialist_referrals WHERE coordinator_id = $1 ORDER BY created_at DESC`;
        params = [user.id];
      }
    } else {
      return NextResponse.json({ success: true, referrals: [] });
    }

    const referrals = await db.query(query, params);
    return NextResponse.json({ success: true, referrals: referrals.rows });

  } catch (error: any) {
    console.error("Get referrals error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
