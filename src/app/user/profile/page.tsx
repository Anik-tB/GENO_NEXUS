import Link from "next/link";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { PrivacySettings } from "./PrivacySettings";
import { DangerZone } from "./DangerZone";
import styles from "./page.module.css";
import type { Metadata } from "next";

import { ClientProfile } from "./ClientProfile";

export const metadata: Metadata = {
  title: "My Profile — GenoNexus",
  description: "Manage your personal information and privacy settings.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;
  let user = null;
  let uploadedFiles: any[] = [];
  let researchOptIn = false;

  if (sessionToken) {
    try {
      user = await getUserFromSessionToken(sessionToken);
      if (user) {
        const db = assertDatabase();
        const res = await db.query(
          "SELECT id, file_name, file_size, status, created_at FROM dna_files WHERE user_id = $1 ORDER BY created_at DESC",
          [user.id]
        );
        uploadedFiles = res.rows;
        
        // Also fetch the user's research opt in status
        const userRes = await db.query("SELECT research_opt_in FROM users WHERE id = $1", [user.id]);
        if (userRes.rows.length > 0) {
          researchOptIn = userRes.rows[0].research_opt_in;
        }
      }
    } catch {
      // silently continue
    }
  }

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : "User";
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";
  
  // Format memberSinceDate using user's language or pass standard date format
  const memberSinceDate = user?.createdAt
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(user.createdAt)
    : "Unknown";

  return (
    <ClientProfile
      user={user}
      uploadedFiles={uploadedFiles}
      researchOptIn={researchOptIn}
      initials={initials}
      fullName={fullName}
      memberSinceDate={memberSinceDate}
    />
  );
}
