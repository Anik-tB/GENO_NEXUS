import styles from "./page.module.css";

const RECOMMENDED_DRUGS = [
  { name: "Rosuvastatin", score: 92, note: "Optimal lipid-lowering option. Normal SLCO1B1 transport predicted.", pathways: ["Lipid Metabolism"] },
  { name: "Sertraline", score: 88, note: "Standard dosing recommended. CYP2C19 extensive metabolizer phenotype.", pathways: ["Neurology", "Psychiatry"] },
  { name: "Prasugrel", score: 85, note: "Preferred antiplatelet alternative due to CYP2C19 loss-of-function.", pathways: ["Cardiovascular"] }
];

const AVOID_DRUGS = [
  { name: "Clopidogrel", score: 12, note: "High risk of therapeutic failure (CYP2C19 *2/*3 detected). Use Prasugrel or Ticagrelor.", severity: "high" },
  { name: "Simvastatin", score: 35, note: "Moderate risk of myopathy based on SLCO1B1 rs4149056 variant.", severity: "medium" },
  { name: "Codeine", score: 20, note: "Ultra-rapid metabolism via CYP2D6 duplication. Risk of opiate toxicity.", severity: "high" }
];

export default function DrugsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pharmacogenomics</h1>
        <p className={styles.subtitle}>AI-guided precision prescribing based on patient metabolic pathways.</p>
      </header>

      <div className={styles.columns}>
        {/* Recommended Column */}
        <section className={styles.column}>
          <div className={`${styles.columnHeader} ${styles.headerSuccess}`}>
            <div className={styles.icon}>✓</div>
            <h2>Favorable Response</h2>
            <span className={styles.count}>{RECOMMENDED_DRUGS.length} matches</span>
          </div>

          <div className={styles.drugList}>
            {RECOMMENDED_DRUGS.map((drug, i) => (
              <article key={i} className={`${styles.drugCard} ${styles.cardSuccess}`}>
                <div className={styles.cardTop}>
                  <h3 className={styles.drugName}>{drug.name}</h3>
                  <div className={styles.scoreBadge}>
                    <span className={styles.scoreValue}>{drug.score}</span>
                    <span className={styles.scoreLabel}>Efficacy</span>
                  </div>
                </div>
                
                <p className={styles.drugNote}>{drug.note}</p>
                
                <div className={styles.pathwayTags}>
                  {drug.pathways.map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Avoid Column */}
        <section className={styles.column}>
          <div className={`${styles.columnHeader} ${styles.headerDanger}`}>
            <div className={styles.icon}>×</div>
            <h2>High Risk / Ineffective</h2>
            <span className={styles.count}>{AVOID_DRUGS.length} matches</span>
          </div>

          <div className={styles.drugList}>
            {AVOID_DRUGS.map((drug, i) => (
              <article key={i} className={`${styles.drugCard} ${styles.cardDanger}`}>
                <div className={styles.cardTop}>
                  <h3 className={styles.drugName}>{drug.name}</h3>
                  <div className={`${styles.severityIndicator} ${styles[`sev_${drug.severity}`]}`}>
                    {drug.severity.toUpperCase()} RISK
                  </div>
                </div>
                
                <p className={styles.drugNote}>{drug.note}</p>
                
                <div className={styles.failureScore}>
                  <div className={styles.progressTrack}>
                    <div 
                      className={styles.progressBar} 
                      style={{ width: `${100 - drug.score}%` }} 
                    />
                  </div>
                  <span>{100 - drug.score}% Toxicity / Failure Probability</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
