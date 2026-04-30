"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./DigitalCellTwin.module.css";

const BASE_METRICS = [
  { label: "ATP Production", unit: "μmol/min", base: 24.5, color: "var(--gn-primary)" },
  { label: "Membrane Potential", unit: "mV", base: -70, color: "var(--gn-blue)" },
  { label: "Drug Binding", unit: "%", base: 0, color: "var(--gn-warning)" },
  { label: "Protein Synthesis", unit: "pg/hr", base: 8.2, color: "var(--gn-success)" },
];

const DRUG_METRICS = [
  { label: "ATP Production", unit: "μmol/min", base: 12.1, color: "var(--gn-primary)" },
  { label: "Membrane Potential", unit: "mV", base: -55, color: "var(--gn-blue)" },
  { label: "Drug Binding", unit: "%", base: 87.4, color: "var(--gn-warning)" },
  { label: "Protein Synthesis", unit: "pg/hr", base: 3.6, color: "var(--gn-success)" },
];

export function DigitalCellTwin() {
  const [simRunning, setSimRunning] = useState(false);
  const [drugApplied, setDrugApplied] = useState(false);
  const [values, setValues] = useState(BASE_METRICS.map((m) => m.base));
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
      const targets = drugApplied ? DRUG_METRICS : BASE_METRICS;
      setValues((prev) =>
        prev.map((v, i) => {
          const target = targets[i].base;
          const noise = (Math.random() - 0.5) * Math.abs(target) * 0.04;
          return +(v + (target - v) * 0.1 + noise).toFixed(1);
        })
      );
    }, 600);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [drugApplied]);

  const runSim = () => {
    setSimRunning(true);
    setTimeout(() => {
      setDrugApplied(true);
      setSimRunning(false);
    }, 2000);
  };

  const resetSim = () => {
    setDrugApplied(false);
    setSimRunning(false);
    setValues(BASE_METRICS.map((m) => m.base));
  };

  return (
    <div className={styles.wrapper}>
      {/* Cell Canvas */}
      <div className={`${styles.cellCanvas} ${drugApplied ? styles.drugState : ""}`}>
        <div className={styles.cellMembrane}>
          <div className={styles.cytoplasm}>
            {/* Nucleus */}
            <div className={styles.nucleus}>
              <div className={styles.nucleolus} />
              <div className={styles.chromatinA} />
              <div className={styles.chromatinB} />
            </div>
            {/* Mitochondria */}
            <div className={`${styles.mito} ${styles.mito1}`} />
            <div className={`${styles.mito} ${styles.mito2}`} />
            <div className={`${styles.mito} ${styles.mito3}`} />
            {/* ER */}
            <div className={styles.erRough} />
            <div className={styles.erSmooth} />
            {/* Ribosomes */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.ribosome} style={{ left: `${15 + (i % 4) * 18}%`, top: `${20 + Math.floor(i / 4) * 22}%` }} />
            ))}
            {/* Golgi */}
            <div className={styles.golgi}>
              {[0, 1, 2].map((i) => <div key={i} className={styles.golgiStack} />)}
            </div>
            {/* Drug molecules */}
            {drugApplied && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.drugMolecule} style={{ animationDelay: `${i * 0.3}s`, left: `${10 + i * 13}%`, top: `${10 + (i % 3) * 25}%` }} />
            ))}
          </div>
        </div>
        {/* Labels */}
        <div className={styles.organelleLabel} style={{ top: "38%", left: "36%" }}>Nucleus</div>
        <div className={styles.organelleLabel} style={{ top: "18%", right: "18%" }}>Mitochondria</div>
        <div className={styles.organelleLabel} style={{ bottom: "22%", left: "12%" }}>Rough ER</div>
        <div className={styles.organelleLabel} style={{ bottom: "12%", right: "22%" }}>Golgi</div>
        {simRunning && <div className={styles.simOverlay}><div className={styles.simSpinner} /><span>Running Simulation…</span></div>}
      </div>

      {/* Metrics Panel */}
      <div className={styles.metricsPanel}>
        <div className={styles.metricsHeader}>
          <div>
            <h3 className={styles.metricsTitle}>Live Cell Metrics</h3>
            <p className={styles.metricsSub}>{drugApplied ? "Post-drug interaction" : "Baseline state"}</p>
          </div>
          <div className={`${styles.stateDot} ${drugApplied ? styles.stateDotDrug : styles.stateDotBase}`} />
        </div>

        <div className={styles.metricsList}>
          {BASE_METRICS.map((m, i) => {
            const pct = Math.min(100, Math.abs(values[i]) / Math.abs(m.base + 30) * 100);
            return (
              <div key={m.label} className={styles.metricItem}>
                <div className={styles.metricTop}>
                  <span className={styles.metricLabel}>{m.label}</span>
                  <span className={styles.metricValue} style={{ color: m.color }}>
                    {values[i].toFixed(1)}<span className={styles.metricUnit}> {m.unit}</span>
                  </span>
                </div>
                <div className={styles.metricBar}>
                  <div className={styles.metricBarFill} style={{ width: `${pct}%`, background: m.color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          {!drugApplied ? (
            <button className={styles.simBtn} onClick={runSim} disabled={simRunning}>
              {simRunning ? "Simulating…" : "⚡ Apply Drug Interaction"}
            </button>
          ) : (
            <button className={styles.resetBtn} onClick={resetSim}>↺ Reset to Baseline</button>
          )}
        </div>

        <div className={styles.organelleList}>
          <p className={styles.organelleTitle}>Organelle Status</p>
          {[
            { name: "Nucleus", status: "Active", ok: true },
            { name: "Mitochondria", status: drugApplied ? "Stressed" : "Optimal", ok: !drugApplied },
            { name: "Endoplasmic Reticulum", status: "Active", ok: true },
            { name: "Golgi Apparatus", status: drugApplied ? "Slowed" : "Normal", ok: !drugApplied },
          ].map((o) => (
            <div key={o.name} className={styles.organelleItem}>
              <span className={`${styles.orgDot} ${o.ok ? styles.orgOk : styles.orgWarn}`} />
              <span className={styles.orgName}>{o.name}</span>
              <span className={`${styles.orgStatus} ${o.ok ? styles.orgStatusOk : styles.orgStatusWarn}`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
