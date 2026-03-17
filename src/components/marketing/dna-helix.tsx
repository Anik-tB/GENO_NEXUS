import styles from "./dna-helix.module.css";

const RUNGS = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  top: `${6 + index * 6.5}%`,
  className: index % 2 === 0 ? styles.rungA : styles.rungB
}));

export function DnaHelix() {
  return (
    <div className={styles.helixFrame}>
      {/* Animated glow orbs */}
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      {/* Grid pattern */}
      <div className={styles.gridOverlay} />

      {/* DNA Strand */}
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

      {/* Floating insight panel */}
      <aside className={styles.panel}>
        <p className={styles.panelHeader}>
          <span className={styles.liveDot} />
          Live analysis preview
        </p>
        <div className={styles.panelGrid}>
          <div className={`${styles.panelCard} ${styles.panelCardHigh}`}>
            <div className={styles.panelCardHeader}>
              <strong>CYP2C19</strong>
              <span className={styles.riskBadgeHigh}>High Risk</span>
            </div>
            <span>Clopidogrel may be less effective for this profile.</span>
          </div>
          <div className={`${styles.panelCard} ${styles.panelCardModerate}`}>
            <div className={styles.panelCardHeader}>
              <strong>CYP2D6</strong>
              <span className={styles.riskBadgeModerate}>Moderate</span>
            </div>
            <span>Codeine response may be unpredictable for this genotype.</span>
          </div>
          <div className={`${styles.panelCard} ${styles.panelCardSafe}`}>
            <div className={styles.panelCardHeader}>
              <strong>Data Control</strong>
              <span className={styles.riskBadgeSafe}>Secure</span>
            </div>
            <span>Your raw DNA file stays under your control and can be deleted.</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
