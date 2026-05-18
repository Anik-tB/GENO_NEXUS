"use client";

import { useState, useEffect } from "react";
import styles from "./ImpactStrip.module.css";
import { IMPACT_STATS } from "../collab-data";

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
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

export default function ImpactStrip() {
  return (
    <div className={styles.impactStrip}>
      {IMPACT_STATS.map((stat, i) => (
        <div key={i} className={styles.impactCard}>
          <div className={styles.impactIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
            {stat.icon}
          </div>
          <div className={styles.impactInfo}>
            <span className={styles.impactValue} style={{ color: stat.color }}>
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
            </span>
            <span className={styles.impactLabel}>{stat.label}</span>
          </div>
          <div className={styles.impactPulse} style={{ background: stat.color }} />
        </div>
      ))}
    </div>
  );
}
