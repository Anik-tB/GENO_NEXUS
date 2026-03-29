"use client";

import { useState } from "react";
import styles from "./page.module.css";

const MUTATIONS = [
  { id: "m1", gene: "CYP2D6", type: "Missense", variant: "*1xN", severity: "medium", impact: "Ultra-rapid metabolizer. May decrease efficacy of prodrugs or increase toxicity of active drugs.", category: "Pharmacogenomic" },
  { id: "m2", gene: "BRCA1", type: "Deletion", variant: "c.68_69delAG", severity: "high", impact: "Pathogenic variant associated with significantly elevated lifetime risk of breast and ovarian cancers.", category: "Oncology" },
  { id: "m3", gene: "EGFR", type: "Substitution", variant: "L858R", severity: "low", impact: "Sensitizing mutation in NSCLC. Usually indicates favorable response to tyrosine kinase inhibitors.", category: "Oncology" },
  { id: "m4", gene: "APOE", type: "Polymorphism", variant: "e4/e4", severity: "high", impact: "Homozygous risk allele for late-onset Alzheimer's disease. Indicates increased monitoring required.", category: "Neurology" },
  { id: "m5", gene: "F5", type: "Missense", variant: "Factor V Leiden", severity: "medium", impact: "Increased baseline risk for venous thromboembolism. Caution with estrogen therapy.", category: "Hematology" }
];

const HEATMAP_DATA = Array.from({ length: 64 }, (_, i) => {
  const intensity = Math.random();
  if (intensity > 0.9) return "high";
  if (intensity > 0.6) return "medium";
  if (intensity > 0.3) return "low";
  return "none";
});

export default function AnalysisPage() {
  const [selectedGene, setSelectedGene] = useState(MUTATIONS[0]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mutation Analysis</h1>
        <p className={styles.subtitle}>Review identified variants, severity mapping, and clinical impacts.</p>
      </header>

      <div className={styles.grid}>
        {/* Main Table Area */}
        <section className={styles.tableSection}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Identified Variants</h2>
            <div className={styles.tableFilters}>
              <select className={styles.dropdown}>
                <option>All Severities</option>
                <option>High Priority</option>
                <option>Medium Priority</option>
              </select>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Gene</th>
                  <th>Mutation Type</th>
                  <th>Variant</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {MUTATIONS.map(mut => (
                  <tr 
                    key={mut.id} 
                    className={`${styles.tableRow} ${selectedGene.id === mut.id ? styles.rowActive : ""}`}
                    onClick={() => setSelectedGene(mut)}
                  >
                    <td>
                      <span className={styles.geneTooltip} title="A distinct sequence of nucleotides forming part of a chromosome.">
                        {mut.gene}
                      </span>
                    </td>
                    <td>{mut.type}</td>
                    <td><code className={styles.code}>{mut.variant}</code></td>
                    <td>
                      <span className={`${styles.severityBadge} ${styles[`badge_${mut.severity}`]}`}>
                        {mut.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Sidebar Area */}
        <div className={styles.sidePanel}>
          {/* Gene Detail Panel */}
          <section className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailGeneName}>{selectedGene.gene}</h3>
              <span className={styles.categoryTag}>{selectedGene.category}</span>
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
                <span className={styles.alertIcon}>⚠️</span>
                <span>Immediate clinical review recommended.</span>
              </div>
            )}
            
            <button className={styles.actionButton}>Explore in 3D Viewer &rarr;</button>
          </section>

          {/* Mutation Heatmap */}
          <section className={styles.heatmapCard}>
            <h3 className={styles.cardTitle}>Chromosome Heatmap</h3>
            <p className={styles.heatmapDesc}>Visual representation of mutation intensity across the genome.</p>
            
            <div className={styles.heatmapGrid}>
              {HEATMAP_DATA.map((val, i) => (
                <div 
                  key={i} 
                  className={`${styles.heatCell} ${styles[`heat_${val}`]}`}
                  title={`Locus ${i}: ${val} intensity`}
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
