"use client";

import { useState, useEffect } from "react";
import styles from "./GenomeBrowser.module.css";
import { DnaHelix } from "@/components/marketing/dna-helix";

const LOCI_DETAILS: Record<string, { title: string; desc: string; color: string }> = {
  pathogenic: {
    title: "Pathogenic Variant",
    desc: "This variant is classified as pathogenic and is associated with significantly increased disease risk. Immediate clinical review recommended.",
    color: "var(--gn-danger)",
  },
  uncertain: {
    title: "Variant of Uncertain Significance",
    desc: "Insufficient evidence to classify this variant as pathogenic or benign. Additional functional studies may be required.",
    color: "var(--gn-warning)",
  },
  benign: {
    title: "Benign / Low Risk",
    desc: "This variant is considered benign based on population frequency and functional data. No immediate action required.",
    color: "var(--gn-success)",
  },
};

interface AnalysisData {
  hasData: boolean;
  fileName?: string;
  matchPct?: number;
  totalMutations?: number;
  pathogenicCount?: number;
  uncertainCount?: number;
  benignCount?: number;
  chromosomes?: any[];
}

export function GenomeBrowser({ activeView }: { activeView: "helix" | "chromosome" }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData>({ hasData: false });
  const [selectedChrom, setSelectedChrom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/visualization/analysis-data");
        const data = await res.json();
        setAnalysisData(data);
      } catch (err) {
        console.error("Failed to fetch visualization data:", err);
        setAnalysisData({ hasData: false });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (activeView === "helix") {
    return (
      <div className={styles.helixWrapper}>
        <DnaHelix variant="dashboard" />
        <div className={styles.helixInfo}>
          <div className={styles.infoBadge}>
            <span className={styles.blinkDot}>●</span>{" "}
            {loading
              ? "Loading analysis data…"
              : analysisData.hasData
              ? `Live Rendering — ${analysisData.fileName}`
              : "Live Rendering — No analysis yet"}
          </div>
          <div className={styles.helixStats}>
            {loading ? (
              <div style={{ color: "#888", fontSize: "0.85rem" }}>Fetching stats…</div>
            ) : analysisData.hasData ? (
              <>
                {[
                  { label: "File", value: analysisData.fileName ?? "—" },
                  { label: "Seq Match", value: `${analysisData.matchPct ?? 0}%` },
                  { label: "Mutations", value: String(analysisData.totalMutations ?? 0) },
                  { label: "Pathogenic", value: String(analysisData.pathogenicCount ?? 0) },
                  { label: "Uncertain", value: String(analysisData.uncertainCount ?? 0) },
                  { label: "Benign", value: String(analysisData.benignCount ?? 0) },
                ].map((s) => (
                  <div key={s.label} className={styles.helixStat}>
                    <span className={styles.statVal}>{s.value}</span>
                    <span className={styles.statLbl}>{s.label}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: "Status", value: "No data" },
                  { label: "Action", value: "Upload DNA" },
                ].map((s) => (
                  <div key={s.label} className={styles.helixStat}>
                    <span className={styles.statVal}>{s.value}</span>
                    <span className={styles.statLbl}>{s.label}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Chromosome Map View ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={styles.chromoWrapper}
        style={{ alignItems: "center", justifyContent: "center", color: "var(--gn-white)" }}
      >
        Loading chromosome data…
      </div>
    );
  }

  const chromosomes = analysisData.hasData && analysisData.chromosomes
    ? analysisData.chromosomes
    : buildDefaultKaryotype();

  return (
    <div className={styles.chromoWrapper}>
      {/* Data source badge */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          background: analysisData.hasData ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
          border: `1px solid ${analysisData.hasData ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
          color: analysisData.hasData ? "var(--gn-success)" : "var(--gn-warning)",
          zIndex: 10,
        }}
      >
        {analysisData.hasData
          ? `📄 ${analysisData.fileName} · ${analysisData.totalMutations} variants`
          : "⚠ Reference karyotype — upload DNA for live data"}
      </div>

      {/* Sci-fi grid lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.gridLine} style={{ top: `${10 + i * 11}%` }} />
      ))}

      <div className={styles.chromosomes}>
        {chromosomes.map((ch: any) => (
          <div
            key={ch.id}
            className={styles.pair}
            onClick={() => setSelectedChrom(ch === selectedChrom ? null : ch)}
          >
            <div
              className={`${styles.chromatid} ${selectedChrom?.id === ch.id ? styles.selected : ""}`}
              style={{ height: `${ch.height}%` }}
            >
              {ch.hasMutation && ch.mutationType && LOCI_DETAILS[ch.mutationType] && (
                <span
                  className={styles.mutPin}
                  style={{ background: LOCI_DETAILS[ch.mutationType].color }}
                />
              )}
            </div>
            <span className={styles.chromLabel}>{ch.label}</span>
          </div>
        ))}
      </div>

      {selectedChrom && selectedChrom.hasMutation && LOCI_DETAILS[selectedChrom.mutationType] && (
        <div className={styles.locusPanelOverlay}>
          <div className={styles.locusPanel}>
            <button className={styles.locusClose} onClick={() => setSelectedChrom(null)}>✕</button>
            <div
              className={styles.locusBadge}
              style={{
                background: LOCI_DETAILS[selectedChrom.mutationType].color + "22",
                color: LOCI_DETAILS[selectedChrom.mutationType].color,
                border: `1px solid ${LOCI_DETAILS[selectedChrom.mutationType].color}44`,
              }}
            >
              {LOCI_DETAILS[selectedChrom.mutationType].title}
            </div>
            <h3 className={styles.locusGene}>
              {selectedChrom.gene}
              <span className={styles.locusVariant}>{selectedChrom.variant}</span>
            </h3>
            <p className={styles.locusDesc}>{LOCI_DETAILS[selectedChrom.mutationType].desc}</p>
            <div className={styles.locusRow}>
              <span>Chromosome</span>
              <strong>{selectedChrom.label}</strong>
            </div>
            <div className={styles.locusRow}>
              <span>Clinical Impact</span>
              <strong style={{ color: LOCI_DETAILS[selectedChrom.mutationType].color }}>
                {selectedChrom.impact}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback static karyotype when no analysis data is available
function buildDefaultKaryotype() {
  return Array.from({ length: 23 }, (_, i) => ({
    id: i + 1,
    label: i < 22 ? String(i + 1) : "XY",
    height: Math.max(40, 100 - i * 3),
    hasMutation: [6, 11, 17].includes(i),
    mutationType: (i === 6 ? "pathogenic" : i === 11 ? "uncertain" : "benign") as
      | "pathogenic"
      | "uncertain"
      | "benign",
    gene: i === 6 ? "BRCA2" : i === 11 ? "TP53" : i === 17 ? "APOE" : "",
    variant: i === 6 ? "c.5946delT" : i === 11 ? "c.817C>T" : i === 17 ? "ε4 allele" : "",
    impact: (i === 6 ? "High" : i === 11 ? "Moderate" : "Low") as "High" | "Moderate" | "Low",
  }));
}
