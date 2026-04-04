"use client";

import Link from "next/link";
import styles from "./page.module.css";

// ─── Data ──────────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  {
    label: "Genes Analyzed",
    value: "18,482",
    delta: "+4.2%",
    deltaDir: "up",
    note: "this week",
    risk: "low",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3m0 4v1m0 4v1m0 4v3M16 3v3m0 4v1m0 4v1m0 4v3M3 8h3m4 0h2m4 0h3M3 16h3m4 0h2m4 0h3"/>
      </svg>
    ),
    sparkline: [30, 55, 40, 70, 60, 85, 90],
  },
  {
    label: "Mutation Count",
    value: "276",
    delta: "+12",
    deltaDir: "up",
    note: "19 urgent markers",
    risk: "high",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    sparkline: [20, 38, 30, 65, 50, 78, 72],
  },
  {
    label: "Risk Level",
    value: "Moderate",
    delta: "Stable",
    deltaDir: "neutral",
    note: "2 cohorts escalated",
    risk: "moderate",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    sparkline: [60, 55, 70, 58, 65, 60, 64],
  },
  {
    label: "AI Confidence",
    value: "94.7%",
    delta: "+0.3%",
    deltaDir: "up",
    note: "Model drift stable",
    risk: "low",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    sparkline: [80, 78, 85, 88, 84, 92, 95],
  },
];

const RECENT_ACTIVITY = [
  { action: "Sequence Upload", file: "patient_20481.vcf", time: "10 mins ago", status: "Complete", type: "upload" },
  { action: "Mutation Analysis", file: "oncology_panel.fastq", time: "2 hours ago", status: "In Progress", type: "analysis" },
  { action: "Report Generated", file: "BRCA1_summary.pdf", time: "1 day ago", status: "Complete", type: "report" },
  { action: "Drug Interaction Scan", file: "CYP2C19_cohort.vcf", time: "2 days ago", status: "Complete", type: "drug" },
];

const QUICK_LINKS = [
  { label: "Upload Data", href: "/dashboard/upload", icon: "⬆️", desc: "Import VCF, FASTQ, BAM" },
  { label: "Run Analysis", href: "/dashboard/analysis", icon: "🔬", desc: "Genomic variant analysis" },
  { label: "Predictions", href: "/dashboard/predictions", icon: "🤖", desc: "AI risk models" },
  { label: "Visualization", href: "/dashboard/visualization", icon: "📊", desc: "Interactive genome viewer" },
  { label: "Outbreak Map", href: "/dashboard/outbreak", icon: "🗺️", desc: "Epidemiological mapping" },
  { label: "Reports", href: "/dashboard/reports", icon: "📄", desc: "Clinical report centre" },
];

