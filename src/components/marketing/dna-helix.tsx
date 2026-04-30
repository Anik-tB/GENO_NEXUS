"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./dna-helix.module.css";

/* ── Static labels ────────────────────────────────────────────────────── */
const CHROME_CHIPS = ["Mutation analysis", "Risk scoring"];
const WORKFLOW_LABELS = ["Sequence intake", "Variant calling", "Disease modelling"];

const SPEED = 0.0008;

/* ── Types ────────────────────────────────────────────────────────────── */
interface HelixVertexData {
  positions: number[];
  colors: number[];
  normals: number[];
  basePairCount: number;
}

interface SignalItem {
  marker: string;
  status: string;
  toneClass: string;
  badgeClass: string;
  text: string;
  width: string;
}

interface AnalysisSnapshot {
  fileName: string;
  matchPct: number;
  totalMutations: number;
  pathogenicCount: number;
  uncertainCount: number;
  benignCount: number;
  hasData: boolean;
}

/* ── 3D rendering ─────────────────────────────────────────────────────── */
function render3DHelix(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  data: HelixVertexData,
  t: number,
  highlights: { pathogenic: number; uncertain: number; benign: number }
) {
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);

  const drawables: any[] = [];
  const scaleY = (H * 0.85) / 50;
  const scaleX = Math.min(W, H) / 9;

  const { positions, colors, basePairCount } = data;

  // Determine color-shift indices for mutation highlighting
  const mutTotal = highlights.pathogenic + highlights.uncertain + highlights.benign;
  const pathEndIdx = mutTotal > 0 ? Math.floor((highlights.pathogenic / mutTotal) * basePairCount) : 0;
  const uncEndIdx = mutTotal > 0 ? pathEndIdx + Math.floor((highlights.uncertain / mutTotal) * basePairCount) : 0;

  for (let i = 0; i < basePairCount; i++) {
    const idx = i * 6;
    const idx2 = idx + 3;

    const x1 = positions[idx], y1 = positions[idx + 1], z1 = positions[idx + 2];
    const x2 = positions[idx2], y2 = positions[idx2 + 1], z2 = positions[idx2 + 2];

    // Dynamic coloring: shift node colors based on mutation classification
    let r1: number, g1: number, b1: number;
    let r2: number, g2: number, b2: number;

    if (mutTotal > 0 && i < pathEndIdx) {
      // Pathogenic — red-ish strand
      r1 = 240; g1 = 68; b1 = 80;
      r2 = 200; g2 = 45; b2 = 60;
    } else if (mutTotal > 0 && i < uncEndIdx) {
      // Uncertain — amber
      r1 = 245; g1 = 166; b1 = 35;
      r2 = 220; g2 = 140; b2 = 30;
    } else {
      // Normal/Benign — original emerald / blue
      r1 = Math.round(colors[idx] * 255);
      g1 = Math.round(colors[idx + 1] * 255);
      b1 = Math.round(colors[idx + 2] * 255);
      r2 = Math.round(colors[idx2] * 255);
      g2 = Math.round(colors[idx2 + 1] * 255);
      b2 = Math.round(colors[idx2 + 2] * 255);
    }

    const rx1 = x1 * Math.cos(t) - z1 * Math.sin(t);
    const rz1 = x1 * Math.sin(t) + z1 * Math.cos(t);
    const rx2 = x2 * Math.cos(t) - z2 * Math.sin(t);
    const rz2 = x2 * Math.sin(t) + z2 * Math.cos(t);

    const sx1 = W / 2 + rx1 * scaleX;
    const sy1 = H / 2 + y1 * scaleY;
    const sx2 = W / 2 + rx2 * scaleX;
    const sy2 = H / 2 + y2 * scaleY;

    const d1 = (rz1 / 3 + 1) / 2;
    const d2 = (rz2 / 3 + 1) / 2;

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

  drawables.sort((a, b) => a.z - b.z);

  for (const item of drawables) {
    if (item.type === "node") {
      const radius = 1 + 2.5 * item.d;

      ctx.beginPath();
      ctx.arc(item.sx, item.sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * item.d})`;
      ctx.fill();

      const glowRad = radius * 4;
      const glow = ctx.createRadialGradient(item.sx, item.sy, 0, item.sx, item.sy, glowRad);
      glow.addColorStop(0, `rgba(${item.r},${item.g},${item.b},${0.6 * item.d})`);
      glow.addColorStop(1, `rgba(${item.r},${item.g},${item.b},0)`);
      ctx.beginPath();
      ctx.arc(item.sx, item.sy, glowRad, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    } else {
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

/* ── Canvas component ─────────────────────────────────────────────────── */
function DnaCanvas({ highlights }: { highlights: { pathogenic: number; uncertain: number; benign: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [helixData, setHelixData] = useState<HelixVertexData | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    function generateLocalHelix(): HelixVertexData {
      const count = 80;
      const positions: number[] = [];
      const colors: number[] = [];
      const normals: number[] = [];
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 6;
        const y = -25 + (i / count) * 50;
        positions.push(3 * Math.cos(t), y, 3 * Math.sin(t));
        colors.push(0.06, 0.73, 0.50);
        normals.push(Math.cos(t), 0, Math.sin(t));
        positions.push(3 * Math.cos(t + Math.PI), y, 3 * Math.sin(t + Math.PI));
        colors.push(0.24, 0.56, 0.96);
        normals.push(Math.cos(t + Math.PI), 0, Math.sin(t + Math.PI));
      }
      return { positions, colors, normals, basePairCount: count };
    }

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
      render3DHelix(canvas, ctx, helixData, elapsed * SPEED, highlights);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [helixData, highlights]);

  if (error) {
    return <div style={{ color: "rgba(255,255,255,0.5)", marginTop: "2rem" }}>DNA Model API offline...</div>;
  }

  if (!helixData) {
    return <div style={{ color: "var(--gn-primary)", marginTop: "2rem" }}>Initializing 3D Sequence...</div>;
  }

  return <canvas ref={canvasRef} className={styles.helixCanvas} />;
}

/* ── Build signal board from real data ────────────────────────────────── */
function buildSignals(snap: AnalysisSnapshot | null): SignalItem[] {
  if (!snap || !snap.hasData) {
    return [
      {
        marker: "No Data",
        status: "Awaiting",
        toneClass: styles.panelCardSafe,
        badgeClass: styles.riskBadgeSafe,
        text: "Upload and analyse a DNA file to populate the signal board with real variant data.",
        width: "0%",
      },
    ];
  }

  const items: SignalItem[] = [];

  // 1. Pathogenic variants signal
  if (snap.pathogenicCount > 0) {
    const pctOfTotal = Math.round((snap.pathogenicCount / snap.totalMutations) * 100);
    items.push({
      marker: `${snap.pathogenicCount} Pathogenic`,
      status: pctOfTotal > 20 ? "Critical" : "Alert",
      toneClass: pctOfTotal > 20 ? styles.panelCardHigh : styles.panelCardModerate,
      badgeClass: pctOfTotal > 20 ? styles.riskBadgeHigh : styles.riskBadgeModerate,
      text: `${snap.pathogenicCount} high-impact transversions detected out of ${snap.totalMutations} total variants (${pctOfTotal}% pathogenic burden).`,
      width: `${Math.min(100, pctOfTotal * 3)}%`,
    });
  }

  // 2. Uncertain significance signal
  if (snap.uncertainCount > 0) {
    const pct = Math.round((snap.uncertainCount / snap.totalMutations) * 100);
    items.push({
      marker: `${snap.uncertainCount} VUS`,
      status: "Review",
      toneClass: styles.panelCardModerate,
      badgeClass: styles.riskBadgeModerate,
      text: `${snap.uncertainCount} variants of uncertain significance require clinician interpretation (${pct}% of total).`,
      width: `${Math.min(100, pct * 2)}%`,
    });
  }

  // 3. Sequence match quality signal
  const matchQuality = snap.matchPct >= 80 ? "Good" : snap.matchPct >= 50 ? "Moderate" : "Low";
  const matchTone = snap.matchPct >= 80 ? styles.panelCardSafe : snap.matchPct >= 50 ? styles.panelCardModerate : styles.panelCardHigh;
  const matchBadge = snap.matchPct >= 80 ? styles.riskBadgeSafe : snap.matchPct >= 50 ? styles.riskBadgeModerate : styles.riskBadgeHigh;
  items.push({
    marker: `${snap.matchPct}% Match`,
    status: matchQuality,
    toneClass: matchTone,
    badgeClass: matchBadge,
    text: `Sequence alignment against NCBI reference yielded ${snap.matchPct}% identity across ${snap.totalMutations} variant positions.`,
    width: `${snap.matchPct}%`,
  });

  // 4. Benign — shows everything is classified
  if (snap.benignCount > 0) {
    items.push({
      marker: `${snap.benignCount} Benign`,
      status: "Cleared",
      toneClass: styles.panelCardSafe,
      badgeClass: styles.riskBadgeSafe,
      text: `${snap.benignCount} transitions classified as benign. No clinical action required for these loci.`,
      width: "100%",
    });
  }

  return items.slice(0, 4); // max 4 cards
}

/* ── Main component ───────────────────────────────────────────────────── */
type DnaHelixProps = {
  variant?: "default" | "dashboard";
};

export function DnaHelix({ variant = "default" }: DnaHelixProps) {
  const [analysis, setAnalysis] = useState<AnalysisSnapshot | null>(null);

  useEffect(() => {
    fetch("/api/visualization/analysis-data")
      .then((r) => r.json())
      .then((d) => setAnalysis(d))
      .catch(() => {});
  }, []);

  const signals = buildSignals(analysis);
  const highlights = {
    pathogenic: analysis?.pathogenicCount ?? 0,
    uncertain: analysis?.uncertainCount ?? 0,
    benign: analysis?.benignCount ?? 0,
  };

  const hasData = analysis?.hasData ?? false;
  const fileName = analysis?.fileName ?? "—";
  const matchPct = analysis?.matchPct ?? 0;
  const totalMutations = analysis?.totalMutations ?? 0;

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
            <span>{hasData ? `Analysing ${fileName}` : "Live pharmacogenomics surface"}</span>
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
        <DnaCanvas highlights={highlights} />
      </div>



      <aside className={styles.panel}>
        <div className={styles.panelTopbar}>
          <p className={styles.panelHeader}>
            <span className={styles.liveDot} />
            {hasData ? "Variant Signal Board" : "Signal Board"}
          </p>
          <span className={styles.panelCase}>
            {hasData ? `${totalMutations} variants` : "No analysis"}
          </span>
        </div>

        <div className={styles.panelGrid}>
          {signals.map((item) => (
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
          {hasData
            ? [
                { label: "Pathogenic", value: analysis?.pathogenicCount ?? 0 },
                { label: "VUS", value: analysis?.uncertainCount ?? 0 },
                { label: "Benign", value: analysis?.benignCount ?? 0 },
              ].map((s) => (
                <span key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{s.value}</strong>
                  <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{s.label}</span>
                </span>
              ))
            : ["Ingest", "Interpret", "Report", "Govern"].map((item) => (
                <span key={item}>{item}</span>
              ))}
        </div>
      </aside>
    </div>
  );
}
