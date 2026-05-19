"use client";

import { useState, useEffect } from "react";
import styles from "./ImpactStrip.module.css";
import { ImpactStatsData } from "@/hooks/useCollabStats";

interface Props {
  stats: ImpactStatsData | null;
  loading: boolean;
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setCount(current);
    }, 30);
    return () => clearInterval(interval);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const SKELETON_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4"];

export default function ImpactStrip({ stats, loading }: Props) {
  const statList = stats
    ? [
        { label: "Active Researchers", value: stats.activeResearchers, icon: "👥", color: "#10b981", suffix: "" },
        { label: "Shared Datasets",    value: stats.sharedDatasets,    icon: "📊", color: "#6366f1", suffix: "" },
        { label: "Pipelines Executed", value: stats.pipelinesExecuted, icon: "⚡", color: "#f59e0b", suffix: "" },
        { label: "Variants Identified",value: stats.variantsIdentified,icon: "🧬", color: "#ec4899", suffix: "" },
        { label: "Collab Score",       value: stats.collabScore,       icon: "🏆", color: "#06b6d4", suffix: "%" },
      ]
    : null;

  return (
    <div className={styles.impactStrip}>
      {loading || !statList
        ? SKELETON_COLORS.map((color, i) => (
            <div key={i} className={styles.impactCard} style={{ opacity: 0.45 }}>
              <div className={styles.impactTopRow}>
                <div className={styles.impactIcon} style={{ background: `${color}10`, color: "#334155" }}>—</div>
                <span
                  className={styles.impactValue}
                  style={{
                    display: "inline-block",
                    width: "3rem",
                    height: "1.4rem",
                    background: `linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)`,
                    backgroundSize: "200% 100%",
                    borderRadius: "4px",
                    animation: "shimmer 1.4s infinite",
                  }}
                />
              </div>
              <span className={styles.impactLabel} style={{ color: "#334155" }}>Loading…</span>
              <div className={styles.impactPulse} style={{ background: color }} />
            </div>
          ))
        : statList.map((stat, i) => (
            <div key={i} className={styles.impactCard}>
              <div className={styles.impactTopRow}>
                <div className={styles.impactIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <span className={styles.impactValue} style={{ color: stat.color }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </span>
              </div>
              <span className={styles.impactLabel}>{stat.label}</span>
              <div className={styles.impactPulse} style={{ background: stat.color }} />
            </div>
          ))}
    </div>
  );
}
