"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

const LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"];

type AlertStat = { label: string; value: string; color: string };

type OutbreakData = {
  historical_points: number[];
  future_points: number[];
  alert_stats: AlertStat[];
};

function mkPoints(vals: number[], startIdx: number, w: number, h: number, max: number) {
  const pad = 20, uw = w - pad * 2, uh = h - pad * 2, xStep = uw / (LABELS.length - 1);
  return vals.map((v, i) => ({ x: pad + (startIdx + i) * xStep, y: h - pad - (v / max) * uh }));
}

function pts(arr: { x: number; y: number }[]) { return arr.map((p) => `${p.x},${p.y}`).join(" "); }

export default function OutbreakPage() {
  const [country, setCountry]  = useState("Global");
  const [disease, setDisease]  = useState("Influenza Strain A");
  const [horizon, setHorizon]  = useState("1 Year");
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OutbreakData>({
    historical_points: [12, 18, 25, 32, 45, 58, 65],
    future_points: [78, 92, 110, 135],
    alert_stats: [
      { label: "Projected Rise", value: "45%", color: "var(--gn-danger)" },
      { label: "Active Regions", value: "12", color: "var(--gn-warning)" },
      { label: "Sequences Tracked", value: "3,421", color: "var(--gn-primary)" },
      { label: "R₀ Estimate", value: "2.4", color: "var(--gn-warning)" },
    ]
  });
  const [deploying, setDeploying] = useState(false);

  // Fetch AI Prediction Data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/outbreak?region=${encodeURIComponent(country)}&pathogen=${encodeURIComponent(disease)}&horizon=${encodeURIComponent(horizon)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch outbreak data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [country, disease, horizon]);

  const handleDeployProtocol = async () => {
    if (deploying) return;
    setDeploying(true);
    try {
      const res = await fetch("/api/outbreak/protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: country, pathogen: disease })
      });
      if (res.ok) {
        alert("🚨 Response Protocol Deployed! All relevant teams have been notified.");
      } else {
        alert("Failed to deploy protocol. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deploying protocol.");
    } finally {
      setDeploying(false);
    }
  };

  const W = 800, H = 280, MAX = 150;
  const pastPts = mkPoints(data.historical_points, 0, W, H, MAX);
  const futPts  = mkPoints(data.future_points, data.historical_points.length - 1, W, H, MAX);
  const joinedFuture = pastPts.length > 0 ? [pastPts[pastPts.length - 1], ...futPts.slice(1)] : futPts;

  const pastStr   = pts(pastPts);
  const futureStr = pts(joinedFuture);
  const fillArea  = `${pastStr} ${futureStr.split(" ").reverse().join(" ")} ${W - 20},${H - 20} 20,${H - 20}`;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>🗺️ Epidemiological Intelligence</div>
          <h1 className={styles.title}>Global Outbreak Prediction</h1>
          <p className={styles.subtitle}>AI-driven transmission forecasting based on genomic surveillance, mobility patterns, and variant tracking.</p>
        </div>
        <button className={styles.deployBtn} onClick={handleDeployProtocol} disabled={deploying}>
          {deploying ? "Deploying..." : "🚨 Deploy Response Protocol"}
        </button>
      </header>

      {/* Alert Banner */}
      <div className={styles.alertPanel}>
        <div className={styles.alertLeft}>
          <div className={styles.alertIconBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <h3>Outbreak Risk Increasing — Immediate Monitoring Advised</h3>
            <p>Predictive model anticipates a <strong>45% surge</strong> in {disease} cases across {country} in the next 3 months.</p>
          </div>
        </div>
        <div className={styles.alertStats}>
          {data.alert_stats.map((s) => (
            <div key={s.label} className={styles.alertStat}>
              <span style={{ color: s.color, fontWeight: 700, fontSize: "1.15rem" }}>{s.value}</span>
              <span className={styles.alertStatLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        {[
          { label: "Region", value: country, set: setCountry, opts: ["Global","North America","Europe","Asia Pacific","Africa"] },
          { label: "Pathogen", value: disease, set: setDisease, opts: ["Influenza Strain A","SARS-CoV-2 Variant X","Ebola Zaire","RSV-B"] },
          { label: "Time Horizon", value: horizon, set: setHorizon, opts: ["6 Months","1 Year","5 Years"] },
        ].map((f) => (
          <div key={f.label} className={styles.filterGroup}>
            <label className={styles.filterLabel}>{f.label}</label>
            <select className={styles.filterSelect} value={f.value} onChange={(e) => f.set(e.target.value)}>
              {f.opts.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Transmission Velocity Forecast</h3>
            <p className={styles.chartSubtitle}>{country} · {disease} · {horizon}</p>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={styles.dotPast} /> Historical</span>
            <span className={styles.legendItem}><span className={styles.dotFuture} /> AI Forecast</span>
          </div>
        </div>

        <div className={styles.svgWrapper} style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.3s" }}>
          {loading && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--gn-primary)" }}>
              AI Generating Forecast...
            </div>
          )}
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg}>
            <defs>
              <linearGradient id="pastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gn-primary)" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="var(--gn-primary)" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="futFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gn-danger)" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="var(--gn-danger)" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <line key={i} x1={20} y1={H - 20 - (H - 40) * p} x2={W - 20} y2={H - 20 - (H - 40) * p} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            ))}

            {/* Forecast zone */}
            <rect x={pastPts[pastPts.length - 1].x} y={20} width={W - 20 - pastPts[pastPts.length - 1].x} height={H - 40} fill="rgba(244,63,94,0.04)" rx="4"/>

            {/* Past line */}
            <polyline points={pastStr} fill="none" stroke="var(--gn-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Future line (dashed) */}
            <polyline points={futureStr} fill="none" stroke="var(--gn-danger)" strokeWidth="2.5" strokeDasharray="8 4" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Dots */}
            {pastPts.map((p, i) => <circle key={`p${i}`} cx={p.x} cy={p.y} r="5" fill="var(--gn-bg)" stroke="var(--gn-primary)" strokeWidth="2"/>)}
            {joinedFuture.slice(1).map((p, i) => <circle key={`f${i}`} cx={p.x} cy={p.y} r="5" fill="var(--gn-bg)" stroke="var(--gn-danger)" strokeWidth="2"/>)}
          </svg>
          <div className={styles.xLabels}>
            {LABELS.map((l) => <span key={l}>{l}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
