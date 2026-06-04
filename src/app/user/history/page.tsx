import Link from "next/link";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import styles from "../profile/page.module.css";
import type { Metadata } from "next";

import { ClientHistory } from "./ClientHistory";

export const metadata: Metadata = {
  title: "Upload History — GenoNexus",
  description: "View all your previously uploaded DNA files.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;
  let user = null;
  let uploadedFiles: any[] = [];

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
      }
    } catch {
      // silently continue
    }
  }

  return <ClientHistory uploadedFiles={uploadedFiles} />;
}
