import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;

  if (!sessionToken) redirect("/login");

  const user = await getUserFromSessionToken(sessionToken);
  if (!user) redirect("/login");

  // Fetch enriched profile with stats
  const db = assertDatabase();
  const result = await db.query(
    `SELECT id, first_name, last_name, email, account_category,
            bio, job_title, avatar_url, phone, organization,
            github_id, google_id, firebase_uid,
            email_verified, created_at, last_login_at,
            (SELECT COUNT(*) FROM dna_files WHERE user_id = $1) AS dna_files_count,
            (SELECT COUNT(*) FROM comparison_results cr
             JOIN dna_files df ON df.id = cr.query_file_id
             WHERE df.user_id = $1) AS analyses_count
     FROM users WHERE id = $1`,
    [user.id]
  );

  const row = result.rows[0];

  const profile = {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    accountCategory: row.account_category ?? "other",
    bio: row.bio ?? "",
    jobTitle: row.job_title ?? "",
    avatarUrl: row.avatar_url ?? null,
    phone: row.phone ?? "",
    organization: row.organization ?? "",
    githubId: row.github_id ?? null,
    googleId: row.google_id ?? null,
    firebaseUid: row.firebase_uid ?? null,
    emailVerified: row.email_verified ?? null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    dnaFilesCount: parseInt(row.dna_files_count, 10) || 0,
    analysesCount: parseInt(row.analyses_count, 10) || 0,
  };

  return <ProfileClient profile={profile} />;
}
