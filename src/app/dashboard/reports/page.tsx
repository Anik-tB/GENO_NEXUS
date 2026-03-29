"use client";

import styles from "./page.module.css";

const ATTACHED_REPORTS = [
  { id: "r1", name: "Comprehensive Genomic Profile", patient: "JD-8942", date: "2026-03-29", size: "2.4 MB" },
  { id: "r2", name: "Pharmacogenomics Summary", patient: "MS-1104", date: "2026-03-28", size: "1.1 MB" },
  { id: "r3", name: "Hereditary Cancer Risk Panel", patient: "JD-8942", date: "2026-03-15", size: "3.8 MB" }
];

export default function ReportsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Clinical Reports</h1>
          <p className={styles.subtitle}>Generate, review, and export AI-synthesized patient dossiers.</p>
        </div>
        <button className={styles.generateBtn}>
          <span className={styles.icon}>+</span> Generate New Report
        </button>
      </header>

      <div className={styles.contentGrid}>
        {/* Main Document Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewToolbar}>
            <div className={styles.previewTabs}>
              <button className={`${styles.tab} ${styles.tabActive}`}>Executive Summary</button>
              <button className={styles.tab}>Variant Pathologies</button>
              <button className={styles.tab}>Therapy Guidance</button>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.actionIcon} title="Print">🖨️</button>
              <button className={styles.actionIcon} title="Share">↗️</button>
              <button className={styles.primaryAction}>Download PDF</button>
            </div>
          </div>

          <div className={styles.documentPreview}>
            <div className={styles.documentPage}>
              <div className={styles.docHeader}>
                <div className={styles.docBrand}>GenoNexus Clinical</div>
                <div className={styles.docMeta}>
                  <span><strong>Patient ID:</strong> JD-8942</span>
                  <span><strong>Date:</strong> 2026-03-29</span>
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
                  <thead>
                    <tr>
                      <th>Gene</th>
                      <th>Variant</th>
                      <th>Clinical Implication</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CYP2C19</td>
                      <td>*2/*2</td>
                      <td>Clopidogrel resistance. High risk of adverse cardiovascular events.</td>
                    </tr>
                    <tr>
                      <td>APOE</td>
                      <td>e4/e4</td>
                      <td>Elevated lifetime risk for late-onset Alzheimer's.</td>
                    </tr>
                    <tr>
                      <td>SLCO1B1</td>
                      <td>Normal</td>
                      <td>Standard statin metabolizer. No myopathy risk indicated.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.docSection}>
                <h2>3. Risk Distribution Chart</h2>
                <div className={styles.mockChart}>
                  {/* SVG Bar Chart Mockup */}
                  <svg viewBox="0 0 300 100" width="100%" height="100%">
                    <rect x="10" y="20" width="80" height="80" fill="var(--gn-success)" opacity="0.8" />
                    <rect x="110" y="50" width="80" height="50" fill="var(--gn-warning)" opacity="0.8" />
                    <rect x="210" y="10" width="80" height="90" fill="var(--gn-danger)" opacity="0.8" />
                    <text x="50" y="15" fill="#64748b" fontSize="10" textAnchor="middle">Low</text>
                    <text x="150" y="45" fill="#64748b" fontSize="10" textAnchor="middle">Med</text>
                    <text x="250" y="5" fill="#64748b" fontSize="10" textAnchor="middle">High</text>
                  </svg>
                </div>
              </div>

              <div className={styles.docFooter}>
                <p>Electronically signed by GenoNexus AI Copilot • Validation Hash: 8F2A9B1C</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Report History */}
        <div className={styles.historyPanel}>
          <h3 className={styles.panelTitle}>Recent Archives</h3>
          <div className={styles.archiveList}>
            {ATTACHED_REPORTS.map(rep => (
              <div key={rep.id} className={styles.archiveCard}>
                <div className={styles.archiveIcon}>📄</div>
                <div className={styles.archiveInfo}>
                  <strong className={styles.archiveName}>{rep.name}</strong>
                  <span className={styles.archiveMeta}>{rep.patient} • {rep.date}</span>
                </div>
                <button className={styles.downloadIcon} title={`Download ${rep.size}`}>⬇</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
