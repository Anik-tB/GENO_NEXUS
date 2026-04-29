"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./DigitalCellTwin.module.css";

export function DigitalCellTwin() {
  const [simRunning, setSimRunning]     = useState(false);
  const [drugApplied, setDrugApplied]   = useState(false);
  const [baseMetrics, setBaseMetrics]   = useState<any[]>([]);
  const [drugMetrics, setDrugMetrics]   = useState<any[]>([]);
  const [values, setValues]             = useState<number[]>([]);
  const [baseValues, setBaseValues]     = useState<number[]>([]);
  const [tick, setTick]                 = useState(0);
  const [loading, setLoading]           = useState(true);
  const [stressFactor, setStressFactor] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mutationSummary, setMutationSummary] = useState<string>("");

  // Fetch baseline metrics — augmented by real mutation data
  useEffect(() => {
    const fetchBaseline = async () => {
      // 1. Load real mutation data first
      let pathogenicCount = 0;
      let uncertainCount  = 0;
      let fileName        = "";
      try {
        const raw = await fetch("/api/visualization/mutations-raw").then((r) => r.json());
        pathogenicCount = (raw.mutations || []).filter((m: any) => m.severity === "pathogenic").length;
        uncertainCount  = (raw.mutations || []).filter((m: any) => m.severity === "uncertain").length;
        fileName = raw.fileName || "";
        if (raw.mutations?.length > 0) {
          setMutationSummary(`${fileName} — ${pathogenicCount} pathogenic, ${uncertainCount} uncertain variants`);
        }
      } catch { /* proceed with defaults */ }

      const sf = Math.min(0.6, pathogenicCount * 0.07 + uncertainCount * 0.03);
      setStressFactor(sf);

      // 3. Build local baseline metrics (works offline), then try to upgrade from viz-service
      const localMetrics = [
        { key: "atp_production",    label: "ATP Production",      unit: "nmol/min", fullBase: 85.0 , color: "var(--gn-primary)" },
        { key: "membrane_potential", label: "Membrane Potential",  unit: "mV",       fullBase: -70.0, color: "var(--gn-blue)"    },
        { key: "protein_synthesis",  label: "Protein Synthesis",   unit: "%",        fullBase: 92.0 , color: "var(--gn-success)"  },
        { key: "drug_binding",       label: "Drug Binding",        unit: "%",        fullBase: 12.0 , color: "var(--gn-warning)"  },
      ];

      const applyStress = (metrics: typeof localMetrics) =>
        metrics.map((m) => {
          const stressedBase = m.key === "atp_production"     ? +(m.fullBase * (1 - sf)).toFixed(1)
                             : m.key === "membrane_potential"  ? +(m.fullBase * (1 - sf * 0.7)).toFixed(1)
                             : m.key === "protein_synthesis"   ? +(m.fullBase * (1 - sf * 0.4)).toFixed(1)
                             : m.fullBase;
          return { label: m.label, unit: m.unit, base: stressedBase, fullBase: m.fullBase, color: m.color };
        });

      // Try viz-service for higher-fidelity data, but don't block on it
      try {
        const res = await fetch("http://localhost:4500/api/viz/cell-twin/baseline", { headers: { "x-api-key": "genonexus-viz-api-key-change-in-production" }, signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        if (data.success && data.data?.metrics) {
          const serviceMetrics = Object.entries(data.data.metrics).map(([key, m]: [string, any]) => ({
            key, fullBase: m.value, label: m.label, unit: m.unit,
            color: key === "atp_production" ? "var(--gn-primary)" : key === "membrane_potential" ? "var(--gn-blue)" : key === "drug_binding" ? "var(--gn-warning)" : "var(--gn-success)",
          }));
          const metricsArray = applyStress(serviceMetrics);
          setBaseMetrics(metricsArray);
          const bv = metricsArray.map((m) => m.base);
          setValues(bv);
          setBaseValues(bv);
          setLoading(false);
          return;
        }
      } catch { /* viz service offline — use local fallback */ }

      // Local fallback
      const metricsArray = applyStress(localMetrics);
      setBaseMetrics(metricsArray);
      const bv = metricsArray.map((m) => m.base);
      setValues(bv);
      setBaseValues(bv);
      setLoading(false);
    };
    fetchBaseline();
  }, []);


  // Animation loop
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (baseMetrics.length === 0) return;
      setTick((t) => t + 1);
      const targets = drugApplied && drugMetrics.length > 0 ? drugMetrics : baseMetrics;
      setValues((prev) =>
        prev.map((v, i) => {
          if (!targets[i]) return v;
          const target = targets[i].base;
          const noise = (Math.random() - 0.5) * Math.abs(target) * 0.04;
          return +(v + (target - v) * 0.1 + noise).toFixed(1);
        })
      );
    }, 600);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [drugApplied, baseMetrics, drugMetrics]);

  const runSim = async () => {
    setSimRunning(true);
    // Brief visual delay to show "Simulating…" spinner
    await new Promise((r) => setTimeout(r, 1200));
    try {
      // Try the viz microservice first
      const res = await fetch("http://localhost:4500/api/viz/cell-twin/simulation/DRUG-001", {
        headers: { "x-api-key": "genonexus-viz-api-key-change-in-production" },
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (data.success && data.data?.postDrugMetrics) {
        const dMetricsArray = Object.entries(data.data.postDrugMetrics).map(([key, m]: [string, any]) => ({
          label: m.label, unit: m.unit, base: m.value,
          color: key === "atp_production"    ? "var(--gn-primary)"
               : key === "membrane_potential" ? "var(--gn-blue)"
               : key === "drug_binding"       ? "var(--gn-warning)"
               : "var(--gn-success)",
        }));
        setDrugMetrics(dMetricsArray);
        setDrugApplied(true);
        setSimRunning(false);
        return;
      }
    } catch { /* viz service unavailable — compute locally */ }

    // Local fallback: drug partially reverses the mutation stress
    // Recovery = 60-80% of the stress gap closed, + drug binding rises sharply
    const recovery = 0.65 + Math.random() * 0.15;
    const localDrug = baseMetrics.map((m) => {
      const fullBase = m.fullBase ?? m.base / (1 - stressFactor * 0.7); // estimate un-stressed
      const gap = fullBase - m.base;
      let newVal: number;
      if (m.label.toLowerCase().includes("drug")) {
        newVal = +(m.base + (100 - m.base) * 0.75).toFixed(1); // drug binding goes way up
      } else {
        newVal = +(m.base + gap * recovery).toFixed(1);
      }
      return { ...m, base: newVal };
    });
    setDrugMetrics(localDrug);
    setDrugApplied(true);
    setSimRunning(false);
  };

  const resetSim = () => {
    setDrugApplied(false);
    setSimRunning(false);
    setValues(baseValues);
  };

  if (loading) {
     return <div className={styles.wrapper} style={{alignItems:'center', justifyContent:'center', color:'var(--gn-white)'}}>Connecting to Cell Twin API...</div>;
  }

  return (
    <div className={styles.wrapper}>
      {/* Mutation source banner */}
      {mutationSummary && (
        <div style={{ position: "absolute", top: "0.75rem", left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "999px", padding: "0.3rem 1rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--gn-primary)", whiteSpace: "nowrap" }}>
          🧬 {mutationSummary}
        </div>
      )}
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
          {baseMetrics.map((m, i) => {
            if (values[i] === undefined) return null;
            const currentVal  = values[i];
            const baseVal     = baseValues[i] ?? m.base;
            const drugVal     = drugMetrics[i]?.base;
            const displayVal  = drugApplied && drugVal !== undefined ? drugVal : baseVal;

            // Use a fixed-reference max per metric type for stable bars
            const refMax = Math.abs(m.fullBase ?? baseVal * 1.4) || 100;
            const basePct = Math.min(100, (Math.abs(baseVal) / refMax) * 100);
            const drugPct = drugVal !== undefined ? Math.min(100, (Math.abs(drugVal) / refMax) * 100) : basePct;
            const activePct = drugApplied ? drugPct : basePct;

            const delta = drugApplied && drugVal !== undefined ? drugVal - baseVal : 0;
            const hasChange = Math.abs(delta) > 0.05;

            return (
              <div key={m.label} className={styles.metricItem}>
                <div className={styles.metricTop}>
                  <span className={styles.metricLabel}>{m.label}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {hasChange && (
                      <span style={{
                        fontSize: "0.68rem", fontWeight: 700,
                        color: delta > 0 ? "var(--gn-success)" : "var(--gn-danger)",
                        background: delta > 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        padding: "0.1rem 0.35rem", borderRadius: "4px", whiteSpace: "nowrap",
                      }}>
                        {delta > 0 ? "▲" : "▼"} {delta > 0 ? "+" : ""}{delta.toFixed(1)} {m.unit}
                      </span>
                    )}
                    <span className={styles.metricValue} style={{ color: m.color }}>
                      {displayVal.toFixed(1)}<span className={styles.metricUnit}> {m.unit}</span>
                    </span>
                  </span>
                </div>
                {/* Bar: shows baseline ghost + active fill */}
                <div className={styles.metricBar}>
                  {/* Ghost (baseline) */}
                  {drugApplied && (
                    <div style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      width: `${basePct}%`,
                      background: m.color, opacity: 0.2, borderRadius: "999px",
                    }} />
                  )}
                  {/* Active fill */}
                  <div style={{
                    height: "100%", borderRadius: "999px",
                    width: `${activePct}%`,
                    background: m.color,
                    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }} />
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
