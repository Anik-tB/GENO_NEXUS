import styles from "./dna-helix.module.css";

const RUNGS = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  top: `${8 + index * 6.1}%`,
  className: index % 2 === 0 ? styles.rungA : styles.rungB
}));

const SEQUENCE_ROWS = [
  "ACTG TCCA GATC CGTA",
  "GGTA CCTA ACGT TTGA",
  "CTAG GTAC CAGT ACCT",
  "TCAA GGCT ATGC CGAT"
];

const CHROME_CHIPS = ["Medication safety", "Consent-aware"];

const WORKFLOW_LABELS = ["DNA intake", "AI review", "Clinical handoff"];

const PANEL_ITEMS = [
  {
    marker: "CYP2C19",
    status: "Priority",
    toneClass: styles.panelCardHigh,
    badgeClass: styles.riskBadgeHigh,
    text: "Reduced response surfaced in the medication-safety layer.",
    width: "88%"
  },
  {
    marker: "CYP2D6",
    status: "Review",
    toneClass: styles.panelCardModerate,
    badgeClass: styles.riskBadgeModerate,
    text: "Rapid metabolism pathway flagged for clinician review.",
    width: "64%"
  },
  {
    marker: "Vault",
    status: "Protected",
    toneClass: styles.panelCardSafe,
    badgeClass: styles.riskBadgeSafe,
    text: "Consent, access, and audit controls remain locked to the case.",
    width: "100%"
  }
];

export function DnaHelix() {
  return (
    <div className={styles.helixFrame}>
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />
      <div className={styles.gridOverlay} />

      <div className={styles.platformChrome}>
        <div className={styles.platformBrand}>
          <span className={styles.platformMark}>GN</span>
          <div className={styles.platformText}>
            <strong>GenoNexus Platform</strong>
            <span>Live pharmacogenomics surface</span>
          </div>
        </div>

        <div className={styles.platformChips}>
          {CHROME_CHIPS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <div className={styles.sequenceField}>
        {Array.from({ length: 18 }).map((_, index) => (
          <div key={index}>{SEQUENCE_ROWS[index % SEQUENCE_ROWS.length]}</div>
        ))}
      </div>

      <div className={styles.workflowLegend}>
        {WORKFLOW_LABELS.map((item) => (
          <div key={item} className={styles.workflowLegendItem}>
            <span className={styles.workflowLegendDot} />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className={styles.crosshair} />

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
        <div className={styles.panelTopbar}>
          <p className={styles.panelHeader}>
            <span className={styles.liveDot} />
            Active signal board
          </p>
          <span className={styles.panelCase}>Case GN-88392</span>
        </div>

        <div className={styles.scanningLine} />

        <div className={styles.panelGrid}>
          {PANEL_ITEMS.map((item) => (
            <div key={item.marker} className={`${styles.panelCard} ${item.toneClass}`}>
              <div className={styles.panelCardHeader}>
                <strong className={styles.markerCode}>{item.marker}</strong>
                <span className={item.badgeClass}>{item.status}</span>
              </div>
              <p>{item.text}</p>
              <div className={styles.dataBar}>
                <span style={{ width: item.width }} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.statusStrip}>
          {["Ingest", "Interpret", "Report", "Govern"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </aside>
    </div>
  );
}
