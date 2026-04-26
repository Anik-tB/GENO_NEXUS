"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { GenomeBrowser } from "@/components/visualization/GenomeBrowser";
import { DigitalCellTwin } from "@/components/visualization/DigitalCellTwin";
import { PhyloTree } from "@/components/visualization/PhyloTree";
import { VirusTracker } from "@/components/visualization/VirusTracker";

const TABS = [
  {
    id: "helix",
    label: "3D Genome Browser",
    icon: "🧬",
    sub: "Explore DNA helix & chromosome mutations",
  },
  {
    id: "cell",
    label: "Digital Cell Twin",
    icon: "🔬",
    sub: "Simulate cellular drug interactions",
  },
  {
    id: "phylo",
    label: "Phylogenetic Tree",
    icon: "🌿",
    sub: "Evolutionary lineage builder",
  },
  {
    id: "virus",
    label: "Virus Mutation Tracker",
    icon: "🦠",
    sub: "Real-time outbreak visualization",
  },
];

const HELIX_SUB_TABS = [
  { id: "helix", label: "3D Helix" },
  { id: "chromosome", label: "Chromosome Map" },
];

export default function VisualizationPage() {
  const [activeTab, setActiveTab] = useState("helix");
  const [helixView, setHelixView] = useState<"helix" | "chromosome">("helix");

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

        {/* Sub-tabs only for helix */}
        {activeTab === "helix" && (
          <div className={styles.viewToggles}>
            {HELIX_SUB_TABS.map((t) => (
              <button
                key={t.id}
                className={`${styles.toggleBtn} ${helixView === t.id ? styles.toggleActive : ""}`}
                onClick={() => setHelixView(t.id as "helix" | "chromosome")}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Module Tabs */}
      <nav className={styles.moduleTabs}>
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
        {activeTab === "helix" && (
          <div className={styles.viewerWrapper}>
            {/* Sidebar */}
            <aside className={styles.toolbox}>
              <p className={styles.toolboxLabel}>Sequence Info</p>
              <div className={styles.stats}>
                {[
                  { label: "Active View", value: helixView === "helix" ? "3D Helix" : "Chromosome Map" },
                  { label: "Highlighted Loci", value: "3 Pathogenic" },
                  { label: "Render Precision", value: "Atomic (0.1 nm)" },
                  { label: "Model Interaction", value: "Live WebGL" },
                ].map((s, i) => (
                  <div key={i} className={styles.statItem}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <strong className={styles.statValue}>{s.value}</strong>
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
              <div className={styles.renderOverlay}>
                <span className={styles.overlayBadge}>
                  <span className={styles.blinkDot}>●</span> Live Hardware Rendering
                </span>
              </div>
              <div className={styles.helixContainer}>
                <GenomeBrowser activeView={helixView} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "cell" && (
          <div className={styles.fullArea}>
            <DigitalCellTwin />
          </div>
        )}

        {activeTab === "phylo" && (
          <div className={styles.fullArea}>
            <PhyloTree />
          </div>
        )}

        {activeTab === "virus" && (
          <div className={styles.fullArea}>
            <VirusTracker />
          </div>
        )}
      </div>
    </div>
  );
}