const SYSTEM_STATUS = [
  { label: "AI Engine", status: "Operational", ok: true },
  { label: "Genomics DB", status: "Operational", ok: true },
  { label: "Seq. Pipeline", status: "Degraded", ok: false },
  { label: "API Gateway", status: "Operational", ok: true },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const fillPts = `0,${h} ${polyline} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={styles.sparkline}>
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ACTIVITY_ICONS: Record<string, string> = {
  upload: "🧬",
  analysis: "🔍",
  report: "📄",
  drug: "💊",
};

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const now = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>
            <span className={styles.liveIndicator} />
            Live · 14 sequences active
          </div>
          <h1 className={styles.title}>Genomics Command Center</h1>
          <p className={styles.subtitle}>{now}</p>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard/upload" className={styles.primaryButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Upload
          </Link>
          <button className={styles.secondaryButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            Generate Report
          </button>
        </div>
      </header>

      {/* ── AI Insights Banner ── */}
      <section className={styles.insightsBanner}>
        <div className={styles.insightsContent}>
          <div className={styles.insightsIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-13a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1zm0 8a1 1 0 1 0 1 1 1 1 0 0 0-1-1z"/>
            </svg>
          </div>
          <div>
            <p className={styles.insightTitle}>AI Insight · Moderate Genetic Risk Detected</p>
            <p className={styles.insightText}>
              Mutation patterns in the recent <code>CYP2C19</code> cohort indicate pharmacogenomic risk. Immediate review recommended before prescribing clopidogrel derivatives.
            </p>
          </div>
        </div>
        <Link href="/dashboard/predictions" className={styles.insightAction}>
          View Predictions <span className={styles.arrow}>→</span>
        </Link>
      </section>

      {/* ── KPI Cards ── */}
      <div className={styles.summaryGrid}>
        {KPI_CARDS.map((card, i) => {
          const sparkColor =
            card.risk === "high" ? "#f43f5e" :
            card.risk === "moderate" ? "#eab308" : "#10b981";
          return (
            <article key={i} className={`${styles.summaryCard} ${styles[card.risk]}`}>
              <div className={styles.cardTopRow}>
                <div className={`${styles.kpiIcon} ${styles[`kpiIcon_${card.risk}`]}`}>
                  {card.icon}
                </div>
                <span className={`${styles.deltaBadge} ${styles[`delta_${card.deltaDir}`]}`}>
                  {card.deltaDir === "up" ? "▲" : card.deltaDir === "down" ? "▼" : "●"} {card.delta}
                </span>
              </div>
              <div className={styles.kpiBody}>
                <p className={styles.summaryLabel}>{card.label}</p>
                <div className={styles.summaryValue}>{card.value}</div>
                <p className={styles.summaryNote}>{card.note}</p>
              </div>
              <div className={styles.sparklineWrapper}>
                <Sparkline data={card.sparkline} color={sparkColor} />
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Quick Access ── */}
      <section className={styles.quickSection}>
        <h2 className={styles.sectionTitle}>Quick Access</h2>
        <div className={styles.quickGrid}>
          {QUICK_LINKS.map((q) => (
            <Link key={q.href} href={q.href} className={styles.quickCard}>
              <span className={styles.quickIcon}>{q.icon}</span>
              <span className={styles.quickLabel}>{q.label}</span>
              <span className={styles.quickDesc}>{q.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Bottom Grid: Chart + Activity ── */}
      <div className={styles.contentGrid}>

        {/* Cohort Health Trend */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Cohort Health Trend</h2>
              <p className={styles.cardSubtitle}>Mutation risk score over time</p>
            </div>
            <select className={styles.dropdown}>
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className={styles.graphContainer}>
            <div className={styles.yLabels}>
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            <div className={styles.graphInner}>
              <svg viewBox="0 0 400 160" className={styles.svgGraph} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 40, 80, 120, 160].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                <path d="M0,130 C40,130 70,90 120,70 C170,50 200,30 260,40 C320,50 360,20 400,10"
                  fill="url(#chartGlow)" stroke="none" />
                <path d="M0,130 C40,130 70,90 120,70 C170,50 200,30 260,40 C320,50 360,20 400,10"
                  fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Data points */}
                {[[0,130],[120,70],[260,40],[400,10]].map(([cx,cy],k) => (
                  <circle key={k} cx={cx} cy={cy} r="4" fill="#09090b" stroke="#10b981" strokeWidth="2" />
                ))}
              </svg>
            </div>
          </div>
          <div className={styles.graphLabels}>
            <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
          </div>
        </section>

        {/* Recent Activity */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Recent Activity</h2>
              <p className={styles.cardSubtitle}>{RECENT_ACTIVITY.length} events in the last 48 hours</p>
            </div>
            <Link href="/dashboard/collaboration" className={styles.viewAll}>View History →</Link>
          </div>
          <ul className={styles.activityList}>
            {RECENT_ACTIVITY.map((activity, i) => (
              <li key={i} className={styles.activityItem}>
                <div className={styles.activityIconWrapper}>
                  {ACTIVITY_ICONS[activity.type]}
                </div>
                <div className={styles.activityDetails}>
                  <p className={styles.activityAction}>{activity.action}</p>
                  <p className={styles.activityFile}>{activity.file}</p>
                </div>
                <div className={styles.activityStatusGroup}>
                  <span className={styles.activityTime}>{activity.time}</span>
                  <span className={`${styles.statusBadge} ${activity.status === "Complete" ? styles.statusComplete : styles.statusProgress}`}>
                    {activity.status === "Complete" ? "✓ " : "⏳ "}{activity.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

      </div>

      {/* ── System Status Footer ── */}
      <section className={styles.statusBar}>
        <span className={styles.statusBarLabel}>System Status</span>
        <div className={styles.statusItems}>
          {SYSTEM_STATUS.map((s) => (
            <div key={s.label} className={styles.statusItem}>
              <span className={`${styles.statusDot} ${s.ok ? styles.statusDotOk : styles.statusDotWarn}`} />
              <span className={styles.statusItemLabel}>{s.label}</span>
              <span className={`${styles.statusItemValue} ${s.ok ? styles.statusOkText : styles.statusWarnText}`}>{s.status}</span>
            </div>
          ))}
        </div>
        <span className={styles.statusLastUpdate}>Last updated just now</span>
      </section>

    </div>
  );
}
