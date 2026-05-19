import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { assertDatabase } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { region, pathogen } = body;
    if (!region || !pathogen) {
      return NextResponse.json({ error: "Region and pathogen are required" }, { status: 400 });
    }

    const db = assertDatabase();

    // Insert a high-priority notification for the current user
    // In a real system, you might notify all users in the organization
    const notificationTitle = `🚨 Response Protocol Deployed: ${pathogen}`;
    const notificationMessage = `Emergency response protocol initiated for ${pathogen} outbreak in ${region}. All teams must adhere to level 4 biosecurity guidelines immediately.`;

    await db.query(
      `INSERT INTO user_notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        notificationTitle,
        notificationMessage,
        "error", // high priority red alert
        "/dashboard/outbreak"
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Response Protocol Deployed successfully",
    });

  } catch (error) {
    console.error("POST /api/outbreak/protocol error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
