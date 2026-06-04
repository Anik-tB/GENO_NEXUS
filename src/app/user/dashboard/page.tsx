import Link from "next/link";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import styles from "./page.module.css";
import type { Metadata } from "next";

import { ClientDashboard } from "./ClientDashboard";

export const metadata: Metadata = {
  title: "My Dashboard — GenoNexus",
  description:
    "Your personal genetic health dashboard. View your DNA analysis results and health risk assessments.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;
  let firstName = "there";
  let filesCount = 0;
  let analysesCount = 0;
  let markersChecked: number | string = "—";

  if (sessionToken) {
    try {
      const user = await getUserFromSessionToken(sessionToken);
      if (user) {
        firstName = user.firstName || "there";
        const db = assertDatabase();
        const res = await db.query(
          `SELECT
            (SELECT COUNT(*) FROM dna_files WHERE user_id = $1) AS files_count,
            (SELECT COUNT(*) FROM comparison_results cr
             JOIN dna_files df ON df.id = cr.query_file_id
             WHERE df.user_id = $1) AS analyses_count
          `,
          [user.id]
        );
        
        if (res.rows.length > 0) {
          filesCount = parseInt(res.rows[0].files_count, 10) || 0;
          analysesCount = parseInt(res.rows[0].analyses_count, 10) || 0;
          
          if (analysesCount > 0) {
            markersChecked = (analysesCount * 2450).toLocaleString();
          }
        }
      }
    } catch {
      // silently continue
    }
  }

  return (
    <ClientDashboard
      firstName={firstName}
      filesCount={filesCount}
      analysesCount={analysesCount}
      markersChecked={markersChecked.toString()}
    />
  );
}
