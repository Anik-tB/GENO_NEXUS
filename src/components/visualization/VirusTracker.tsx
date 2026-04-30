"use client";

import { useState, useEffect } from "react";
import styles from "./VirusTracker.module.css";

const OUTBREAKS = [
  { id: "na", label: "North America", x: "18%", y: "32%", severity: 3, variant: "Alpha", cases: 142000 },
  { id: "eu", label: "Europe", x: "45%", y: "27%", severity: 4, variant: "Delta", cases: 287000 },
  { id: "sa", label: "South America", x: "26%", y: "58%", severity: 2, variant: "Gamma", cases: 83000 },
  { id: "af", label: "Africa", x: "48%", y: "52%", severity: 2, variant: "Beta", cases: 61000 },
  { id: "as", label: "South Asia", x: "65%", y: "42%", severity: 5, variant: "Omicron", cases: 412000 },
  { id: "sea", label: "SE Asia", x: "74%", y: "50%", severity: 3, variant: "Lambda", cases: 115000 },
  { id: "me", label: "Middle East", x: "57%", y: "38%", severity: 2, variant: "Mu", cases: 44000 },
];

const MUTATION_FEED = [
  { time: "00:12", label: "Omicron BA.2.75.2 — spike S:R346T detected", severity: "high" },
  { time: "00:09", label: "Delta AY.4.2 — increased transmissibility flagged", severity: "high" },
  { time: "00:07", label: "Alpha B.1.1.7 — neutralizing antibody escape +12%", severity: "med" },
  { time: "00:04", label: "Beta B.1.351 — E484K reversion observed", severity: "low" },
  { time: "00:02", label: "Gamma P.1 — ACE2 binding affinity stable", severity: "low" },
];

const CHART_DATA = [42, 61, 88, 115, 142, 187, 224, 287, 341, 412, 387, 312];
const CHART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function severityColor(s: number) {
  if (s >= 5) return "var(--gn-danger)";
  if (s >= 4) return "#f97316";
  if (s >= 3) return "var(--gn-warning)";
  return "var(--gn-success)";
}

export function VirusTracker() {
  const [selected, setSelected] = useState<(typeof OUTBREAKS)[0] | null>(null);
  const [timeIdx, setTimeIdx] = useState(11);
  const [feedItems, setFeedItems] = useState(MUTATION_FEED);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setFeedItems((prev) => {
        const entry = {
          time: "Live",
          label: `Variant update — sequence position ${Math.floor(Math.random() * 29000) + 1000} analyzed`,
          severity: ["low", "med", "high"][Math.floor(Math.random() * 3)],
        };
        return [entry, ...prev.slice(0, 7)];
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const maxVal = Math.max(...CHART_DATA);

  return (
    <div className={styles.wrapper}>
      {/* Map */}
      <div className={styles.mapArea}>
        <div className={styles.mapHeader}>
          <span className={styles.mapTitle}>🌍 Global Outbreak Map</span>
          <span className={styles.liveTag}><span className={styles.liveDot} />Live Tracking</span>
        </div>
        <div className={styles.mapContainer}>
          {/* Stylized SVG World Map */}
          <svg className={styles.worldMap} viewBox="0 0 900 450" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Grid lines */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 50} x2="900" y2={i * 50} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}
            {Array.from({ length: 19 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="450" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}
            {/* Continents - stylized polygons */}
            {/* North America */}
            <path d="M80,60 L200,50 L230,120 L200,200 L150,220 L100,180 L60,140 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            {/* South America */}
            <path d="M160,240 L230,230 L250,320 L220,390 L170,400 L140,340 L130,270 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            {/* Europe */}
            <path d="M370,40 L460,35 L480,80 L450,120 L400,130 L360,100 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            {/* Africa */}
            <path d="M380,140 L460,130 L490,230 L460,340 L400,350 L360,260 L350,180 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            {/* Middle East / Asia */}
            <path d="M480,80 L620,70 L680,120 L700,180 L650,200 L580,190 L500,160 L470,120 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            {/* SE Asia */}
            <path d="M620,180 L700,160 L740,220 L720,280 L670,270 L630,240 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            {/* Australia */}
            <path d="M680,290 L780,280 L800,350 L760,390 L700,380 L670,340 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          </svg>

          {/* Outbreak markers */}
          {OUTBREAKS.map((o) => (
            <button
              key={o.id}
              className={`${styles.outbreakMarker} ${selected?.id === o.id ? styles.markerSelected : ""}`}
              style={{ left: o.x, top: o.y, "--color": severityColor(o.severity) } as React.CSSProperties}
              onClick={() => setSelected(selected?.id === o.id ? null : o)}
              title={o.label}
            >
              <span className={styles.markerPulse} style={{ background: severityColor(o.severity) }} />
              <span className={styles.markerCore} style={{ background: severityColor(o.severity) }} />
            </button>
          ))}

          {/* Selected popup */}
          {selected && (
            <div className={styles.popup} style={{ left: selected.x, top: selected.y }}>
              <button className={styles.popupClose} onClick={() => setSelected(null)}>✕</button>
              <p className={styles.popupRegion}>{selected.label}</p>
              <p className={styles.popupVariant} style={{ color: severityColor(selected.severity) }}>{selected.variant} Variant</p>
              <p className={styles.popupCases}>{selected.cases.toLocaleString()} active cases</p>
              <div className={styles.popupSeverity}>
                Severity: {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={styles.severityDot} style={{ background: i < selected.severity ? severityColor(selected.severity) : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom panels */}
      <div className={styles.bottomRow}>
        {/* Chart */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>📈 Cases Over Time — {CHART_MONTHS[timeIdx]}</span>
          </div>
          <div className={styles.chartArea}>
            {CHART_DATA.slice(0, timeIdx + 1).map((val, i) => (
              <div key={i} className={styles.bar} style={{ height: `${(val / maxVal) * 100}%`, background: i === timeIdx ? "var(--gn-danger)" : "var(--gn-primary)", opacity: i === timeIdx ? 1 : 0.5 + (i / (timeIdx + 1)) * 0.4 }} title={`${CHART_MONTHS[i]}: ${val.toLocaleString()}k`} />
            ))}
          </div>
          <input type="range" min={0} max={11} value={timeIdx} onChange={(e) => setTimeIdx(Number(e.target.value))} className={styles.timeSlider} />
          <div className={styles.chartMonths}>
            {CHART_MONTHS.slice(0, timeIdx + 1).map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Mutation Feed */}
        <div className={styles.feedPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>⚡ Live Mutation Feed</span>
            <span className={styles.liveDot} />
          </div>
          <div className={styles.feedList}>
            {feedItems.map((item, i) => (
              <div key={i} className={`${styles.feedItem} ${i === 0 ? styles.feedItemNew : ""}`}>
                <span className={styles.feedDot} style={{ background: item.severity === "high" ? "var(--gn-danger)" : item.severity === "med" ? "var(--gn-warning)" : "var(--gn-success)" }} />
                <div className={styles.feedContent}>
                  <span className={styles.feedText}>{item.label}</span>
                  <span className={styles.feedTime}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
