"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { GenomeBrowser } from "@/components/visualization/GenomeBrowser";

const TABS = [
  {
    id: "chromosome",
    label: "Chromosome Map Viewer",
    icon: "🧬",
    sub: "Explore chromosome mutations & risk loci",
  }
];

export default function VisualizationPage() {
  const [activeTab, setActiveTab] = useState("chromosome");
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/visualization/analysis-data")
      .then((r) => r.json())
      .then((d) => setAnalysisData(d))
      .catch(() => {});
  }, []);

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>🧬 Molecular Visualization Engine</div>
          <h1 className={styles.title}>{activeTabData.icon} {activeTabData.label}</h1>
          <p className={styles.subtitle}>{activeTabData.sub}</p>
        </div>
      </header>

      {/* Module Tabs - Hidden since there's only one tab now, but kept for future real expansions */}
      <nav className={styles.moduleTabs} style={{ display: 'none' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.moduleTab} ${activeTab === tab.id ? styles.moduleTabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {activeTab === "chromosome" && (
          <div className={styles.viewerWrapper}>
            {/* Sidebar */}
            <aside className={styles.toolbox}>
              <p className={styles.toolboxLabel}>Sequence Info</p>
              <div className={styles.stats}>
                {[
                  { label: "File",         value: analysisData?.hasData ? analysisData.fileName : "No analysis yet" },
                  { label: "Organism",     value: analysisData?.hasData ? analysisData.organism : "—" },
                  { label: "Seq Match",    value: analysisData?.hasData ? `${analysisData.matchPct}%` : "—" },
                  { label: "Total Variants", value: analysisData?.hasData ? String(analysisData.totalMutations) : "—" },
                  { label: "Ts/Tv Ratio",  value: analysisData?.hasData ? analysisData.tsTvRatio : "—" },
                  { label: "Mutations/kb", value: analysisData?.hasData ? analysisData.mutFreq : "—" },
                  { label: "Indel Bias",   value: analysisData?.hasData ? analysisData.indelRatio : "—" },
                ].map((s, i) => (
                  <div key={i} className={styles.statItem}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <strong className={styles.statValue} style={
                      s.label === "Ts/Tv Ratio" && analysisData?.hasData && parseFloat(analysisData.tsTvRatio) > 2.0 ? { color: 'var(--gn-success)' } : 
                      s.label === "Ts/Tv Ratio" && analysisData?.hasData ? { color: 'var(--gn-warning)' } : {}
                    }>{s.value}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.mutationLegend}>
                <p className={styles.toolboxLabel}>Mutation Legend</p>
                {[
                  { color: "var(--gn-danger)", label: "Pathogenic" },
                  { color: "var(--gn-warning)", label: "Uncertain Significance" },
                  { color: "var(--gn-success)", label: "Benign / Low Risk" },
                ].map((l) => (
                  <div key={l.label} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: l.color }} />
                    <span className={styles.legendLabel}>{l.label}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Render Area */}
            <div className={styles.renderArea}>
              <div className={styles.renderOverlay} style={{ display: 'flex', gap: '1rem' }}>
                <span className={styles.overlayBadge}>
                  <span className={styles.blinkDot}>●</span> Analysis Data Rendered
                </span>
                <span className={styles.overlayBadge} style={{ background: 'var(--gn-bg)', border: '1px solid var(--gn-primary)', color: 'var(--gn-primary)' }}>
                  👆 Click on any chromosome strand to view Sequence Alignments
                </span>
              </div>
              <div className={styles.helixContainer}>
                <GenomeBrowser chromosomes={analysisData?.chromosomes} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
