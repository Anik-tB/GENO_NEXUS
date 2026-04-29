"use client";

import { useState } from "react";
import styles from "./page.module.css";

const STEPS = [
  { id: 1, name: "Uploading sequence data",        duration: 1000 },
  { id: 2, name: "Cleaning and normalizing reads", duration: 2000 },
  { id: 3, name: "Analyzing mutation variants",    duration: 3000 },
  { id: 4, name: "Predicting pathogenic risk scores", duration: 2500 },
];

import { useEffect } from "react";
import Link from "next/link";

export default function ProcessingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let stepIndex = 0;
    const runNext = () => {
      if (stepIndex >= STEPS.length) { setIsComplete(true); return; }
      setCurrentStep(stepIndex);
      const step = STEPS[stepIndex];
      let start: number | null = null;
      const animate = (ts: number) => {
        if (!start) start = ts;
        const passed = ts - start;
        const pct = Math.min((passed / step.duration) * 100, 100);
        const prev = (stepIndex / STEPS.length) * 100;
        setProgress(prev + (pct / 100) * (100 / STEPS.length));
        if (passed < step.duration) requestAnimationFrame(animate);
        else { stepIndex++; runNext(); }
      };
      requestAnimationFrame(animate);
    };
    runNext();
  }, []);

  const eta = isComplete ? "0s" : `${Math.ceil(((100 - progress) / 100) * 8.5)}s`;

  return (
    <div className={styles.container}>
      {isComplete ? (
        <div className={styles.completeState}>
          <div className={styles.successRing}>
            <svg viewBox="0 0 80 80" className={styles.successSvg}>
              <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="6"/>
              <circle cx="40" cy="40" r="35" fill="none" stroke="var(--gn-success)" strokeWidth="6" strokeLinecap="round" strokeDasharray="220 220" strokeDashoffset="0"/>
              <polyline points="24,40 36,52 56,30" fill="none" stroke="var(--gn-success)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.eyebrow}>✓ Pipeline Finished</div>
          <h1 className={styles.title}>Processing Complete</h1>
          <p className={styles.subtitle}>All 4 AI stages completed successfully. Your genomic results are ready for review.</p>
          <div className={styles.completeCards}>
            <div className={styles.completeKpi}><span>14</span><p>Variants Identified</p></div>
            <div className={styles.completeKpi}><span>94.7%</span><p>AI Confidence</p></div>
            <div className={styles.completeKpi}><span>2</span><p>High Priority</p></div>
          </div>
          <div className={styles.completeActions}>
            <Link href="/dashboard/analysis" className={styles.primaryButton}>View Mutation Analysis →</Link>
            <Link href="/dashboard/predictions" className={styles.secondaryButton}>See Disease Predictions</Link>
          </div>
        </div>
      ) : (
        <div className={styles.processingState}>
          <div className={styles.eyebrow}>🔄 AI Pipeline · Running</div>
          <h1 className={styles.title}>Analyzing Genome</h1>
          <p className={styles.subtitle}>Estimated time remaining: <strong>{eta}</strong></p>

          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Overall Progress</span>
              <span className={styles.progressPct}>{Math.floor(progress)}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }}>
                <div className={styles.progressGlow} />
              </div>
            </div>
          </div>

          <ul className={styles.stepList}>
            {STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isDone   = index < currentStep;
              return (
                <li key={step.id} className={`${styles.stepItem} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}>
                  <div className={styles.stepIconBox}>
                    {isDone
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : isActive
                      ? <span className={styles.pulsingDot} />
                      : <span className={styles.pendingDot} />
                    }
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepName}>{step.name}</span>
                    <span className={styles.stepStatus}>
                      {isDone ? "Complete" : isActive ? "In progress…" : "Pending"}
                    </span>
                  </div>
                  {isDone && <svg className={styles.stepCheck} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gn-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
