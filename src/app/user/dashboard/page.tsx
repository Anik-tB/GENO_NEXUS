import Link from "next/link";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard — GenoNexus",
  description:
    "Your personal genetic health dashboard. View your DNA analysis results and health risk assessments.",
};

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;
  let firstName = "there";

  if (sessionToken) {
    try {
      const user = await getUserFromSessionToken(sessionToken);
      if (user) firstName = user.firstName || "there";
    } catch {
      // silently continue
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Welcome Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroGreeting}>Welcome back 👋</p>
          <h1 className={styles.heroTitle}>Hello, {firstName}!</h1>
          <p className={styles.heroSub}>
            Your personal genetic health dashboard. Upload your DNA file and
            discover what your genes say about your health — explained in simple
            language, no medical degree required.
          </p>
        </div>
        <Link href="/user/upload-dna" className={styles.heroCta} id="hero-upload-cta">
          🧬 Upload DNA File
        </Link>
      </section>

      {/* ── Quick Stats ───────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🧬</span>
          <span className={styles.statLabel}>DNA Files Uploaded</span>
          <span className={styles.statValue}>0</span>
          <span className={styles.statSub}>Upload your first file to get started</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <span className={styles.statLabel}>Analyses Completed</span>
          <span className={styles.statValue}>0</span>
          <span className={styles.statSub}>Results will appear here</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <span className={styles.statLabel}>Health Markers Checked</span>
          <span className={styles.statValue}>—</span>
          <span className={styles.statSub}>Awaiting first analysis</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔒</span>
          <span className={styles.statLabel}>Privacy Status</span>
          <span className={styles.statValue} style={{ fontSize: "1rem" }}>Protected</span>
          <span className={styles.statSub}>Your data is encrypted</span>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <section>
        <h2 className={styles.sectionTitle}>What would you like to do?</h2>
        <div className={styles.actionsGrid}>
          <Link href="/user/upload-dna" className={styles.actionCard} id="action-upload">
            <span className={styles.actionEmoji}>📤</span>
            <p className={styles.actionTitle}>Upload My DNA</p>
            <p className={styles.actionDesc}>
              Upload your DNA file from services like 23andMe, AncestryDNA, or
              raw FASTA/VCF files.
            </p>
            <span className={styles.actionArrow}>→</span>
          </Link>

          <Link href="/user/results" className={styles.actionCard} id="action-results">
            <span className={styles.actionEmoji}>📋</span>
            <p className={styles.actionTitle}>View My Results</p>
            <p className={styles.actionDesc}>
              See your health risk assessments, genetic markers, and ancestry
              information in plain language.
            </p>
            <span className={styles.actionArrow}>→</span>
          </Link>

          <Link href="/user/profile" className={styles.actionCard} id="action-profile">
            <span className={styles.actionEmoji}>👤</span>
            <p className={styles.actionTitle}>My Profile</p>
            <p className={styles.actionDesc}>
              Update your personal information, manage privacy settings, and
              view your upload history.
            </p>
            <span className={styles.actionArrow}>→</span>
          </Link>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className={styles.howCard}>
        <h2 className={styles.sectionTitle}>How GenoNexus Works</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <p className={styles.stepTitle}>Upload Your DNA File</p>
            <p className={styles.stepDesc}>
              Upload a file from 23andMe, AncestryDNA, or any standard FASTA /
              VCF format.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <p className={styles.stepTitle}>We Analyze Your Genes</p>
            <p className={styles.stepDesc}>
              Our AI checks your genetic variants against thousands of known
              health markers.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <p className={styles.stepTitle}>Get Clear Results</p>
            <p className={styles.stepDesc}>
              Results are shown in plain language — no medical jargon. We tell
              you exactly what it means.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>4</div>
            <p className={styles.stepTitle}>Talk to a Doctor</p>
            <p className={styles.stepDesc}>
              If anything needs attention, we&apos;ll recommend speaking with a
              healthcare professional.
            </p>
          </div>
        </div>
      </section>

      {/* ── Privacy Notice ────────────────────────────────────────────── */}
      <div className={styles.privacyBanner} role="note">
        <span className={styles.privacyIcon}>🔐</span>
        <p className={styles.privacyText}>
          <strong>Your privacy is our priority.</strong> Your DNA data is
          encrypted at rest and in transit. We never sell your data or share it
          with third parties without your explicit consent. You can delete your
          data at any time from your profile settings.
        </p>
      </div>
    </div>
  );
}
