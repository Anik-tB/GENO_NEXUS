import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { SettingsClient, Settings } from "./SettingsClient";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) return redirect("/login");

  const user = await getUserFromSessionToken(token);
  if (!user) return redirect("/login");

  const db = assertDatabase();

  // Upsert to ensure row exists, return it
  const result = await db.query(
    `INSERT INTO user_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [user.id]
  );
  const row = result.rows[0];

  const initialSettings: Settings = {
    emailNotifications: (row.email_notifications as boolean) ?? true,
    securityAlerts:     (row.security_alerts as boolean) ?? true,
    autoAnalysis:       (row.auto_analysis as boolean) ?? true,
    dataSharing:        (row.data_sharing as boolean) ?? false,
    theme:              (row.theme as string) ?? "dark",
  };

  const userName = `${user.firstName} ${user.lastName}`.trim();

  return <SettingsClient initialSettings={initialSettings} userName={userName} userEmail={user.email} />;
}
