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
      
      {/* Background bitstream */}
      <div className={styles.bitstream}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i}>01011001 10110001 00110101 11001010 10100111 00011011</div>
        ))}
      </div>

      <div className={styles.crosshair} />

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
          Live clinical monitoring
        </p>
        <div className={styles.scanningLine} />
        <div className={styles.panelGrid}>
          <div className={`${styles.panelCard} ${styles.panelCardHigh}`}>
            <div className={styles.panelCardHeader}>
              <strong className={styles.markerCode}>CYP2C19</strong>
              <span className={styles.riskBadgeHigh}>Critical</span>
            </div>
            <p>Clopidogrel metabolism severely impaired. High thrombotic risk profile.</p>
            <div className={styles.dataBar}><span style={{ width: "92%" }} /></div>
          </div>
          <div className={`${styles.panelCard} ${styles.panelCardModerate}`}>
            <div className={styles.panelCardHeader}>
              <strong className={styles.markerCode}>CYP2D6</strong>
              <span className={styles.riskBadgeModerate}>Caution</span>
            </div>
            <p>Codeine toxicity risk detected. Atypical metabolic pathway identified.</p>
            <div className={styles.dataBar}><span style={{ width: "64%" }} /></div>
          </div>
          <div className={`${styles.panelCard} ${styles.panelCardSafe}`}>
            <div className={styles.panelCardHeader}>
              <strong className={styles.markerCode}>E2EE-DNA</strong>
              <span className={styles.riskBadgeSafe}>Encrypted</span>
            </div>
            <p>End-to-end genomic encryption active. No unauthorized access possible.</p>
            <div className={styles.dataBar}><span style={{ width: "100%" }} /></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
