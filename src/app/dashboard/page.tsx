import Link from "next/link";
import styles from "./page.module.css";

const SUMMARY_CARDS = [
  { label: "Total Genes Analyzed", value: "18,482", note: "+4.2% this week", color: "var(--gn-primary)" },
  { label: "Mutation Count", value: "276", note: "19 urgent markers", color: "var(--gn-danger)" },
  { label: "Risk Level", value: "Moderate", note: "2 cohorts escalated", color: "var(--gn-warning)" },
  { label: "AI Confidence Score", value: "94.7%", note: "Model drift stable", color: "var(--gn-success)" }
];

const RECENT_ACTIVITY = [
  { action: "Sequence Upload", file: "patient_20481.vcf", time: "10 mins ago", status: "Complete" },
  { action: "Mutation Analysis", file: "oncology_panel.fastq", time: "2 hours ago", status: "In Progress" },
  { action: "Report Generated", file: "BRCA1_summary.pdf", time: "1 day ago", status: "Complete" }
];

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Genomics Command Center</h1>
          <p className={styles.subtitle}>Welcome back. AI is currently monitoring 14 active patient sequences.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard/upload" className={styles.primaryButton}>
            + New Upload
          </Link>
          <button className={styles.secondaryButton}>Generate Report</button>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Quick Insights Panel */}
        <section className={`${styles.card} ${styles.insightsCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>AI Quick Insights</h2>
            <span className={styles.pulseIcon}>🤖</span>
          </div>
          <p className={styles.insightText}>
            <strong>Moderate genetic risk detected</strong> based on mutation patterns in the recent <code>CYP2C19</code> cohort.
            We recommend immediate pharmacogenomic review before prescribing antiplatelet therapy.
          </p>
          <Link href="/dashboard/predictions" className={styles.insightLink}>View detailed prediction &rarr;</Link>
        </section>

        {/* Summary Cards */}
        <div className={styles.summaryWrapper}>
          {SUMMARY_CARDS.map((card, i) => (
            <article key={i} className={styles.summaryCard} style={{ borderTopColor: card.color }}>
              <span className={styles.summaryLabel}>{card.label}</span>
              <strong className={styles.summaryValue}>{card.value}</strong>
              <span className={styles.summaryNote}>{card.note}</span>
            </article>
          ))}
        </div>

        {/* Mini Graph (Health Trend) */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Cohort Health Trend</h2>
            <select className={styles.dropdown}>
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className={styles.graphPlaceholder}>
            {/* SVG graph mockup */}
            <svg viewBox="0 0 400 150" className={styles.svgGraph}>
              <path d="M0,120 C50,120 80,40 150,60 C220,80 280,10 400,30" fill="none" stroke="var(--gn-success)" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="150" cy="60" r="5" fill="var(--gn-success)"/>
              <circle cx="400" cy="30" r="5" fill="var(--gn-success)"/>
              <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gn-success)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--gn-success)" stopOpacity="0" />
              </linearGradient>
              <path d="M0,120 C50,120 80,40 150,60 C220,80 280,10 400,30 L400,150 L0,150 Z" fill="url(#glow)" />
            </svg>
            <div className={styles.graphLabels}>
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <Link href="/dashboard/collaboration" className={styles.viewAll}>View all</Link>
          </div>
          <ul className={styles.activityList}>
            {RECENT_ACTIVITY.map((activity, i) => (
              <li key={i} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.action.includes('Upload') ? '🧬' : activity.action.includes('Analysis') ? '🔍' : '📄'}
                </div>
                <div className={styles.activityInfo}>
                  <strong>{activity.action}</strong>
                  <span>{activity.file}</span>
                </div>
                <div className={styles.activityMeta}>
                  <span className={styles.time}>{activity.time}</span>
                  <span className={`${styles.statusPill} ${activity.status === 'Complete' ? styles.statusOk : styles.statusWait}`}>
                    {activity.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
