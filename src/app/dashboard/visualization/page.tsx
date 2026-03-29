"use client";

import { useState } from "react";
import styles from "./page.module.css";
// Importing the existing DnaHelix component
import { DnaHelix } from "@/components/marketing/dna-helix";

const VIEWER_STATS = [
  { label: "Active View", value: "3D Helix Structure" },
  { label: "Highlighted Loci", value: "3 Pathogenic" },
  { label: "Render Precision", value: "Atomic (0.1nm)" },
  { label: "Model Interaction", value: "Live WebGL" }
];

export default function VisualizationPage() {
  const [activeTab, setActiveTab] = useState("helix");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Genome Visualization</h1>
          <p className={styles.subtitle}>Interact with the patient's sequence in 3D molecular space.</p>
        </div>
        <div className={styles.viewToggles}>
          <button 
            className={`${styles.toggleBtn} ${activeTab === 'helix' ? styles.toggleActive : ''}`}
            onClick={() => setActiveTab('helix')}
          >
            3D Helix
          </button>
          <button 
            className={`${styles.toggleBtn} ${activeTab === 'chromosome' ? styles.toggleActive : ''}`}
            onClick={() => setActiveTab('chromosome')}
          >
            Chromosome Map
          </button>
        </div>
      </header>

      <div className={styles.viewerWrapper}>
        {/* Toolbox / Controls */}
        <aside className={styles.toolbox}>
          <h3>Camera Controls</h3>
          <div className={styles.tools}>
            <button className={styles.toolBtn}><span>🔍</span> Zoom In</button>
            <button className={styles.toolBtn}><span>🔎</span> Zoom Out</button>
            <button className={styles.toolBtn}><span>🔄</span> Reset Rotation</button>
            <button className={styles.toolBtn}><span>✨</span> Highlight Mutations</button>
          </div>

          <h3 className={styles.mt4}>Sequence Info</h3>
          <div className={styles.stats}>
            {VIEWER_STATS.map((stat, i) => (
              <div key={i} className={styles.statItem}>
                <span className={styles.statLabel}>{stat.label}</span>
                <strong className={styles.statValue}>{stat.value}</strong>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Render Area */}
        <div className={styles.renderArea}>
          <div className={styles.renderOverlay}>
            <span className={styles.overlayBadge}>Live Hardware Rendering</span>
          </div>
          
          {activeTab === 'helix' ? (
            <div className={styles.helixContainer}>
              <DnaHelix variant="dashboard" />
            </div>
          ) : (
            <div className={styles.chromosomePlaceholder}>
              <div className={styles.chromosomes}>
                {Array.from({ length: 23 }).map((_, i) => (
                  <div key={i} className={styles.chromosomePair}>
                    <div className={styles.chromatid} style={{ height: `${100 - i * 2}%` }}>
                      {i === 6 ? <span className={styles.mutationPin} title="Mutation detected"></span> : null}
                    </div>
                    <span>{i + 1}</span>
                  </div>
                ))}
                <div className={styles.chromosomePair}>
                  <div className={styles.chromatid} style={{ height: '40%' }} />
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
