import Link from "next/link";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My DNA Results — GenoNexus",
  description:
    "View your personal genetic health risk assessment results in plain, easy-to-understand language.",
};

// Simulated result data structure (will be replaced by real API data)
const MOCK_RESULTS = {
  lastAnalyzed: "May 22, 2026",
  overallStatus: "low" as "low" | "moderate" | "high",
  summary: "Your DNA analysis is complete. No high-risk markers were detected. There are a few moderate findings worth discussing with your doctor.",
  risks: [
    {
      id: "heart",
      name: "Heart Disease Risk",
      level: "low" as const,
      percentage: 12,
      description: "Your genetic markers suggest a below-average risk for common heart conditions. Maintaining a healthy diet and exercise routine is still recommended.",
      action: "No immediate action needed. Continue regular check-ups.",
    },
    {
      id: "diabetes",
      name: "Type 2 Diabetes",
      level: "moderate" as const,
      percentage: 34,
      description: "Some genetic variants associated with insulin resistance were found. This does not mean you will develop diabetes — lifestyle plays a bigger role.",
      action: "Consider discussing blood sugar monitoring with your doctor.",
    },
    {
      id: "cancer",
      name: "Common Cancer Markers",
      level: "low" as const,
      percentage: 8,
      description: "No high-risk BRCA1, BRCA2, or other common cancer-related variants were detected in your sample.",
      action: "Continue regular screenings as recommended for your age.",
    },
    {
      id: "alzheimer",
      name: "Alzheimer's Risk Factors",
      level: "low" as const,
      percentage: 15,
      description: "APOE ε4 variant not detected. Your genetic profile suggests typical risk for Alzheimer's disease.",
      action: "Stay mentally and physically active. Regular check-ups recommended.",
    },
  ],
  ancestry: {
    regions: [
      { name: "South Asian", percentage: 68 },
      { name: "Middle Eastern", percentage: 18 },
      { name: "East Asian", percentage: 9 },
      { name: "Other", percentage: 5 },
    ],
  },
};

const RISK_CONFIG = {
  low: { label: "Low Risk", emoji: "✅", color: "#10b981" },
  moderate: { label: "Moderate", emoji: "⚠️", color: "#eab308" },
  high: { label: "High Risk", emoji: "🔴", color: "#f43f5e" },
};

const OVERALL_CONFIG = {
  low: {
    label: "All Clear — No High-Risk Markers Found",
    emoji: "✅",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.25)",
  },
  moderate: {
    label: "Moderate Risk — Some Markers Worth Discussing",
    emoji: "⚠️",
    bg: "rgba(234, 179, 8, 0.08)",
    border: "rgba(234, 179, 8, 0.25)",
  },
  high: {
    label: "High Risk — Please Consult a Doctor",
    emoji: "🔴",
    bg: "rgba(244, 63, 94, 0.08)",
    border: "rgba(244, 63, 94, 0.25)",
  },
};

const hasNoResults = false; // Set to true when no data available

export default function ResultsPage() {
  const overall = OVERALL_CONFIG[MOCK_RESULTS.overallStatus];

  if (hasNoResults) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/user/dashboard" className={styles.back} id="results-back">
            ← Back to Dashboard
          </Link>
          <h1 className={styles.title}>My DNA Results</h1>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🧬</span>
          <h2 className={styles.emptyTitle}>No Results Yet</h2>
          <p className={styles.emptyDesc}>
            You haven&apos;t uploaded a DNA file yet, or your analysis is still
            in progress. Upload your DNA file to see your personalized health
            insights here.
          </p>
          <Link href="/user/upload-dna" className={styles.btnPrimary} id="results-upload-cta">
            📤 Upload DNA File
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/user/dashboard" className={styles.back} id="results-back">
          ← Back to Dashboard
        </Link>
        <h1 className={styles.title}>My DNA Results</h1>
        <p className={styles.subtitle}>
          Last analyzed: {MOCK_RESULTS.lastAnalyzed}
          <span className={styles.separator}>•</span>
          Results are for informational purposes only — not a medical diagnosis.
        </p>
      </div>

      {/* ── Overall Summary ────────────────────────────────────────── */}
      <div
        className={styles.overallCard}
        style={{
          background: overall.bg,
          borderColor: overall.border,
        }}
      >
        <span className={styles.overallEmoji}>{overall.emoji}</span>
        <div>
          <p className={styles.overallLabel}>{overall.label}</p>
          <p className={styles.overallSummary}>{MOCK_RESULTS.summary}</p>
        </div>
      </div>

      {/* ── Health Risk Cards ──────────────────────────────────────── */}
      <section>
        <h2 className={styles.sectionTitle}>Your Health Risk Assessment</h2>
        <p className={styles.sectionHint}>
          Each percentage shows your genetic likelihood compared to the general
          population. Lower is better.
        </p>
        <div className={styles.riskGrid}>
          {MOCK_RESULTS.risks.map((risk) => {
            const cfg = RISK_CONFIG[risk.level];
            return (
              <div key={risk.id} className={`${styles.riskCard} ${styles[`riskCard_${risk.level}`]}`}>
                <div className={styles.riskHeader}>
                  <span className={styles.riskEmoji}>{cfg.emoji}</span>
                  <div>
                    <p className={styles.riskName}>{risk.name}</p>
                    <span
                      className={styles.riskBadge}
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className={styles.riskPercent} style={{ color: cfg.color }}>
                    {risk.percentage}%
                  </div>
                </div>

                <div className={styles.riskBar}>
                  <div
                    className={styles.riskBarFill}
                    style={{
                      width: `${risk.percentage}%`,
                      background: cfg.color,
                    }}
                  />
                </div>

                <p className={styles.riskDesc}>{risk.description}</p>

                <div className={styles.riskAction}>
                  <span className={styles.riskActionLabel}>Recommended:</span>
                  {risk.action}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Ancestry Breakdown ─────────────────────────────────────── */}
      <section className={styles.ancestryCard}>
        <h2 className={styles.sectionTitle}>Your Ancestry Breakdown</h2>
        <div className={styles.ancestryBars}>
          {MOCK_RESULTS.ancestry.regions.map((region) => (
            <div key={region.name} className={styles.ancestryRow}>
              <div className={styles.ancestryMeta}>
                <span className={styles.ancestryName}>{region.name}</span>
                <span className={styles.ancestryPct}>{region.percentage}%</span>
              </div>
              <div className={styles.ancestryTrack}>
                <div
                  className={styles.ancestryFill}
                  style={{ width: `${region.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download Report ────────────────────────────────────────── */}
      <div className={styles.reportActions}>
        <button className={styles.btnDownload} id="results-download-pdf">
          📄 Download PDF Report
        </button>
        <Link href="/user/upload-dna" className={styles.btnSecondary} id="results-upload-new">
          🧬 Upload New DNA File
        </Link>
      </div>

      {/* ── Medical Disclaimer ─────────────────────────────────────── */}
      <div className={styles.disclaimer}>
        <span>⚕️</span>
        <p>
          <strong>Important:</strong> These results are based on genetic markers
          only and are not a medical diagnosis. Many health conditions are
          influenced by lifestyle, environment, and other factors not captured
          in DNA alone. Always consult a qualified healthcare professional before
          making any health decisions.
        </p>
      </div>
    </div>
  );
}
