import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure only caregivers can fetch the list of patients
    if (user.accountCategory !== 'caregiver') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = assertDatabase();
    
    const result = await db.query(`
      SELECT id, first_name, last_name, email 
      FROM users 
      WHERE account_category = 'patient'
      ORDER BY first_name ASC
    `);

    return NextResponse.json({
      success: true,
      patients: result.rows
    });

  } catch (error: any) {
    console.error("Fetch patients error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
