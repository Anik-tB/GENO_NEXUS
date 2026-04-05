"use client";

import styles from "./page.module.css";

const REPORTS = [
  { id: "r1", name: "Comprehensive Genomic Profile", patient: "JD-8942", date: "2026-03-29", size: "2.4 MB", status: "Signed" },
  { id: "r2", name: "Pharmacogenomics Summary",      patient: "MS-1104", date: "2026-03-28", size: "1.1 MB", status: "Signed" },
  { id: "r3", name: "Hereditary Cancer Risk Panel",  patient: "JD-8942", date: "2026-03-15", size: "3.8 MB", status: "Draft" },
];

export default function ReportsPage() {
  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>📄 Clinical Reporting Suite</div>
          <h1 className={styles.title}>Clinical Reports</h1>
          <p className={styles.subtitle}>Generate, review, and export AI-synthesized patient genomic dossiers with a single click.</p>
        </div>
        <button className={styles.generateBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Generate New Report
        </button>
      </header>

      <div className={styles.contentGrid}>
        {/* ── Document Preview ── */}
        <div className={styles.previewPanel}>
          <div className={styles.previewToolbar}>
            <div className={styles.previewTabs}>
              <button className={`${styles.tab} ${styles.tabActive}`}>Executive Summary</button>
              <button className={styles.tab}>Variant Pathologies</button>
              <button className={styles.tab}>Therapy Guidance</button>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.iconBtn} title="Print">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
              <button className={styles.iconBtn} title="Share">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
              <button className={styles.downloadBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </button>
            </div>
          </div>

          <div className={styles.documentPreview}>
            <div className={styles.documentPage}>
              <div className={styles.docHeader}>
                <div className={styles.docBrand}>
                  <span className={styles.docBrandIcon}>🧬</span> GenoNexus Clinical
                </div>
                <div className={styles.docMeta}>
                  <span><strong>Patient:</strong> JD-8942</span>
                  <span className={styles.metaDivider}>·</span>
                  <span><strong>Date:</strong> 2026-03-29</span>
                  <span className={styles.metaDivider}>·</span>
                  <span className={styles.signedBadge}>✓ Electronically Signed</span>
                </div>
              </div>

              <h1 className={styles.docTitle}>Comprehensive Genomic Profile</h1>

              <div className={styles.docSection}>
                <h2>1. AI Executive Synopsis</h2>
                <p>The analyzed exome sequence reveals a <strong>moderate actionable risk</strong> profile. Key pathogenic findings include a heterozygous mutation in <code>CYP2C19</code> and a risk-associated SNP in <code>APOE</code>. The patient is classified as a poor metabolizer for select cardiovascular therapeutics, necessitating immediate pharmacogenomic intervention.</p>
              </div>

              <div className={styles.docSection}>
                <h2>2. Primary Findings</h2>
                <table className={styles.docTable}>
                  <thead><tr><th>Gene</th><th>Variant</th><th>Risk</th><th>Clinical Implication</th></tr></thead>
                  <tbody>
                    <tr>
                      <td><code>CYP2C19</code></td><td>*2/*2</td>
                      <td><span className={styles.riskHigh}>High</span></td>
                      <td>Clopidogrel resistance. High risk of adverse cardiovascular events.</td>
                    </tr>
                    <tr>
                      <td><code>APOE</code></td><td>e4/e4</td>
                      <td><span className={styles.riskHigh}>High</span></td>
                      <td>Elevated lifetime risk for late-onset Alzheimer&apos;s.</td>
                    </tr>
                    <tr>
                      <td><code>SLCO1B1</code></td><td>Normal</td>
                      <td><span className={styles.riskLow}>Low</span></td>
                      <td>Standard statin metabolizer. No myopathy risk indicated.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.docSection}>
                <h2>3. Risk Distribution</h2>
                <div className={styles.riskBars}>
                  {[{ label: "Cardiovascular", pct: 62, color: "var(--gn-warning)" }, { label: "Neurological", pct: 45, color: "var(--gn-warning)" }, { label: "Oncological", pct: 15, color: "var(--gn-success)" }].map((r) => (
                    <div key={r.label} className={styles.riskBarRow}>
                      <span className={styles.riskBarLabel}>{r.label}</span>
                      <div className={styles.riskBarTrack}>
                        <div className={styles.riskBarFill} style={{ width: `${r.pct}%`, background: r.color }} />
                      </div>
                      <span className={styles.riskBarPct}>{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.docFooter}>
                Electronically signed by GenoNexus AI Copilot · Validation Hash: 8F2A9B1C · Confidential
              </div>
            </div>
          </div>
        </div>

        {/* ── History Panel ── */}
        <div className={styles.historyPanel}>
          <h3 className={styles.panelTitle}>Report Archive</h3>
          <div className={styles.archiveList}>
            {REPORTS.map((rep) => (
              <div key={rep.id} className={styles.archiveCard}>
                <div className={styles.archiveIconBox}>📄</div>
                <div className={styles.archiveInfo}>
                  <strong className={styles.archiveName}>{rep.name}</strong>
                  <span className={styles.archiveMeta}>{rep.patient} · {rep.date}</span>
                  <div className={styles.archiveFooter}>
                    <span className={styles.archiveSize}>{rep.size}</span>
                    <span className={`${styles.archiveStatus} ${rep.status === "Signed" ? styles.statusSigned : styles.statusDraft}`}>
                      {rep.status === "Signed" ? "✓ " : "✎ "}{rep.status}
                    </span>
                  </div>
                </div>
                <button className={styles.dlBtn} title="Download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
              </div>
            ))}
          </div>

          <div className={styles.exportOptions}>
            <p className={styles.exportTitle}>Export Format</p>
            <div className={styles.exportBtns}>
              <button className={styles.exportBtn}>PDF</button>
              <button className={styles.exportBtn}>DOCX</button>
              <button className={styles.exportBtn}>HL7 FHIR</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
