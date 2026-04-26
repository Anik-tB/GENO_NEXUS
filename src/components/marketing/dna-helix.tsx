"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./dna-helix.module.css";

const CHROME_CHIPS = ["Medication safety", "Consent-aware"];
const WORKFLOW_LABELS = ["DNA intake", "AI review", "Clinical handoff"];

const PANEL_ITEMS = [
  {
    marker: "CYP2C19",
    status: "Priority",
    toneClass: styles.panelCardHigh,
    badgeClass: styles.riskBadgeHigh,
    text: "Reduced response surfaced in the medication-safety layer.",
    width: "88%",
  },
  {
    marker: "CYP2D6",
    status: "Review",
    toneClass: styles.panelCardModerate,
    badgeClass: styles.riskBadgeModerate,
    text: "Rapid metabolism pathway flagged for clinician review.",
    width: "64%",
  },
  {
    marker: "Vault",
    status: "Protected",
    toneClass: styles.panelCardSafe,
    badgeClass: styles.riskBadgeSafe,
    text: "Consent, access, and audit controls remain locked to the case.",
    width: "100%",
  },
];

const NUM_RUNGS = 18;
// amplitude: how far left/right each node swings (px)
const AMP = 52;
// how many full sine cycles are visible at once
const WAVE_CYCLES = 2;
// speed: radians per millisecond
const SPEED = 0.0008;

function drawHelix(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  t: number
) {
  const { width: W, height: H } = canvas;
  const cx = W / 2;
  ctx.clearRect(0, 0, W, H);

  const PADDING = 40;

  for (let i = 0; i < NUM_RUNGS; i++) {
    // vertical position of this rung stretches from top padding to bottom padding
    const y = PADDING + ((H - PADDING * 2) / (NUM_RUNGS - 1)) * i;

    // phase for this rung — distributes rungs evenly across the wave
    const phase = (i / NUM_RUNGS) * Math.PI * 2 * WAVE_CYCLES - t;

    // left strand: sin(phase), right strand: sin(phase + π) = -sin(phase)
    const xLeft = cx - AMP + AMP * Math.sin(phase);
    const xRight = cx + AMP + AMP * Math.sin(phase + Math.PI);

    // depth cue: sin value maps brightness/size
    const depthL = (Math.sin(phase) + 1) / 2; // 0…1
    const depthR = (Math.sin(phase + Math.PI) + 1) / 2;

    // ── rung line ────────────────────────────────────────────────────────────
    const lineAlpha = 0.35 + 0.45 * ((depthL + depthR) / 2);
    const grad = ctx.createLinearGradient(xLeft, y, xRight, y);
    grad.addColorStop(0, `rgba(22,165,150,${lineAlpha})`);
    grad.addColorStop(1, `rgba(185,131,47,${lineAlpha})`);
    ctx.beginPath();
    ctx.moveTo(xLeft, y);
    ctx.lineTo(xRight, y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── left node ────────────────────────────────────────────────────────────
    const rL = 6 + 5 * depthL;
    const glowL = ctx.createRadialGradient(xLeft, y, 0, xLeft, y, rL * 2.5);
    glowL.addColorStop(0, `rgba(22,165,150,${0.5 + 0.5 * depthL})`);
    glowL.addColorStop(0.6, `rgba(22,165,150,${0.18 * depthL})`);
    glowL.addColorStop(1, "rgba(22,165,150,0)");
    ctx.beginPath();
    ctx.arc(xLeft, y, rL * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glowL;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xLeft, y, rL, 0, Math.PI * 2);
    const innerL = ctx.createRadialGradient(
      xLeft - rL * 0.3,
      y - rL * 0.3,
      0,
      xLeft,
      y,
      rL
    );
    innerL.addColorStop(0, `rgba(255,255,255,${0.55 + 0.45 * depthL})`);
    innerL.addColorStop(0.4, `rgba(22,165,150,${0.9})`);
    innerL.addColorStop(1, `rgba(10,80,70,1)`);
    ctx.fillStyle = innerL;
    ctx.shadowColor = `rgba(22,165,150,${0.7 * depthL})`;
    ctx.shadowBlur = 12 * depthL;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── right node ───────────────────────────────────────────────────────────
    const rR = 6 + 5 * depthR;
    const glowR = ctx.createRadialGradient(
      xRight,
      y,
      0,
      xRight,
      y,
      rR * 2.5
    );
    glowR.addColorStop(0, `rgba(185,131,47,${0.5 + 0.5 * depthR})`);
    glowR.addColorStop(0.6, `rgba(185,131,47,${0.18 * depthR})`);
    glowR.addColorStop(1, "rgba(185,131,47,0)");
    ctx.beginPath();
    ctx.arc(xRight, y, rR * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glowR;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xRight, y, rR, 0, Math.PI * 2);
    const innerR = ctx.createRadialGradient(
      xRight - rR * 0.3,
      y - rR * 0.3,
      0,
      xRight,
      y,
      rR
    );
    innerR.addColorStop(0, `rgba(255,255,255,${0.55 + 0.45 * depthR})`);
    innerR.addColorStop(0.4, `rgba(185,131,47,0.9)`);
    innerR.addColorStop(1, `rgba(90,55,10,1)`);
    ctx.fillStyle = innerR;
    ctx.shadowColor = `rgba(185,131,47,${0.7 * depthR})`;
    ctx.shadowBlur = 12 * depthR;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function DnaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      drawHelix(canvas, ctx, elapsed * SPEED);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.helixCanvas} />;
}

type DnaHelixProps = {
  variant?: "default" | "dashboard";
};

export function DnaHelix({ variant = "default" }: DnaHelixProps) {
  return (
    <div
      className={`${styles.helixFrame} ${
        variant === "dashboard" ? styles.dashboardFrame : ""
      }`}
    >
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />
      <div className={styles.gridOverlay} />

      <div className={styles.platformChrome}>
        <div className={styles.platformBrand}>
          <Image
            src="/dna-icon.svg"
            alt="GenoNexus Platform Logo"
            width={32}
            height={32}
            className={styles.platformMark}
          />
          <div className={styles.platformText}>
            <strong>GenoNexus Platform</strong>
            <span>Live pharmacogenomics surface</span>
          </div>
        </div>

        <div className={styles.platformChips}>
          {CHROME_CHIPS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <div className={styles.workflowLegend}>
        {WORKFLOW_LABELS.map((item) => (
          <div key={item} className={styles.workflowLegendItem}>
            <span className={styles.workflowLegendDot} />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Canvas-rendered sine-wave DNA helix */}
      <div className={styles.strand}>
        <DnaCanvas />
      </div>

      <aside className={styles.panel}>
        <div className={styles.panelTopbar}>
          <p className={styles.panelHeader}>
            <span className={styles.liveDot} />
            Active signal board
          </p>
          <span className={styles.panelCase}>Case GN-88392</span>
        </div>

        <div className={styles.panelGrid}>
          {PANEL_ITEMS.map((item) => (
            <div
              key={item.marker}
              className={`${styles.panelCard} ${item.toneClass}`}
            >
              <div className={styles.panelCardHeader}>
                <strong className={styles.markerCode}>{item.marker}</strong>
                <span className={item.badgeClass}>{item.status}</span>
              </div>
              <p>{item.text}</p>
              <div className={styles.dataBar}>
                <span style={{ width: item.width }} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.statusStrip}>
          {["Ingest", "Interpret", "Report", "Govern"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </aside>
    </div>
  );
}
