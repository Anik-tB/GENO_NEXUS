"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

const SPEED = 0.0008;

interface HelixVertexData {
  positions: number[];
  colors: number[];
  normals: number[];
  basePairCount: number;
}

function render3DHelix(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  data: HelixVertexData,
  t: number
) {
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);

  const drawables: any[] = [];
  const scaleY = (H * 0.85) / 50; // Map -25..25 Y to 85% of Canvas Height
  const scaleX = Math.min(W, H) / 9; // Map Radius 3 to screen width
  
  const { positions, colors, basePairCount } = data;

  for (let i = 0; i < basePairCount; i++) {
    const idx = i * 6;
    const idx2 = idx + 3;

    // Retrieve original 3D coords
    const x1 = positions[idx], y1 = positions[idx + 1], z1 = positions[idx + 2];
    const x2 = positions[idx2], y2 = positions[idx2 + 1], z2 = positions[idx2 + 2];

    // Colors (RGB from 0.0 - 1.0)
    const r1 = Math.round(colors[idx] * 255);
    const g1 = Math.round(colors[idx + 1] * 255);
    const b1 = Math.round(colors[idx + 2] * 255);
    const r2 = Math.round(colors[idx2] * 255);
    const g2 = Math.round(colors[idx2 + 1] * 255);
    const b2 = Math.round(colors[idx2 + 2] * 255);

    // Apply rotation matrix around Y axis
    const rx1 = x1 * Math.cos(t) - z1 * Math.sin(t);
    const rz1 = x1 * Math.sin(t) + z1 * Math.cos(t);
    const rx2 = x2 * Math.cos(t) - z2 * Math.sin(t);
    const rz2 = x2 * Math.sin(t) + z2 * Math.cos(t);

    // Project to screen space
    const sx1 = W / 2 + rx1 * scaleX;
    const sy1 = H / 2 + y1 * scaleY;
    const sx2 = W / 2 + rx2 * scaleX;
    const sy2 = H / 2 + y2 * scaleY;

    // Calculate normalized depth (0 = far back, 1 = closest)
    const d1 = (rz1 / 3 + 1) / 2;
    const d2 = (rz2 / 3 + 1) / 2;

    // Push entities to Z-buffer array
    drawables.push({ type: "node", z: rz1, sx: sx1, sy: sy1, d: d1, r: r1, g: g1, b: b1 });
    drawables.push({ type: "node", z: rz2, sx: sx2, sy: sy2, d: d2, r: r2, g: g2, b: b2 });
    drawables.push({
      type: "line",
      z: (rz1 + rz2) / 2,
      sx1, sy1, sx2, sy2, d1, d2,
      c1: { r: r1, g: g1, b: b1 },
      c2: { r: r2, g: g2, b: b2 }
    });
  }

  // Sort by Z to render back-to-front
  drawables.sort((a, b) => a.z - b.z);

  for (const item of drawables) {
    if (item.type === "node") {
      const radius = 1 + 2.5 * item.d;
      
      // Node core
      ctx.beginPath();
      ctx.arc(item.sx, item.sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * item.d})`;
      ctx.fill();

      // Node glow
      const glowRad = radius * 4;
      const glow = ctx.createRadialGradient(item.sx, item.sy, 0, item.sx, item.sy, glowRad);
      glow.addColorStop(0, `rgba(${item.r},${item.g},${item.b},${0.6 * item.d})`);
      glow.addColorStop(1, `rgba(${item.r},${item.g},${item.b},0)`);
      ctx.beginPath();
      ctx.arc(item.sx, item.sy, glowRad, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    } else {
      // Connective line (hydrogen bond)
      const lineAlpha = 0.05 + 0.25 * ((item.d1 + item.d2) / 2);
      const grad = ctx.createLinearGradient(item.sx1, item.sy1, item.sx2, item.sy2);
      grad.addColorStop(0, `rgba(${item.c1.r},${item.c1.g},${item.c1.b},${lineAlpha})`);
      grad.addColorStop(1, `rgba(${item.c2.r},${item.c2.g},${item.c2.b},${lineAlpha})`);
      
      ctx.beginPath();
      ctx.moveTo(item.sx1, item.sy1);
      ctx.lineTo(item.sx2, item.sy2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function DnaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [helixData, setHelixData] = useState<HelixVertexData | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Generate a local procedural helix as fallback
    function generateLocalHelix(): HelixVertexData {
      const count = 80;
      const positions: number[] = [];
      const colors: number[] = [];
      const normals: number[] = [];
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 6;
        const y = -25 + (i / count) * 50;
        // Strand A
        positions.push(3 * Math.cos(t), y, 3 * Math.sin(t));
        colors.push(0.06, 0.73, 0.50); // emerald
        normals.push(Math.cos(t), 0, Math.sin(t));
        // Strand B
        positions.push(3 * Math.cos(t + Math.PI), y, 3 * Math.sin(t + Math.PI));
        colors.push(0.24, 0.56, 0.96); // blue
        normals.push(Math.cos(t + Math.PI), 0, Math.sin(t + Math.PI));
      }
      return { positions, colors, normals, basePairCount: count };
    }

    // Try viz-service first, fall back to local generation
    fetch("http://localhost:4500/api/viz/genome/helix-model", { headers: { "x-api-key": "genonexus-viz-api-key-change-in-production" }, signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setHelixData(data.data);
        else setHelixData(generateLocalHelix());
      })
      .catch(() => {
        setHelixData(generateLocalHelix());
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !helixData) return;
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
      render3DHelix(canvas, ctx, helixData, elapsed * SPEED);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [helixData]);

  if (error) {
    return <div style={{ color: "rgba(255,255,255,0.5)", marginTop: "2rem" }}>DNA Model API offline...</div>;
  }

  if (!helixData) {
    return <div style={{ color: "var(--gn-primary)", marginTop: "2rem" }}>Initializing 3D Sequence...</div>;
  }

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

      {/* Backend-driven 3D DNA helix */}
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
