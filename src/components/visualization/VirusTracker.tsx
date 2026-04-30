"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./VirusTracker.module.css";

const CHART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Geographic regions with approximate SVG coordinates for the map
const GEO_REGIONS = [
  { region: "North America",  x: "14%",  y: "28%" },
  { region: "South America",  x: "22%",  y: "65%" },
  { region: "Europe",         x: "45%",  y: "18%" },
  { region: "Africa",         x: "46%",  y: "52%" },
  { region: "Middle East",    x: "57%",  y: "35%" },
  { region: "South Asia",     x: "65%",  y: "42%" },
  { region: "East Asia",      x: "74%",  y: "28%" },
  { region: "Southeast Asia", x: "76%",  y: "52%" },
  { region: "Australia",      x: "80%",  y: "72%" },
];

function severityColor(s: number) {
  if (s >= 5) return "var(--gn-danger)";
  if (s >= 4) return "#f97316";
  if (s >= 3) return "var(--gn-warning)";
  return "var(--gn-success)";
}

function mutToSeverityScore(severity: string): number {
  if (severity === "pathogenic") return 5;
  if (severity === "uncertain")  return 3;
  return 1;
}

interface Outbreak {
  id: string;
  label: string;
  variant: string;
  cases: number;
  severity: number;
  x: string;
  y: string;
}

interface FeedItem {
  time: string;
  label: string;
  severity: "high" | "med" | "low";
  position?: number;
}

