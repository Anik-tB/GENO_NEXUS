import Link from "next/link";
import styles from "./page.module.css";

const SUMMARY_CARDS = [
  { label: "Total Genes Analyzed", value: "18,482", note: "+4.2% this week", risk: "low" },
  { label: "Mutation Count", value: "276", note: "19 urgent markers", risk: "high" },
  { label: "Risk Level", value: "Moderate", note: "2 cohorts escalated", risk: "moderate" },
  { label: "AI Confidence Score", value: "94.7%", note: "Model drift stable", risk: "low" }
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
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Genomics Command Center</h1>
          <p className={styles.subtitle}>Welcome back. AI is currently monitoring 14 active patient sequences.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard/upload" className={styles.primaryButton}>
            <span className={styles.btnIcon}>＋</span> New Upload
          </Link>
          <button className={styles.secondaryButton}>Generate Report</button>
        </div>
      </header>

      {/* AI Quick Insights Banner (Moved to top, full width) */}
      <section className={styles.insightsBanner}>
        <div className={styles.insightsContent}>
          <div className={styles.insightsIcon}>🤖</div>
          <p className={styles.insightText}>
            <strong>AI Insight: Moderate genetic risk detected</strong> based on mutation patterns in the recent <code>CYP2C19</code> cohort. Immediate pharmacogenomic review recommended.
          </p>
        </div>
        <Link href="/dashboard/predictions" className={styles.insightAction}>
          View Prediction <span className={styles.arrow}>&rarr;</span>
        </Link>
      </section>

      {/* Summary Cards (Now correctly 4 cols) */}
      <div className={styles.summaryGrid}>
        {SUMMARY_CARDS.map((card, i) => (
          <article key={i} className={`${styles.summaryCard} ${styles[card.risk]}`}>
            <h3 className={styles.summaryLabel}>{card.label}</h3>
            <div className={styles.summaryValue}>{card.value}</div>
            <p className={styles.summaryNote}>{card.note}</p>
          </article>
        ))}
      </div>

      {/* Bottom Grid: Chart & Activity */}
      <div className={styles.contentGrid}>
        
        {/* Cohort Health Trend */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Cohort Health Trend</h2>
            <select className={styles.dropdown}>
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className={styles.graphContainer}>
            <svg viewBox="0 0 400 150" className={styles.svgGraph} preserveAspectRatio="none">
              <path d="M0,120 C50,120 80,40 150,60 C220,80 280,10 400,30" fill="none" stroke="var(--gn-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="150" cy="60" r="4" fill="var(--gn-bg)" stroke="var(--gn-success)" strokeWidth="2"/>
              <circle cx="400" cy="30" r="4" fill="var(--gn-bg)" stroke="var(--gn-success)" strokeWidth="2"/>
              <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gn-success)" stopOpacity="0.15" />
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
            <Link href="/dashboard/collaboration" className={styles.viewAll}>View History</Link>
          </div>
          <ul className={styles.activityList}>
            {RECENT_ACTIVITY.map((activity, i) => (
              <li key={i} className={styles.activityItem}>
                <div className={styles.activityIconWrapper}>
                  {activity.action.includes('Upload') ? '🧬' : activity.action.includes('Analysis') ? '🔍' : '📄'}
                </div>
                <div className={styles.activityDetails}>
                  <p className={styles.activityAction}>{activity.action}</p>
                  <p className={styles.activityFile}>{activity.file}</p>
                </div>
                <div className={styles.activityStatusGroup}>
                  <span className={styles.activityTime}>{activity.time}</span>
                  <span className={`${styles.statusBadge} ${activity.status === 'Complete' ? styles.statusComplete : styles.statusProgress}`}>
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
