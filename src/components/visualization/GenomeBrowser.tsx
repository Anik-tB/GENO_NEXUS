"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./GenomeBrowser.module.css";
import { DnaHelix } from "@/components/marketing/dna-helix";

const CHROMOSOMES = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  label: i < 22 ? String(i + 1) : "XY",
  height: Math.max(40, 100 - i * 3),
  hasMutation: [6, 11, 17].includes(i),
  mutationType: i === 6 ? "pathogenic" : i === 11 ? "uncertain" : "benign",
  gene: i === 6 ? "BRCA2" : i === 11 ? "TP53" : "APOE",
  variant: i === 6 ? "c.5946delT" : i === 11 ? "c.817C>T" : "ε4 allele",
  impact: i === 6 ? "High" : i === 11 ? "Moderate" : "Low",
}));

const LOCI_DETAILS: Record<string, { title: string; desc: string; color: string }> = {
  pathogenic: {
    title: "Pathogenic Variant",
    desc: "This variant is classified as pathogenic and is associated with significantly increased disease risk.",
    color: "var(--gn-danger)",
  },
  uncertain: {
    title: "Variant of Uncertain Significance",
    desc: "Insufficient evidence to classify this variant as pathogenic or benign.",
    color: "var(--gn-warning)",
  },
  benign: {
    title: "Benign / Low Risk",
    desc: "This variant is considered benign based on population frequency and functional data.",
    color: "var(--gn-success)",
  },
};

export function GenomeBrowser({ activeView }: { activeView: "helix" | "chromosome" }) {
  const [selectedChrom, setSelectedChrom] = useState<(typeof CHROMOSOMES)[0] | null>(null);

  if (activeView === "helix") {
    return (
      <div className={styles.helixWrapper}>
        <DnaHelix variant="dashboard" />
        <div className={styles.helixInfo}>
          <div className={styles.infoBadge}>
            <span className={styles.blinkDot}>●</span> Live Rendering — Homo sapiens · hg38
          </div>
          <div className={styles.helixStats}>
            {[
              { label: "Base Pairs", value: "3.2B" },
              { label: "Genes", value: "~25,000" },
              { label: "Mutations", value: "3 flagged" },
              { label: "Coverage", value: "98.7%" },
            ].map((s) => (
              <div key={s.label} className={styles.helixStat}>
                <span className={styles.statVal}>{s.value}</span>
                <span className={styles.statLbl}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chromoWrapper}>
      {/* Sci-fi grid lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.gridLine} style={{ top: `${10 + i * 11}%` }} />
      ))}
      <div className={styles.chromosomes}>
        {CHROMOSOMES.map((ch) => (
          <div key={ch.id} className={styles.pair} onClick={() => setSelectedChrom(ch === selectedChrom ? null : ch)}>
            <div
              className={`${styles.chromatid} ${selectedChrom?.id === ch.id ? styles.selected : ""}`}
              style={{ height: `${ch.height}%` }}
            >
              {ch.hasMutation && (
                <span
                  className={styles.mutPin}
                  style={{
                    background:
                      ch.mutationType === "pathogenic"
                        ? "var(--gn-danger)"
                        : ch.mutationType === "uncertain"
                        ? "var(--gn-warning)"
                        : "var(--gn-success)",
                  }}
                />
              )}
            </div>
            <span className={styles.chromLabel}>{ch.label}</span>
          </div>
        ))}
      </div>

      {selectedChrom && selectedChrom.hasMutation && (
        <div className={styles.locusPanelOverlay}>
          <div className={styles.locusPanel}>
            <button className={styles.locusClose} onClick={() => setSelectedChrom(null)}>✕</button>
            <div
              className={styles.locusBadge}
              style={{ background: LOCI_DETAILS[selectedChrom.mutationType].color + "22", color: LOCI_DETAILS[selectedChrom.mutationType].color, border: `1px solid ${LOCI_DETAILS[selectedChrom.mutationType].color}44` }}
            >
              {LOCI_DETAILS[selectedChrom.mutationType].title}
            </div>
            <h3 className={styles.locusGene}>
              {selectedChrom.gene}
              <span className={styles.locusVariant}>{selectedChrom.variant}</span>
            </h3>
            <p className={styles.locusDesc}>{LOCI_DETAILS[selectedChrom.mutationType].desc}</p>
            <div className={styles.locusRow}><span>Chromosome</span><strong>{selectedChrom.label}</strong></div>
            <div className={styles.locusRow}><span>Clinical Impact</span><strong style={{ color: LOCI_DETAILS[selectedChrom.mutationType].color }}>{selectedChrom.impact}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
