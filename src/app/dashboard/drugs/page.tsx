import styles from "./page.module.css";

const RECOMMENDED = [
  { name: "Rosuvastatin", score: 92, note: "Optimal lipid-lowering option. Normal SLCO1B1 transport predicted.", pathways: ["Lipid Metabolism"], gene: "SLCO1B1" },
  { name: "Sertraline",   score: 88, note: "Standard dosing recommended. CYP2C19 extensive metabolizer phenotype.", pathways: ["Neurology", "Psychiatry"], gene: "CYP2C19" },
  { name: "Prasugrel",    score: 85, note: "Preferred antiplatelet alternative due to CYP2C19 loss-of-function.", pathways: ["Cardiovascular"], gene: "CYP2C19" },
];

const AVOID = [
  { name: "Clopidogrel", score: 12, note: "High risk of therapeutic failure (CYP2C19 *2/*3 detected). Use Prasugrel or Ticagrelor.", severity: "high" },
  { name: "Simvastatin", score: 35, note: "Moderate risk of myopathy based on SLCO1B1 rs4149056 variant.", severity: "medium" },
  { name: "Codeine",     score: 20, note: "Ultra-rapid metabolism via CYP2D6 duplication. Risk of opiate toxicity.", severity: "high" },
];

export default function DrugsPage() {
  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>💊 Precision Prescribing Engine</div>
          <h1 className={styles.title}>Pharmacogenomics</h1>
          <p className={styles.subtitle}>AI-guided precision prescribing based on patient metabolic pathway profiling. Each recommendation is backed by detected variant evidence.</p>
        </div>
        <div className={styles.statRow}>
          <div className={styles.statChip} style={{ borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.06)" }}>
            <span style={{ color: "var(--gn-success)" }}>✓ {RECOMMENDED.length}</span>
            <span className={styles.statChipLabel}>Favorable</span>
          </div>
          <div className={styles.statChip} style={{ borderColor: "rgba(244,63,94,0.4)", background: "rgba(244,63,94,0.06)" }}>
            <span style={{ color: "var(--gn-danger)" }}>✕ {AVOID.length}</span>
            <span className={styles.statChipLabel}>High Risk</span>
          </div>
        </div>
      </header>

      <div className={styles.columns}>
        {/* ── Recommended ── */}
        <section className={styles.column}>
          <div className={`${styles.columnHeader} ${styles.headerSuccess}`}>
            <div className={styles.headerIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <h2>Favorable Response</h2>
              <p>{RECOMMENDED.length} drugs matched</p>
            </div>
          </div>
          <div className={styles.drugList}>
            {RECOMMENDED.map((drug, i) => (
              <article key={i} className={`${styles.drugCard} ${styles.cardSuccess}`}>
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.drugName}>{drug.name}</h3>
                    <code className={styles.geneTag}>{drug.gene}</code>
                  </div>
                  <div className={styles.scoreBadge}>
                    <span className={styles.scoreVal}>{drug.score}</span>
                    <span className={styles.scoreLbl}>Efficacy</span>
                  </div>
                </div>
                <div className={styles.efficacyBar}>
                  <div className={styles.efficacyFill} style={{ width: `${drug.score}%` }} />
                </div>
                <p className={styles.drugNote}>{drug.note}</p>
                <div className={styles.pathwayTags}>
                  {drug.pathways.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Avoid ── */}
        <section className={styles.column}>
          <div className={`${styles.columnHeader} ${styles.headerDanger}`}>
            <div className={styles.headerIcon} style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "var(--gn-danger)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div>
              <h2>Contraindicated / High Risk</h2>
              <p>{AVOID.length} drugs flagged</p>
            </div>
          </div>
          <div className={styles.drugList}>
            {AVOID.map((drug, i) => (
              <article key={i} className={`${styles.drugCard} ${styles.cardDanger}`}>
                <div className={styles.cardTop}>
                  <h3 className={styles.drugName}>{drug.name}</h3>
                  <span className={`${styles.sevBadge} ${styles[`sev_${drug.severity}`]}`}>
                    {drug.severity === "high" ? "⛔ HIGH" : "⚠️ MED"}
                  </span>
                </div>
                <p className={styles.drugNote}>{drug.note}</p>
                <div className={styles.failureRow}>
                  <span className={styles.failureLabel}>Toxicity / Failure</span>
                  <div className={styles.failureTrack}>
                    <div className={styles.failureBar} style={{ width: `${100 - drug.score}%` }} />
                  </div>
                  <span className={styles.failurePct}>{100 - drug.score}%</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
