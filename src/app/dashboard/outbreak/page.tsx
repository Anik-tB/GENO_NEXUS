"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

const LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"];

type AlertStat = { label: string; value: string; color: string };

type OutbreakData = {
  historical_points: number[];
  future_points: number[];
  future_points_lower: number[];
  future_points_upper: number[];
  alert_stats: AlertStat[];
};

function mkPoints(vals: number[], startIdx: number, w: number, h: number, max: number, numLabels: number) {
  const pad = 20, uw = w - pad * 2, uh = h - pad * 2, xStep = uw / (numLabels - 1);
  return vals.map((v, i) => ({ x: pad + (startIdx + i) * xStep, y: h - pad - (v / max) * uh }));
}

function pts(arr: { x: number; y: number }[]) { return arr.map((p) => `${p.x},${p.y}`).join(" "); }

export default function OutbreakPage() {
  const [country, setCountry]  = useState("Global");
  const [disease, setDisease]  = useState("COVID-19");
  const [horizon, setHorizon]  = useState("6 Months");
  
  const isHiv = disease === "HIV";
  // currentLabels will be generated dynamically below


  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OutbreakData>({
    historical_points: [12, 18, 25, 32, 45, 58, 65],
    future_points: [78, 92, 110, 135],
    future_points_lower: [70, 80, 92, 108],
    future_points_upper: [88, 108, 132, 165],
    alert_stats: [
      { label: "Projected Rise", value: "45%", color: "var(--gn-danger)" },
      { label: "Active Regions", value: "12", color: "var(--gn-warning)" },
      { label: "Sequences Tracked", value: "3,421", color: "var(--gn-primary)" },
      { label: "R₀ Estimate", value: "2.4", color: "var(--gn-warning)" },
    ]
  });
  const [deploying, setDeploying] = useState(false);

  // Fetch ML Prediction Data
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

  const W = 800, H = 280;
  const maxVal = Math.max(
    ...(data.historical_points.length > 0 ? data.historical_points : [0]),
    ...(data.future_points.length > 0 ? data.future_points : [0]),
    ...(data.future_points_upper && data.future_points_upper.length > 0 ? data.future_points_upper : [0])
  );
  const MAX = Math.max(150, maxVal * 1.2);

  const totalPoints = data.historical_points.length + data.future_points.length;
  const currentLabels: string[] = [];
  if (isHiv) {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - data.historical_points.length + 1;
    for (let i = 0; i < totalPoints; i++) {
      const yr = startYear + i;
      if (totalPoints > 15) {
        currentLabels.push(yr % 5 === 0 ? yr.toString() : "");
      } else {
        currentLabels.push(yr.toString());
      }
    }
  } else {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    let startMonth = currentMonth - data.historical_points.length + 1;
    for (let i = 0; i < totalPoints; i++) {
      let m = (startMonth + i) % 12;
      if (m < 0) m += 12;
      if (totalPoints > 24) {
        currentLabels.push(i % 12 === 0 ? `Year ${Math.floor(i/12)}` : "");
      } else {
        currentLabels.push(monthNames[m]);
      }
    }
  }

  const pastPts   = mkPoints(data.historical_points, 0, W, H, MAX, currentLabels.length);
  const futPts    = mkPoints(data.future_points, data.historical_points.length - 1, W, H, MAX, currentLabels.length);
  const joinedFuture = pastPts.length > 0 ? [pastPts[pastPts.length - 1], ...futPts.slice(1)] : futPts;

  // 95% CI bounds
  const ciLower   = data.future_points_lower && data.future_points_lower.length > 0
    ? mkPoints(data.future_points_lower, data.historical_points.length - 1, W, H, MAX, currentLabels.length)
    : [];
  const ciUpper   = data.future_points_upper && data.future_points_upper.length > 0
    ? mkPoints(data.future_points_upper, data.historical_points.length - 1, W, H, MAX, currentLabels.length)
    : [];

  // Build a closed SVG polygon path for the shaded CI band
  let ciPolygonPoints = "";
  if (ciLower.length > 0 && ciUpper.length > 0 && pastPts.length > 0) {
    const startPt = pastPts[pastPts.length - 1];
    const upperPts = [startPt, ...ciUpper.slice(1)];
    const lowerPts = [startPt, ...ciLower.slice(1)];
    const upperStr = upperPts.map(p => `${p.x},${p.y}`).join(" ");
    const lowerStr = lowerPts.map(p => `${p.x},${p.y}`).join(" ");
    ciPolygonPoints = `${upperStr} ${lowerStr.split(" ").reverse().join(" ")}`;
  }

  const pastStr   = pts(pastPts);
  const futureStr = pts(joinedFuture);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>🗺️ Epidemiological Intelligence</div>
          <h1 className={styles.title}>Global Outbreak Prediction</h1>
          <p className={styles.subtitle}>Machine Learning-driven transmission forecasting based on genomic surveillance, mobility patterns, and variant tracking.</p>
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
          { label: "Region", value: country, set: setCountry, opts: ["Global","Bangladesh","USA","UK","India","Brazil","Italy"] },
          { label: "Pathogen", value: disease, set: setDisease, opts: ["COVID-19","HIV"] },
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
            <span className={styles.legendItem}><span className={styles.dotFuture} /> ML Forecast</span>
            <span className={styles.legendItem}>
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "rgba(244,63,94,0.25)", border: "1px solid rgba(244,63,94,0.5)", marginRight: 4, verticalAlign: "middle" }} />
              95% CI
            </span>
          </div>
        </div>

        <div className={styles.svgWrapper} style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.3s" }}>
          {loading && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--gn-primary)" }}>
              ML Generating Forecast...
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

            {/* Forecast zone (subtle background tint) */}
            {pastPts.length > 0 && (
              <rect x={pastPts[pastPts.length - 1].x} y={20} width={W - 20 - pastPts[pastPts.length - 1].x} height={H - 40} fill="rgba(244,63,94,0.02)" rx="4"/>
            )}

            {/* 95% Bootstrap Confidence Interval shaded band */}
            {ciPolygonPoints && (
              <polygon
                points={ciPolygonPoints}
                fill="rgba(244,63,94,0.12)"
                stroke="rgba(244,63,94,0.25)"
                strokeWidth="0.5"
                strokeDasharray="4 3"
              />
            )}

            {/* Past line */}
            <polyline points={pastStr} fill="none" stroke="var(--gn-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Future line (dashed) */}
            <polyline points={futureStr} fill="none" stroke="var(--gn-danger)" strokeWidth="2.5" strokeDasharray="8 4" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Dots */}
            {pastPts.map((p, i) => <circle key={`p${i}`} cx={p.x} cy={p.y} r="5" fill="var(--gn-bg)" stroke="var(--gn-primary)" strokeWidth="2"/>)}
            {joinedFuture.slice(1).map((p, i) => <circle key={`f${i}`} cx={p.x} cy={p.y} r="5" fill="var(--gn-bg)" stroke="var(--gn-danger)" strokeWidth="2"/>)}
          </svg>
          <div className={styles.xLabels}>
            {currentLabels.map((l, idx) => <span key={`lbl-${idx}`}>{l}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
