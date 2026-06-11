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
      return NextResponse.json({ error: "Only patients can book clinical tests" }, { status: 403 });
    }

    const { testName, price, fileId } = await req.json();
    if (!testName || !price) {
      return NextResponse.json({ error: "Missing test name or price" }, { status: 400 });
    }

    const db = assertDatabase();

    // Ensure the table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS test_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE,
        test_name TEXT NOT NULL,
        price TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'booked',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // Ensure column exists for older dbs
    await db.query(`ALTER TABLE test_bookings ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE;`);

    // Insert the booking
    const result = await db.query(`
      INSERT INTO test_bookings (patient_id, file_id, test_name, price, status)
      VALUES ($1, $2, $3, $4, 'booked')
      RETURNING *
    `, [user.id, fileId || null, testName, price]);

    // Notify Care Coordinators
    await db.query(`
      INSERT INTO user_notifications (user_id, title, message, type, link)
      SELECT id, $1, $2, 'info', $3
      FROM users
      WHERE account_category = 'caregiver'
    `, [
      "New Test Booking",
      `Patient ${user.firstName} ${user.lastName} has booked a ${testName}.`,
      "/user/dashboard"
    ]);

    return NextResponse.json({ success: true, booking: result.rows[0] });

  } catch (error: any) {
    console.error("Error booking test:", error);
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
      CREATE TABLE IF NOT EXISTS test_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE,
        test_name TEXT NOT NULL,
        price TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'booked',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Ensure column exists for older dbs
    await db.query(`ALTER TABLE test_bookings ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES dna_files(id) ON DELETE CASCADE;`);

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    let query = "";
    let params: any[] = [];

    // Fetch user's bookings
    if (fileId) {
      query = `SELECT * FROM test_bookings WHERE patient_id = $1 AND file_id = $2 ORDER BY created_at DESC`;
      params = [user.id, fileId];
    } else {
      query = `SELECT * FROM test_bookings WHERE patient_id = $1 ORDER BY created_at DESC`;
      params = [user.id];
    }

    const result = await db.query(query, params);

    return NextResponse.json({ success: true, bookings: result.rows });

  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
