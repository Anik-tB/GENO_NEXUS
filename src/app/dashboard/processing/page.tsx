"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const STAGES = [
  { label: "Fetching reference from NCBI",       weight: 20 },
  { label: "Loading query sequence",             weight: 10 },
  { label: "Running pairwise alignment",         weight: 40 },
  { label: "Detecting mutation variants",        weight: 20 },
  { label: "Finalising results",                 weight: 10 },
];

// Build cumulative thresholds so we can map overall % → stage
const THRESHOLDS = STAGES.reduce<number[]>((acc, s) => {
  acc.push((acc[acc.length - 1] ?? 0) + s.weight);
  return acc;
}, []);

function stageFromProgress(pct: number) {
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (pct < THRESHOLDS[i]) return i;
  }
  return STAGES.length - 1;
}

export default function ProcessingPage() {
  const [progress, setProgress]       = useState(0);
  const [status, setStatus]           = useState<"processing" | "completed" | "failed">("processing");
  const [mutationCount, setMutationCount] = useState<number | null>(null);
  const [matchPct, setMatchPct]       = useState<number | null>(null);
  const rafRef                        = useRef<number | null>(null);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Real-time smooth progress ticker ──────────────────────────────────────
  // We don't know true progress from the backend (it's a long-running script),
  // so we simulate smooth movement that slows down as it approaches 90%,
  // then jumps to 100% when the poll confirms completion.
  const targetRef = useRef(5);   // moves up over time
  const currentRef = useRef(0);  // current animated value

  useEffect(() => {
    // Tick the animated bar smoothly toward target
    const tick = () => {
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) > 0.05) {
        currentRef.current += diff * 0.04; // eased approach
        setProgress(Math.min(99, currentRef.current));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Slowly push target forward to simulate work (slows near 90%)
    const nudge = setInterval(() => {
      if (targetRef.current < 88) {
        const remaining = 88 - targetRef.current;
        targetRef.current += remaining * 0.06 + 0.3;
      }
    }, 800);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearInterval(nudge);
    };
  }, []);

  // ── Poll the real comparison status ───────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        // Trigger / get the latest comparison ID
        const autoRes = await fetch("/api/analysis/auto", { method: "POST" });
        const autoData = await autoRes.json();
        if (!autoData.success || !autoData.comparisonId) return;

        const compId = autoData.comparisonId;

        // Check its status
        const statusRes = await fetch(`/api/analysis/compare/${compId}`);
        const statusData = await statusRes.json();
        if (!statusData.success) return;

        const result = statusData.result;

        if (result.status === "completed") {
          const mutations = result.mutations_found || [];
          setMutationCount(mutations.length);
          setMatchPct(result.match_percentage);
          // Animate bar to 100
          targetRef.current = 100;
          currentRef.current = 98;
          setTimeout(() => setStatus("completed"), 600);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (result.status === "failed") {
          setStatus("failed");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Silently ignore poll errors — server may briefly be unresponsive
      }
    };

    poll(); // run immediately
    intervalRef.current = setInterval(poll, 3000); // then every 3 s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const currentStage = stageFromProgress(progress);
  const isComplete   = status === "completed";
  const isFailed     = status === "failed";
  const eta          = isComplete ? "0s" : `${Math.max(1, Math.ceil(((100 - progress) / 100) * 45))}s`;

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
          <p className={styles.subtitle}>All alignment stages completed. Your genomic results are ready for review.</p>
          <div className={styles.completeCards}>
            <div className={styles.completeKpi}>
              <span>{mutationCount ?? "—"}</span>
              <p>Variants Identified</p>
            </div>
            <div className={styles.completeKpi}>
              <span>{matchPct != null ? `${matchPct}%` : "—"}</span>
              <p>Sequence Match</p>
            </div>
            <div className={styles.completeKpi}>
              <span>4</span>
              <p>Diseases Screened</p>
            </div>
          </div>
          <div className={styles.completeActions}>
            <Link href="/dashboard/analysis" className={styles.primaryButton}>View Mutation Analysis →</Link>
            <Link href="/dashboard/predictions" className={styles.secondaryButton}>See Disease Predictions</Link>
          </div>
        </div>

      ) : isFailed ? (
        <div className={styles.processingState} style={{ textAlign: "center" }}>
          <div className={styles.eyebrow} style={{ color: "var(--gn-danger)" }}>✗ Pipeline Failed</div>
          <h1 className={styles.title}>Analysis Error</h1>
          <p className={styles.subtitle} style={{ color: "#888" }}>
            The Python alignment engine encountered an error. Check that the NCBI link is valid and the genomics engine is running.
          </p>
          <Link href="/dashboard/upload" className={styles.primaryButton} style={{ marginTop: "2rem", display: "inline-block" }}>
            ← Back to Upload Station
          </Link>
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
            {STAGES.map((stage, index) => {
              const isActive = index === currentStage;
              const isDone   = index < currentStage;
              return (
                <li key={index} className={`${styles.stepItem} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}>
                  <div className={styles.stepIconBox}>
                    {isDone
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : isActive
                      ? <span className={styles.pulsingDot} />
                      : <span className={styles.pendingDot} />
                    }
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepName}>{stage.label}</span>
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
