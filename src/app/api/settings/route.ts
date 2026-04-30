import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

async function getAuthedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) return null;
  return getUserFromSessionToken(token);
}

function mapSettings(row: Record<string, any>) {
  return {
    emailNotifications: (row.email_notifications as boolean) ?? true,
    securityAlerts:     (row.security_alerts as boolean) ?? true,
    autoAnalysis:       (row.auto_analysis as boolean) ?? true,
    dataSharing:        (row.data_sharing as boolean) ?? false,
    theme:              (row.theme as string) ?? "dark",
  };
}

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = assertDatabase();

    // Upsert: create row with defaults if it doesn't exist yet
    const result = await db.query(
      `INSERT INTO user_settings (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [user.id]
    );

    return NextResponse.json({ settings: mapSettings(result.rows[0]) });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Validate required fields are present
    const {
      emailNotifications,
      securityAlerts,
      autoAnalysis,
      dataSharing,
      theme,
    } = body as {
      emailNotifications?: boolean;
      securityAlerts?: boolean;
      autoAnalysis?: boolean;
      dataSharing?: boolean;
      theme?: string;
    };

    const db = assertDatabase();

    // Use a two-step approach: first ensure row exists, then update only provided fields
    await db.query(
      `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    // Build dynamic SET clause only for provided keys
    const updates: string[] = [];
    const params: (string | boolean | null)[] = [user.id];

    if (emailNotifications !== undefined) { params.push(emailNotifications); updates.push(`email_notifications = $${params.length}`); }
    if (securityAlerts !== undefined)     { params.push(securityAlerts);     updates.push(`security_alerts = $${params.length}`); }
    if (autoAnalysis !== undefined)       { params.push(autoAnalysis);       updates.push(`auto_analysis = $${params.length}`); }
    if (dataSharing !== undefined)        { params.push(dataSharing);        updates.push(`data_sharing = $${params.length}`); }
    if (theme !== undefined)              { params.push(theme);              updates.push(`theme = $${params.length}`); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);

    const result = await db.query(
      `UPDATE user_settings SET ${updates.join(", ")} WHERE user_id = $1 RETURNING *`,
      params
    );

    return NextResponse.json({ settings: mapSettings(result.rows[0]) });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
