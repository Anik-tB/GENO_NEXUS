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
  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(user.createdAt)
    : "Unknown";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/user/dashboard" className={styles.back} id="profile-back">
          ← Back to Dashboard
        </Link>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>
          Manage your personal information and privacy settings.
        </p>
      </div>

      {/* ── Identity Card ──────────────────────────────────────────── */}
      <div className={styles.identityCard}>
        <div className={styles.avatarLarge}>{initials}</div>
        <div>
          <p className={styles.identityName}>{fullName}</p>
          <p className={styles.identityEmail}>{user?.email || "—"}</p>
          <p className={styles.identityMeta}>Member since {memberSince}</p>
        </div>
      </div>

      {/* ── Personal Information ───────────────────────────────────── */}
      {user && (
        <ProfileInfoForm user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountCategory: user.accountCategory,
          phone: user.phone,
          organization: user.organization
        }} />
      )}

      {/* ── Upload History ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Upload History</h2>
        {uploadedFiles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {uploadedFiles.map(file => (
              <div key={file.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", border: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>🧬</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", color: "var(--gn-white)" }}>{file.file_name}</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--gn-text-muted)" }}>
                      {(file.file_size / (1024 * 1024)).toFixed(2)} MB • Uploaded on {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "600", background: file.status === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(234, 179, 8, 0.1)", color: file.status === "success" ? "#10b981" : "#eab308" }}>
                    {file.status === "success" ? "Analyzed" : "Processing"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyHistory}>
            <span className={styles.emptyIcon}>🧬</span>
            <p className={styles.emptyText}>No DNA files uploaded yet.</p>
            <Link href="/user/upload-dna" className={styles.uploadLink} id="profile-upload-link">
              Upload your first DNA file →
            </Link>
          </div>
        )}
      </section>

      {/* ── Privacy Settings ───────────────────────────────────────── */}
      <PrivacySettings initialResearchOptIn={researchOptIn} />

      {/* ── Danger Zone ────────────────────────────────────────────── */}
      <DangerZone />
    </div>
  );
}
