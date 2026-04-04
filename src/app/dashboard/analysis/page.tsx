"use client";

import { useState } from "react";
import styles from "./page.module.css";

const CATEGORY_ICONS: Record<string, string> = {
  Pharmacogenomic: "💊",
  Oncology: "🔬",
  Neurology: "🧠",
  Hematology: "🩸",
};

const MUTATIONS = [
  { id: "m1", gene: "CYP2D6", type: "Missense", variant: "*1xN", severity: "medium", impact: "Ultra-rapid metabolizer. May decrease efficacy of prodrugs or increase toxicity of active drugs.", category: "Pharmacogenomic" },
  { id: "m2", gene: "BRCA1",  type: "Deletion", variant: "c.68_69delAG", severity: "high", impact: "Pathogenic variant associated with significantly elevated lifetime risk of breast and ovarian cancers.", category: "Oncology" },
  { id: "m3", gene: "EGFR",  type: "Substitution", variant: "L858R", severity: "low", impact: "Sensitizing mutation in NSCLC. Usually indicates favorable response to tyrosine kinase inhibitors.", category: "Oncology" },
  { id: "m4", gene: "APOE",  type: "Polymorphism", variant: "e4/e4", severity: "high", impact: "Homozygous risk allele for late-onset Alzheimer's. Indicates increased monitoring required.", category: "Neurology" },
  { id: "m5", gene: "F5",    type: "Missense", variant: "Factor V Leiden", severity: "medium", impact: "Increased baseline risk for venous thromboembolism. Caution with estrogen therapy.", category: "Hematology" },
];

const HEATMAP_DATA = Array.from({ length: 64 }, (_, i) => {
  const intensity = Math.abs(Math.sin(i * 0.6 + 1.2));
  if (intensity > 0.85) return "high";
  if (intensity > 0.55) return "medium";
  if (intensity > 0.25) return "low";
  return "none";
});

const SEVERITY_LABELS: Record<string, string> = { high: "HIGH", medium: "MED", low: "LOW" };

export default function AnalysisPage() {
  const [selectedGene, setSelectedGene] = useState(MUTATIONS[0]);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? MUTATIONS : MUTATIONS.filter((m) => m.severity === filter);
  const highCount = MUTATIONS.filter((m) => m.severity === "high").length;
  const medCount  = MUTATIONS.filter((m) => m.severity === "medium").length;
  const lowCount  = MUTATIONS.filter((m) => m.severity === "low").length;

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>🔬 Variant Analysis Module</div>
          <h1 className={styles.title}>Mutation Analysis</h1>
          <p className={styles.subtitle}>Review identified variants, severity classifications, and evidence-based clinical impacts.</p>
        </div>
        <div className={styles.kpiStrip}>
          <div className={styles.kpiBubble}>
            <span className={styles.kpiNum}>{MUTATIONS.length}</span>
            <span className={styles.kpiLbl}>Total Variants</span>
          </div>
          <div className={`${styles.kpiBubble} ${styles.kpiDanger}`}>
            <span className={styles.kpiNum}>{highCount}</span>
            <span className={styles.kpiLbl}>High Priority</span>
          </div>
          <div className={`${styles.kpiBubble} ${styles.kpiWarning}`}>
            <span className={styles.kpiNum}>{medCount}</span>
            <span className={styles.kpiLbl}>Medium</span>
          </div>
          <div className={`${styles.kpiBubble} ${styles.kpiSuccess}`}>
            <span className={styles.kpiNum}>{lowCount}</span>
            <span className={styles.kpiLbl}>Low Risk</span>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        {/* ── Variant Table ── */}
        <section className={styles.tableSection}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Identified Variants</h2>
            <div className={styles.filterPills}>
              {["all", "high", "medium", "low"].map((s) => (
                <button
                  key={s}
                  className={`${styles.pill} ${filter === s ? styles.pillActive : ""} ${filter === s && s !== "all" ? styles[`pill_${s}`] : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gene</th>
                  <th>Type</th>
                  <th>Variant</th>
                  <th>Category</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mut, idx) => (
                  <tr
                    key={mut.id}
                    className={`${styles.tableRow} ${selectedGene.id === mut.id ? styles.rowActive : ""}`}
                    onClick={() => setSelectedGene(mut)}
                  >
                    <td className={styles.tdNum}>{idx + 1}</td>
                    <td>
                      <span className={styles.geneLabel} title="Distinct sequence of nucleotides forming part of a chromosome">
                        {mut.gene}
                      </span>
                    </td>
                    <td>{mut.type}</td>
                    <td><code className={styles.code}>{mut.variant}</code></td>
                    <td>
                      <span className={styles.categoryPill}>
                        {CATEGORY_ICONS[mut.category]} {mut.category}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.severityBadge} ${styles[`badge_${mut.severity}`]}`}>
                        {SEVERITY_LABELS[mut.severity]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className={styles.noResults}>No variants match the selected filter.</div>
          )}
        </section>

        {/* ── Side Panel ── */}
        <div className={styles.sidePanel}>
          {/* Gene Detail */}
          <section className={styles.detailCard}>
            <div className={styles.detailTopBar}>
              <span className={styles.categoryTag}>
                {CATEGORY_ICONS[selectedGene.category]} {selectedGene.category}
              </span>
              <span className={`${styles.severityBadge} ${styles[`badge_${selectedGene.severity}`]}`}>
                {SEVERITY_LABELS[selectedGene.severity]}
              </span>
            </div>

            <h3 className={styles.detailGeneName}>{selectedGene.gene}</h3>

            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Mutation Type</span>
              <span className={styles.propertyValue}>{selectedGene.type}</span>
            </div>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Variant</span>
              <code className={styles.code}>{selectedGene.variant}</code>
            </div>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Clinical Impact</span>
              <p className={styles.impactText}>{selectedGene.impact}</p>
            </div>

            {selectedGene.severity === "high" && (
              <div className={styles.urgentAlert}>
                <span>⚠️</span>
                <span>Immediate clinical review recommended for this variant.</span>
              </div>
            )}

            <button className={styles.actionButton}>
              Explore in 3D Viewer →
            </button>
          </section>

          {/* Heatmap */}
          <section className={styles.heatmapCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Chromosome Heatmap</h3>
            </div>
            <p className={styles.heatmapDesc}>Mutation intensity distribution across 64 genomic loci.</p>
            <div className={styles.heatmapGrid}>
              {HEATMAP_DATA.map((val, i) => (
                <div
                  key={i}
                  className={`${styles.heatCell} ${styles[`heat_${val}`]}`}
                  title={`Locus ${i + 1}: ${val} intensity`}
                />
              ))}
            </div>
            <div className={styles.heatLegend}>
              <span>Low</span>
              <div className={styles.legendGradient} />
              <span>High</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
