import { NextRequest, NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = assertDatabase();
    
    const res = await db.query(
      `SELECT id, first_name, last_name, email FROM users WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
