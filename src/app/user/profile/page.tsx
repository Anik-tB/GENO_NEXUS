import Link from "next/link";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile — GenoNexus",
  description: "Manage your personal information and privacy settings.",
};

export default async function UserProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;
  let user = null;

  if (sessionToken) {
    try {
      user = await getUserFromSessionToken(sessionToken);
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
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <button className={styles.editBtn} id="profile-edit-info">
            ✏️ Edit
          </button>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>First Name</span>
            <span className={styles.infoValue}>{user?.firstName || "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Last Name</span>
            <span className={styles.infoValue}>{user?.lastName || "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email Address</span>
            <span className={styles.infoValue}>{user?.email || "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Account Type</span>
            <span className={styles.infoValue}>
              {user?.accountCategory === "patient"
                ? "Patient"
                : user?.accountCategory === "caregiver"
                  ? "Caregiver"
                  : "User"}
            </span>
          </div>
          {user?.phone && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Phone</span>
              <span className={styles.infoValue}>{user.phone}</span>
            </div>
          )}
          {user?.organization && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Organization</span>
              <span className={styles.infoValue}>{user.organization}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Upload History ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Upload History</h2>
        <div className={styles.emptyHistory}>
          <span className={styles.emptyIcon}>🧬</span>
          <p className={styles.emptyText}>No DNA files uploaded yet.</p>
          <Link href="/user/upload-dna" className={styles.uploadLink} id="profile-upload-link">
            Upload your first DNA file →
          </Link>
        </div>
      </section>

      {/* ── Privacy Settings ───────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Privacy &amp; Data</h2>
        <div className={styles.privacyList}>
          <div className={styles.privacyRow}>
            <div>
              <p className={styles.privacyName}>Data Encryption</p>
              <p className={styles.privacyDesc}>
                Your DNA data is encrypted at rest and in transit.
              </p>
            </div>
            <span className={styles.privacyBadge}>🔒 Active</span>
          </div>
          <div className={styles.privacyRow}>
            <div>
              <p className={styles.privacyName}>Data Sharing</p>
              <p className={styles.privacyDesc}>
                We do not share your genetic data with third parties without
                your consent.
              </p>
            </div>
            <span className={styles.privacyBadgeOff}>❌ Off</span>
          </div>
          <div className={styles.privacyRow}>
            <div>
              <p className={styles.privacyName}>Research Contribution</p>
              <p className={styles.privacyDesc}>
                Allow your anonymized data to contribute to medical research.
              </p>
            </div>
            <button className={styles.toggleBtn} id="profile-research-toggle">
              Enable
            </button>
          </div>
        </div>
      </section>

      {/* ── Danger Zone ────────────────────────────────────────────── */}
      <section className={styles.dangerSection}>
        <h2 className={styles.sectionTitle} style={{ color: "var(--gn-danger)" }}>
          Danger Zone
        </h2>
        <div className={styles.dangerCard}>
          <div>
            <p className={styles.dangerTitle}>Delete All My Data</p>
            <p className={styles.dangerDesc}>
              Permanently delete all your uploaded DNA files, analysis results,
              and account data. This action cannot be undone.
            </p>
          </div>
          <button className={styles.deleteBtn} id="profile-delete-data">
            🗑️ Delete My Data
          </button>
        </div>
      </section>
    </div>
  );
}