export function VirusTracker() {
  const [outbreaks, setOutbreaks]     = useState<Outbreak[]>([]);
  const [selected, setSelected]       = useState<Outbreak | null>(null);
  const [timeIdx, setTimeIdx]         = useState(11);
  const [feedItems, setFeedItems]     = useState<FeedItem[]>([]);
  const [chartData, setChartData]     = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading]         = useState(true);
  const [fileName, setFileName]       = useState<string>("");
  const feedRef                       = useRef<FeedItem[]>([]);

  const [allMutations, setAllMutations] = useState<any[]>([]);
  const [windowMutations, setWindowMutations] = useState<any[]>([]);

  useEffect(() => {
    // Load real mutation data first
    fetch("/api/visualization/mutations-raw")
      .then((r) => r.json())
      .then((data) => {
        const mutations: Array<{ position: number; reference: string; query: string; severity: string; sub: string }> =
          data.mutations || [];
        setFileName(data.fileName || "");
        setAllMutations(mutations);

        if (mutations.length > 0) {
          // Map mutations to geographic outbreak markers
          const builtOutbreaks: Outbreak[] = mutations
            .filter((m) => m.severity === "pathogenic" || m.severity === "uncertain")
            .slice(0, GEO_REGIONS.length)
            .map((m, i) => {
              const geo = GEO_REGIONS[i % GEO_REGIONS.length];
              return {
                id: `outbreak-${i}`,
                label: geo.region,
                variant: m.sub,
                cases: Math.round((m.position / 30) * 1000),
                severity: mutToSeverityScore(m.severity),
                x: geo.x,
                y: geo.y,
              };
            });
          setOutbreaks(builtOutbreaks);

          // Build 12-segment chart from mutation positions
          const maxPos = Math.max(...mutations.map((m) => m.position), 1);
          const chart = Array(12).fill(0);
          mutations.forEach((m) => {
            const seg = Math.min(11, Math.floor((m.position / maxPos) * 12));
            chart[seg] += m.severity === "pathogenic" ? 3 : m.severity === "uncertain" ? 2 : 1;
          });
          setChartData(chart);

          // Seed live feed
          const initialFeed: FeedItem[] = mutations.slice(0, 5).map((m) => ({
            time: "Analysis",
            label: `${m.sub} variant detected at position ${m.position}`,
            severity: m.severity === "pathogenic" ? "high" : m.severity === "uncertain" ? "med" : "low",
            position: m.position,
          }));
          setFeedItems(initialFeed);
          feedRef.current = initialFeed;

          // Stream remaining mutations through the live feed
          mutations.slice(5).forEach((m, i) => {
            setTimeout(() => {
              const item: FeedItem = {
                time: `+${i + 1}s`,
                label: `${m.sub} @ pos ${m.position} — ${m.severity} impact`,
                severity: m.severity === "pathogenic" ? "high" : m.severity === "uncertain" ? "med" : "low",
                position: m.position,
              };
              feedRef.current = [item, ...feedRef.current.slice(0, 9)];
              setFeedItems([...feedRef.current]);
            }, (i + 1) * 800);
          });
        } else {
          // Fallback to viz microservice
          Promise.all([
            fetch("http://localhost:4500/api/viz/virus/outbreaks", { headers: { "x-api-key": "genonexus-viz-api-key-change-in-production" }, signal: AbortSignal.timeout(3000) }),
            fetch("http://localhost:4500/api/viz/virus/timeseries?months=12", { headers: { "x-api-key": "genonexus-viz-api-key-change-in-production" }, signal: AbortSignal.timeout(3000) }),
          ])
            .then(([outRes, serRes]) => Promise.all([outRes.json(), serRes.json()]))
            .then(([outData, serData]) => {
              if (outData.success) setOutbreaks(outData.data);
              if (serData.success) setChartData(serData.data.data);
            })
            .catch(() => { /* viz service offline */ });

          try {
            const ws = new WebSocket("ws://localhost:4500/ws/virus-stream?apiKey=genonexus-viz-api-key-change-in-production");
            ws.onmessage = (event) => {
              try {
                const message = JSON.parse(event.data);
                if (message.type === "mutation_update") {
                  const item: FeedItem = { time: message.data.time || "Live", label: message.data.label || `Variant ${message.data.variant} detected`, severity: message.data.severity || "low" };
                  feedRef.current = [item, ...feedRef.current.slice(0, 9)];
                  setFeedItems([...feedRef.current]);
                }
              } catch { /* ignore parse errors */ }
            };
            ws.onerror = () => ws.close();
          } catch { /* WebSocket unavailable */ }
        }
      })
      .catch(() => { /* offline */ })
      .finally(() => setLoading(false));
  }, []);

  // Update window mutations when slider moves
  useEffect(() => {
    if (allMutations.length === 0) return;
    const maxPos = Math.max(...allMutations.map((m) => m.position), 1);
    const segSize = maxPos / 12;
    const lo = timeIdx * segSize;
    const hi = (timeIdx + 1) * segSize;
    setWindowMutations(allMutations.filter((m) => m.position >= lo && m.position < hi));
  }, [timeIdx, allMutations]);

  const maxVal = Math.max(...chartData, 1);
  const SEGMENT_LABELS = ["Seg 1", "Seg 2", "Seg 3", "Seg 4", "Seg 5", "Seg 6", "Seg 7", "Seg 8", "Seg 9", "Seg 10", "Seg 11", "Seg 12"];

  return (
    <div className={styles.wrapper}>
      {/* Map */}
      <div className={styles.mapArea}>
        <div className={styles.mapHeader}>
          <span className={styles.mapTitle}>
            🌍 {fileName ? `Variant Distribution — ${fileName}` : "Global Outbreak Map"}
          </span>
          <span className={styles.liveTag}><span className={styles.liveDot} />{fileName ? "From Analysis" : "Live Tracking"}</span>
        </div>
        <div className={styles.mapContainer}>
          <svg className={styles.worldMap} viewBox="0 0 900 450" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 9 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 50} x2="900" y2={i * 50} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
            {Array.from({ length: 19 }).map((_, i) => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="450" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
            <path d="M80,60 L200,50 L230,120 L200,200 L150,220 L100,180 L60,140 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <path d="M160,240 L230,230 L250,320 L220,390 L170,400 L140,340 L130,270 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <path d="M370,40 L460,35 L480,80 L450,120 L400,130 L360,100 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <path d="M380,140 L460,130 L490,230 L460,340 L400,350 L360,260 L350,180 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <path d="M480,80 L620,70 L680,120 L700,180 L650,200 L580,190 L500,160 L470,120 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <path d="M620,180 L700,160 L740,220 L720,280 L670,270 L630,240 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <path d="M680,290 L780,280 L800,350 L760,390 L700,380 L670,340 Z" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          </svg>

          {loading ? (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--gn-white)" }}>Loading variant data…</div>
          ) : outbreaks.map((o) => (
            <button
              key={o.id}
              className={`${styles.outbreakMarker} ${selected?.id === o.id ? styles.markerSelected : ""}`}
              style={{ left: o.x, top: o.y, "--color": severityColor(o.severity) } as React.CSSProperties}
              onClick={() => setSelected(selected?.id === o.id ? null : o)}
              title={o.label}
            >
              <span className={styles.markerPulse} style={{ background: severityColor(o.severity) }} />
              <span className={styles.markerCore} style={{ background: severityColor(o.severity) }} />
            </button>
          ))}

          {selected && (
            <div className={styles.popup} style={{ left: selected.x, top: selected.y }}>
              <button className={styles.popupClose} onClick={() => setSelected(null)}>✕</button>
              <p className={styles.popupRegion}>{selected.label}</p>
              <p className={styles.popupVariant} style={{ color: severityColor(selected.severity) }}>{selected.variant} Variant</p>
              <p className={styles.popupCases}>{selected.cases.toLocaleString()} variant occurrences</p>
              <div className={styles.popupSeverity}>
                Severity: {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={styles.severityDot} style={{ background: i < selected.severity ? severityColor(selected.severity) : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom panels */}
      <div className={styles.bottomRow}>
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>📈 Variant Density — Segment {timeIdx + 1}/12</span>
            <span style={{ fontSize: "0.72rem", color: "var(--gn-primary)", fontWeight: 700 }}>{windowMutations.length} variants in window</span>
          </div>
          <div className={styles.chartArea}>
            {chartData.map((val, i) => (
              <div
                key={i}
                className={styles.bar}
                style={{
                  height: `${(val / maxVal) * 100}%`,
                  background: i === timeIdx ? "var(--gn-danger)" : "var(--gn-primary)",
                  opacity: i === timeIdx ? 1 : 0.35 + (i / 12) * 0.3,
                  transform: i === timeIdx ? "scaleY(1.05)" : "scaleY(1)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onClick={() => setTimeIdx(i)}
                title={`Segment ${i + 1}: ${val} variants`}
              />
            ))}
          </div>
          <input type="range" min={0} max={11} value={timeIdx} onChange={(e) => setTimeIdx(Number(e.target.value))} className={styles.timeSlider} />
          {/* Window mutations list */}
          <div style={{ marginTop: "0.5rem", maxHeight: "60px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
            {windowMutations.slice(0, 4).map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.68rem", color: "#aaa" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.severity === "pathogenic" ? "var(--gn-danger)" : m.severity === "uncertain" ? "var(--gn-warning)" : "var(--gn-success)", flexShrink: 0 }} />
                {m.sub} @ pos {m.position} — <span style={{ color: m.severity === "pathogenic" ? "var(--gn-danger)" : m.severity === "uncertain" ? "var(--gn-warning)" : "var(--gn-success)" }}>{m.severity}</span>
              </div>
            ))}
            {windowMutations.length === 0 && <span style={{ fontSize: "0.68rem", color: "#555" }}>No variants in this segment</span>}
          </div>
        </div>

        <div className={styles.feedPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>⚡ {fileName ? "Mutation Feed" : "Live Mutation Feed"}</span>
            <span className={styles.liveDot} />
          </div>
          <div className={styles.feedList}>
            {feedItems.length === 0 ? (
              <div style={{ color: "#666", padding: "1rem" }}>
                {loading ? "Loading mutations…" : "No mutations found. Run an analysis first."}
              </div>
            ) : feedItems.map((item, i) => (
              <div key={i} className={`${styles.feedItem} ${i === 0 ? styles.feedItemNew : ""}`}>
                <span className={styles.feedDot} style={{ background: item.severity === "high" ? "var(--gn-danger)" : item.severity === "med" ? "var(--gn-warning)" : "var(--gn-success)" }} />
                <div className={styles.feedContent}>
                  <span className={styles.feedText}>{item.label}</span>
                  <span className={styles.feedTime}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
