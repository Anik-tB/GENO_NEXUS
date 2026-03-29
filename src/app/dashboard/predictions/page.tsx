"use client";

import { useState } from "react";
import styles from "./page.module.css";

const PREDICTIONS = [
  {
    id: "p1",
    disease: "Type 2 Diabetes",
    risk: 78,
    confidence: 94,
    trend: "increasing",
    severity: "high",
    insight: "High likelihood due to combined mutations in TCF7L2 and KCNQ1. Lifestyle intervention heavily recommended to delay onset."
  },
  {
    id: "p2",
    disease: "Coronary Artery Disease",
    risk: 62,
    confidence: 88,
    trend: "stable",
    severity: "medium",
    insight: "Moderate genetic predisposition. Monitor lipid panels closely; standard statin therapy is projected to be highly effective."
  },
  {
    id: "p3",
    disease: "Breast Cancer (BRCA-related)",
    risk: 15,
    confidence: 99,
    trend: "stable",
    severity: "low",
    insight: "Low likelihood. No pathogenic variants detected in BRCA1/BRCA2 footprint."
  },
  {
    id: "p4",
    disease: "Late-Onset Alzheimer's",
    risk: 45,
    confidence: 82,
    trend: "increasing",
    severity: "medium",
    insight: "Heterozygous APOE e4 carrier status detected. Elevated risk compared to baseline population, but not deterministic."
  }
];

export default function PredictionsPage() {
  const [selectedPrediction, setSelectedPrediction] = useState(PREDICTIONS[0]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Disease Predictions</h1>
        <p className={styles.subtitle}>Pathogenic risk modeling based on sequence analysis and cohort benchmarking.</p>
      </header>

      <div className={styles.layout}>
        {/* Risk Cards Grid */}
        <div className={styles.cardsGrid}>
          {PREDICTIONS.map(pred => (
            <div 
              key={pred.id} 
              className={`${styles.riskCard} ${selectedPrediction.id === pred.id ? styles.cardActive : ""}`}
              onClick={() => setSelectedPrediction(pred)}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.diseaseName}>{pred.disease}</h3>
                <span className={`${styles.riskBadge} ${styles[`badge_${pred.severity}`]}`}>
                  {pred.risk}% Risk
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>AI Confidence</span>
                  <span className={styles.metricValue}>{pred.confidence}%</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Trend</span>
                  <span className={styles.metricValue}>
                    {pred.trend === "increasing" ? "↗ Rising" : "→ Stable"}
                  </span>
                </div>
              </div>

              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: `${pred.risk}%`,
                    background: pred.risk > 70 ? 'var(--gn-danger)' : pred.risk > 40 ? 'var(--gn-warning)' : 'var(--gn-success)'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insight Panel */}
        <aside className={styles.insightPanel}>
          <div className={styles.insightHeader}>
            <span className={styles.aiIcon}>🤖</span>
            <h2>Copilot Insight</h2>
          </div>

          <div className={styles.insightContent}>
            <h3 className={styles.insightTitle}>{selectedPrediction.disease}</h3>
            
            <div className={styles.scoreCircle}>
              <svg viewBox="0 0 36 36" className={styles.circularChart}>
                <path
                  className={styles.circleBg}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={styles.circle}
                  strokeDasharray={`${selectedPrediction.risk}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{
                    stroke: selectedPrediction.risk > 70 ? 'var(--gn-danger)' : selectedPrediction.risk > 40 ? 'var(--gn-warning)' : 'var(--gn-success)'
                  }}
                />
                <text x="18" y="20.35" className={styles.percentage}>{selectedPrediction.risk}%</text>
              </svg>
            </div>

            <div className={styles.insightTextWrapper}>
              <h4>Clinical Explanation:</h4>
              <p>{selectedPrediction.insight}</p>
            </div>

            <div className={styles.aiConfidenceBadge}>
              <strong>{selectedPrediction.confidence}%</strong> Model Confidence
            </div>
            
            <div className={styles.actions}>
              <button className={styles.primaryAction}>Generate Prevention Plan</button>
              <button className={styles.secondaryAction}>View Contributing Genes</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
