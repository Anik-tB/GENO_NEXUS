import styles from "./dna-helix.module.css";

const RUNGS = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  top: `${8 + index * 7.2}%`,
  className: index % 2 === 0 ? styles.rungA : styles.rungB
}));

export function DnaHelix() {
  return (
    <div className={styles.helixFrame}>
      <div className={styles.helixGlow} />
      <div className={styles.strand}>
        {RUNGS.map((rung) => (
          <div
            key={rung.id}
            className={`${styles.rung} ${rung.className}`}
            style={{ top: rung.top }}
          >
            <span />
          </div>
        ))}
      </div>

      <aside className={styles.panel}>
        <p className={styles.panelHeader}>Sample insight snapshot</p>
        <div className={styles.panelGrid}>
          <div className={styles.panelCard}>
            <strong>CYP2C19 • High risk</strong>
            <span>Clopidogrel may be less effective for this profile.</span>
          </div>
          <div className={styles.panelCard}>
            <strong>CYP2D6 • Moderate</strong>
            <span>Codeine response may be unpredictable for this genotype.</span>
          </div>
          <div className={styles.panelCard}>
            <strong>24-hour control</strong>
            <span>Your raw DNA file stays under your control and can be deleted.</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

