"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

const RISK_COLOR: Record<string, string> = {
  high:   "var(--gn-danger)",
  medium: "var(--gn-warning)",
  low:    "var(--gn-success)",
};

const TREND_ICON: Record<string, string> = { increasing: "↗", stable: "→", decreasing: "↘" };
const TREND_LABEL: Record<string, string> = { increasing: "Rising", stable: "Stable", decreasing: "Declining" };

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{ fileName: string; matchPct: number; mutationCount: number } | null>(null);
  const [showPreventionPlan, setShowPreventionPlan] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportToReport = async () => {
    if (!selected || exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/dashboard/reports";
      } else {
        alert("Failed to export report");
      }
    } catch (err) {
      console.error(err);
      alert("Error exporting report");
    } finally {
      setExporting(false);
    }
  };

  const getPreventionPlan = (selectedPrediction: any, allPredictions: any[]) => {
    const diseaseName = selectedPrediction.disease.toLowerCase();
    const isCovid = diseaseName.includes("covid");
    const isHiv = diseaseName.includes("hiv");
    const isBrca = diseaseName.includes("breast") || diseaseName.includes("ovarian") || diseaseName.includes("brca") || diseaseName.includes("prostate") || diseaseName.includes("pancreatic");
    const isResistance = diseaseName.includes("resistance");
    const isEvasion = diseaseName.includes("evasion");

    // Determine if the patient has a significant drug resistance profile
    const hasDrugResistance = allPredictions.some(p => p.disease.toLowerCase().includes("resistance") && p.risk >= 40);

    if (isResistance) {
      return [
        { title: "Medication Adjustment", content: "Standard front-line treatments are likely to fail. Consult an infectious disease specialist immediately to select an alternative therapy regimen." },
        { title: "Transmission Warning", content: "You are carrying a drug-resistant strain. It is critical to isolate to prevent spreading a difficult-to-treat variant to others." },
        { title: "Continuous Monitoring", content: "Viral load must be closely monitored to ensure the alternative therapy is effective." }
      ];
    }

    if (isEvasion) {
      return [
        { title: "Vaccine Efficacy Alert", content: "This variant has mutations associated with immune evasion. Previous immunity from past infection or standard vaccines may provide reduced protection." },
        { title: "Heightened Precautions", content: "Employ strict non-pharmaceutical interventions (e.g., N95 masks, distancing) regardless of your vaccination status." }
      ];
    }
    
    if (isCovid) {
      return [
        { title: "Immediate Action", content: "Isolate immediately to prevent transmission. Contact healthcare provider for diagnostic confirmation." },
        { title: "Medical Intervention", content: hasDrugResistance 
            ? "⚠️ WARNING: Drug resistance detected. Standard antivirals like Paxlovid may be ineffective. Alternative treatments must be carefully evaluated by your doctor based on this mutation profile."
            : "No known resistance markers detected. Standard antiviral treatments like Paxlovid may be highly effective if prescribed early. Monitor oxygen saturation." },
        { title: "Prevention Protocol", content: "Wear N95 masks indoors, ensure proper ventilation, and inform recent close contacts." }
      ];
    } else if (isHiv) {
      return [
        { title: "Immediate Action", content: "Schedule an appointment with an infectious disease specialist immediately for confirmatory viral load testing." },
        { title: "Medical Intervention", content: hasDrugResistance
            ? "⚠️ WARNING: Drug resistance detected. Standard first-line Antiretroviral Therapy (ART) may fail. A customized ART regimen must be constructed based on this exact resistance profile."
            : "No major resistance markers detected. Initiate standard first-line Antiretroviral Therapy (ART) as soon as possible for maximum efficacy." },
        { title: "Prevention Protocol", content: "Practice safe sex, do not share needles, and inform partners so they can seek testing and PEP/PrEP if necessary." }
      ];
    } else if (isBrca) {
      return [
        { title: "Genetic Counseling", content: "Schedule a consultation with a board-certified genetic counselor to discuss these findings and family history implications." },
        { title: "Enhanced Screening", content: "Discuss initiating early and enhanced screening protocols, such as annual MRIs and specialized ultrasounds, depending on your age and risk severity." },
        { title: "Risk-Reducing Strategies", content: "Consult with an oncologist regarding risk-reducing options, which may include chemoprevention or prophylactic surgeries, tailored to your specific mutation profile." }
      ];
    } else {
      return [
        { title: "Clinical Next Steps", content: "Schedule a follow-up with your primary care physician to review these AI predictions and conduct confirmatory laboratory testing." },
        { title: "Monitoring", content: "Monitor for any symptoms related to this condition and keep a daily log to share with your doctor." }
      ];
    }
  };

  useEffect(() => {
    async function loadPredictions() {
      try {
        const res = await fetch("/api/predictions");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load predictions");
        setPredictions(data.predictions || []);
        if (data.meta) setMeta(data.meta);
        if (data.predictions?.length > 0) setSelected(data.predictions[0]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPredictions();
  }, []);

  if (loading) {
    return (
      <div className={styles.container} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh'}}>
        <div style={{width: 60, height: 60, border: '4px solid rgba(16, 185, 129, 0.1)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
        <h2 style={{marginTop: '2rem', color: '#10b981', letterSpacing: '0.1em'}}>COMPUTING AI RISK SCORES...</h2>
        <p style={{color: '#888', marginTop: '0.5rem'}}>Running variants against heuristic neural network models</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || predictions.length === 0) {
    return (
      <div className={styles.container} style={{padding: '5rem', textAlign: 'center'}}>
        <h2 style={{color: 'var(--gn-warning)'}}>No Predictions Available</h2>
        <p style={{color: '#888', marginTop: '1rem', marginBottom: '2rem'}}>
          {error || "We need a completed genome analysis to generate disease predictions. Please upload and analyze DNA first."}
        </p>
        <a href="/dashboard/upload" style={{display: 'inline-block', padding: '1rem 2rem', background: 'var(--gn-primary)', color: 'black', fontWeight: 'bold', borderRadius: '8px', textDecoration: 'none'}}>
          Go to Upload Station
        </a>
      </div>
    );
  }

  const riskColor = RISK_COLOR[selected?.severity || "low"];
  const circumference = 2 * Math.PI * 40; // r=40

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>🤖 AI Copilot · Pathogenic Modelling</div>
          <h1 className={styles.title}>AI Disease Predictions</h1>
          <p className={styles.subtitle}>Pathogenic risk modelling based on sequence analysis and multi-cohort benchmarking. Click any card to view a detailed explanation.</p>
          {meta && (
            <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
              <span>📄 <strong style={{ color: 'var(--gn-primary)' }}>{meta.fileName}</strong></span>
              <span style={{ color: '#888' }}>·</span>
              <span>🔗 <strong style={{ color: 'var(--gn-blue)' }}>{meta.matchPct}% match</strong> to reference</span>
              <span style={{ color: '#888' }}>·</span>
              <span>🧬 <strong style={{ color: 'var(--gn-warning)' }}>{meta.mutationCount}</strong> variants analysed</span>
            </div>
          )}
        </div>
      </header>

      <div className={styles.layout}>
        {/* ── Risk Cards ── */}
        <div className={styles.cardsCol}>
          <p className={styles.colLabel}>Risk Models — {predictions.length} conditions screened</p>
          {predictions.map((pred) => {
            const color = RISK_COLOR[pred.severity];
            const isSelected = selected.id === pred.id;
            return (
              <div
                key={pred.id}
                className={`${styles.riskCard} ${isSelected ? styles.cardActive : ""}`}
                onClick={() => setSelected(pred)}
                style={isSelected ? { borderColor: color } : {}}
              >
                <div className={styles.cardTop}>
                  <div className={styles.diseaseInfo}>
                    <h3 className={styles.diseaseName}>{pred.disease}</h3>
                    <p className={styles.diseaseGenes}>Genes: <code>{pred.genes}</code></p>
                  </div>
                  <span className={`${styles.riskBadge} ${styles[`badge_${pred.severity}`]}`}>
                    {pred.risk}%
                  </span>
                </div>

                <div className={styles.riskBarTrack}>
                  <div
                    className={styles.riskBarFill}
                    style={{ width: `${pred.risk}%`, background: color }}
                  />
                </div>

                <div className={styles.cardMeta}>
                  <span className={styles.metaItem}>
                    <span className={styles.metaLabel}>Confidence</span>
                    <strong style={{ color }}>{pred.confidence}%</strong>
                  </span>
                  <span className={styles.metaItem}>
                    <span className={styles.metaLabel}>Trend</span>
                    <strong className={pred.trend === "increasing" ? styles.trendRising : styles.trendStable}>
                      {TREND_ICON[pred.trend]} {TREND_LABEL[pred.trend]}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Insight Panel ── */}
        <aside className={styles.insightPanel}>
          <h2 className={styles.insightTitle}>{selected.disease}</h2>

          {/* SVG Ring Chart */}
          <div className={styles.ringWrapper}>
            <svg viewBox="0 0 100 100" className={styles.ringChart}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gn-border-light-strong)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={riskColor}
                strokeWidth="8"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                strokeDasharray={`${(selected.risk / 100) * circumference} ${circumference}`}
                strokeDashoffset="0"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
              <text x="50" y="45" textAnchor="middle" dominantBaseline="middle" className={styles.ringPercent}>{selected.risk}%</text>
              <text x="50" y="66" textAnchor="middle" dominantBaseline="middle" className={styles.ringLabel}>Risk</text>
            </svg>
          </div>

          <div className={styles.insightMeta}>
            <div className={styles.metaChip} style={{ borderColor: `${riskColor}30`, background: `${riskColor}10` }}>
              <span style={{ color: riskColor }}>● {selected.severity.charAt(0).toUpperCase() + selected.severity.slice(1)} Risk</span>
            </div>
            <div className={styles.metaChip}>
              <span style={{ color: selected.confidence >= 90 ? "var(--gn-success)" : "var(--gn-warning)" }}>
                🎯 {selected.confidence}% Confidence
              </span>
            </div>
            <div className={styles.metaChip}>
              <span className={selected.trend === "increasing" ? styles.trendRising : styles.trendStable}>
                {TREND_ICON[selected.trend]} {TREND_LABEL[selected.trend]}
              </span>
            </div>
          </div>

          <div className={styles.insightGenes}>
            <p className={styles.smallLabel}>Contributing Genes</p>
            <div className={styles.geneChips}>
              {selected.genes.split(", ").map((g: string) => (
                <code key={g} className={styles.geneCode}>{g}</code>
              ))}
            </div>
          </div>

          <div className={styles.insightExplanation}>
            <p className={styles.smallLabel}>Clinical Explanation</p>
            <p className={styles.explanationText}>{selected.insight}</p>
          </div>

          <div className={styles.insightActions}>
            <button className={styles.primaryAction} onClick={() => setShowPreventionPlan(true)}>Generate Prevention Plan</button>
            <button 
              className={styles.secondaryAction} 
              onClick={exportToReport} 
              disabled={exporting}
              style={{ opacity: exporting ? 0.7 : 1, cursor: exporting ? 'not-allowed' : 'pointer' }}
            >
              {exporting ? "Exporting..." : "Export to Report"}
            </button>
          </div>
        </aside>
      </div>

      {/* ── Prevention Plan Modal ── */}
      {showPreventionPlan && selected && (
        <div className={styles.modalOverlay} onClick={() => setShowPreventionPlan(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Clinical Prevention Plan</h3>
              <button className={styles.closeButton} onClick={() => setShowPreventionPlan(false)}>×</button>
            </div>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ color: "var(--gn-text-secondary)", fontSize: "0.95rem" }}>
                Based on the AI prediction for <strong>{selected.disease}</strong>, here are the recommended next steps:
              </p>
            </div>

            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "0.5rem" }}>
              {getPreventionPlan(selected, predictions).map((section: any, idx: number) => (
                <div key={idx} className={styles.planSection}>
                  <h4>{section.title}</h4>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowPreventionPlan(false)}
                style={{ background: "var(--gn-primary)", color: "#000", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
