"use client";

import { useState } from "react";
import styles from "./page.module.css";

const OUTBREAK_PAST = [12, 18, 25, 32, 45, 58, 65];
const OUTBREAK_FUTURE = [78, 92, 110, 135];
const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

function generatePoints(values: number[], startIdx: number, width: number, height: number, maxVal: number) {
  const padding = 20;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const xStep = usableWidth / (LABELS.length - 1);
  
  return values.map((val, idx) => {
    const x = padding + (startIdx + idx) * xStep;
    const y = height - padding - (val / maxVal) * usableHeight;
    return { x, y };
  });
}

function toPointString(points: {x: number, y: number}[]) {
  return points.map(p => `${p.x},${p.y}`).join(" ");
}

export default function OutbreakPage() {
  const [filterCountry, setFilterCountry] = useState("Global");
  const [filterDisease, setFilterDisease] = useState("Influenza Strain A");
  const [filterTime, setFilterTime] = useState("1 Year");

  const width = 800;
  const height = 300;
  const maxVal = 150; // Max outbreak scale

  const pastPoints = generatePoints(OUTBREAK_PAST, 0, width, height, maxVal);
  const futurePoints = generatePoints(OUTBREAK_FUTURE, OUTBREAK_PAST.length - 1, width, height, maxVal);
  
  // Future points includes the last past point to connect them seamlessly
  const joinedFuturePoints = [pastPoints[pastPoints.length - 1], ...futurePoints.slice(1)];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Global Outbreak Prediction</h1>
        <p className={styles.subtitle}>AI-driven epidemiological forecasting based on genomic surveillance.</p>
      </header>

      {/* Alert System */}
      <div className={styles.alertPanel}>
        <div className={styles.alertIcon}>⚠️</div>
        <div className={styles.alertContent}>
          <h3>Outbreak Risk Increasing</h3>
          <p>
            The predictive model anticipates a sharp <strong>45% rise</strong> in {filterDisease} 
            cases across the {filterCountry} region over the next 3 months.
          </p>
        </div>
        <button className={styles.alertAction}>Deploy Protocols</button>
      </div>

      {/* Filters */}
      <div className={styles.filtersGroup}>
        <div className={styles.filterControl}>
          <label>Region</label>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
            <option>Global</option>
            <option>North America</option>
            <option>Europe</option>
            <option>Asia Pacific</option>
          </select>
        </div>
        <div className={styles.filterControl}>
          <label>Pathogen Target</label>
          <select value={filterDisease} onChange={e => setFilterDisease(e.target.value)}>
            <option>Influenza Strain A</option>
            <option>SARS-CoV-2 Variant X</option>
            <option>Ebola Zaire</option>
          </select>
        </div>
        <div className={styles.filterControl}>
          <label>Time Horizon</label>
          <select value={filterTime} onChange={e => setFilterTime(e.target.value)}>
            <option>6 Months</option>
            <option>1 Year</option>
            <option>5 Years</option>
          </select>
        </div>
      </div>

      {/* Graph Area */}
      <div className={styles.graphCard}>
        <div className={styles.graphHeader}>
          <h3>Transmission Velocity Forecast</h3>
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={styles.dotPast}/> Historical Data</span>
            <span className={styles.legendItem}><span className={styles.dotFuture}/> AI Prediction</span>
          </div>
        </div>

        <div className={styles.svgContainer}>
          <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <line 
                key={i}
                x1="20" 
                y1={height - 20 - (height - 40) * pct} 
                x2={width - 20} 
                y2={height - 20 - (height - 40) * pct} 
                className={styles.gridLine}
              />
            ))}

            {/* Past Line */}
            <polyline 
              points={toPointString(pastPoints)} 
              className={styles.linePast}
            />
            
            {/* Future Line */}
            <polyline 
              points={toPointString(joinedFuturePoints)} 
              className={styles.lineFuture}
            />

            {/* Dots */}
            {pastPoints.map((p, i) => (
              <circle key={`past-${i}`} cx={p.x} cy={p.y} r="5" className={styles.pointPast} />
            ))}
            {joinedFuturePoints.slice(1).map((p, i) => (
              <circle key={`future-${i}`} cx={p.x} cy={p.y} r="5" className={styles.pointFuture} />
            ))}
            
            {/* Forecast Area Highlight */}
            <rect 
              x={pastPoints[pastPoints.length - 1].x} 
              y="20" 
              width={width - 20 - pastPoints[pastPoints.length - 1].x} 
              height={height - 40} 
              className={styles.forecastZone}
            />
          </svg>
          
          <div className={styles.xLabels}>
            {LABELS.map(label => <span key={label}>{label}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
