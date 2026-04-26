"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { DnaHelix } from "@/components/marketing/dna-helix";

const VIEWER_STATS = [
  { label: "Active View",         value: "3D Helix Structure" },
  { label: "Highlighted Loci",    value: "3 Pathogenic" },
  { label: "Render Precision",    value: "Atomic (0.1 nm)" },
  { label: "Model Interaction",   value: "Live WebGL" },
];

const CAMERA_TOOLS = [
  { icon: "🔍", label: "Zoom In",            title: "Zoom in on selected region" },
  { icon: "🔎", label: "Zoom Out",           title: "Zoom out" },
  { icon: "🔄", label: "Reset Rotation",     title: "Reset camera rotation" },
  { icon: "✨", label: "Highlight Mutations", title: "Toggle mutation highlighting" },
];

export default function VisualizationPage() {
  const [activeTab, setActiveTab] = useState("helix");

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>🧬 Molecular Visualization Engine</div>
          <h1 className={styles.title}>Genome Visualization</h1>
          <p className={styles.subtitle}>Interact with patient sequence data in 3D molecular space. Click loci to reveal variant details.</p>
        </div>
        <div className={styles.viewToggles}>
          {[{ id: "helix", label: "3D Helix" }, { id: "chromosome", label: "Chromosome Map" }].map((t) => (
            <button
              key={t.id}
              className={`${styles.toggleBtn} ${activeTab === t.id ? styles.toggleActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.viewerWrapper}>
        {/* ── Toolbox ── */}
        <aside className={styles.toolbox}>
          <p className={styles.toolboxLabel}>Camera Controls</p>
          <div className={styles.tools}>
            {CAMERA_TOOLS.map((t) => (
              <button key={t.label} className={styles.toolBtn} title={t.title}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          <p className={styles.toolboxLabel} style={{ marginTop: "1.5rem" }}>Sequence Info</p>
          <div className={styles.stats}>
            {VIEWER_STATS.map((s, i) => (
              <div key={i} className={styles.statItem}>
                <span className={styles.statLabel}>{s.label}</span>
                <strong className={styles.statValue}>{s.value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.mutationLegend}>
            <p className={styles.toolboxLabel}>Mutation Legend</p>
            {[
              { color: "var(--gn-danger)",  label: "Pathogenic" },
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

        {/* ── Render Area ── */}
        <div className={styles.renderArea}>
          <div className={styles.renderOverlay}>
            <span className={styles.overlayBadge}>
              <span className={styles.blinkDot}>●</span> Live Hardware Rendering
            </span>
          </div>

          {activeTab === "helix" ? (
            <div className={styles.helixContainer}>
              <DnaHelix variant="dashboard" />
            </div>
          ) : (
            <div className={styles.chromosomePlaceholder}>
              <div className={styles.chromosomes}>
                {Array.from({ length: 23 }).map((_, i) => (
                  <div key={i} className={styles.chromosomePair}>
                    <div className={styles.chromatid} style={{ height: `${100 - i * 2}%` }}>
                      {i === 6 ? <span className={styles.mutationPin} title="Pathogenic mutation detected" /> : null}
                    </div>
                    <span>{i + 1}</span>
                  </div>
                ))}
                <div className={styles.chromosomePair}>
                  <div className={styles.chromatid} style={{ height: "40%" }} />
                  <span>XY</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
