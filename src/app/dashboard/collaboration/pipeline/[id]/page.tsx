"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCollabStats } from "@/hooks/useCollabStats";
import { useCollabWebSocket } from "@/hooks/useCollabWebSocket";

interface PipelineStage { name: string; status: string; }

interface Pipeline {
  id: string;
  name: string;
  status: string;
  progress: number;
  eta?: string;
  stages: PipelineStage[];
  logs: string[];
}

const STATUS_COLORS: Record<string, string> = {
  running:   "#3b82f6",
  completed: "#10b981",
  failed:    "#f43f5e",
  paused:    "#f59e0b",
  queued:    "#64748b",
};

const STATUS_ICONS: Record<string, string> = {
  running:   "⚡",
  completed: "✅",
  failed:    "❌",
  paused:    "⏸",
  queued:    "🕐",
};

const STAGE_COLORS: Record<string, string> = {
  done:    "#10b981",
  active:  "#3b82f6",
  pending: "#334155",
};

const STAGE_DESCRIPTIONS: Record<string, { title: string; desc: string }> = {
  "QC":       { title: "Quality Control", desc: "Checking sequencing read qualities and removing adapters" },
  "Parse":    { title: "Sequence Parsing", desc: "Extracting and validating raw genomic data" },
  "Align":    { title: "Sequence Alignment", desc: "Mapping genomic reads to the reference genome" },
  "Call":     { title: "Variant Calling", desc: "Identifying SNPs and Insertions/Deletions (Indels)" },
  "Filter":   { title: "Variant Filtering", desc: "Removing false positive and low-quality variant calls" },
  "Annotate": { title: "Variant Annotation", desc: "Predicting biological and functional effects of variants" },
  "Report":   { title: "Clinical Report", desc: "Generating final diagnostic and pathogenic insights" },
};

interface PageProps { params: Promise<{ id: string }> }

export default function PipelineDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { activeUser } = useCollabStats();
  const { pipelines, wsStatus } = useCollabWebSocket(activeUser);

  const pipe = pipelines.find(p => p.id === id) ?? null;

  // We are "loading" if the WS hasn't connected yet and hasn't fallen back to offline mode
  const loading = wsStatus === "connecting" || wsStatus === "reconnecting";

  if (loading && !pipe) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"1rem", color:"#475569" }}>
        <span style={{ fontSize:"3rem", animation:"spin 1.5s linear infinite", display:"inline-block" }}>⚡</span>
        <h2 style={{ margin:0, color:"#94a3b8" }}>Loading pipeline…</h2>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!pipe) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"1rem", color:"#475569" }}>
        <span style={{ fontSize:"3rem" }}>⚡</span>
        <h2 style={{ margin:0, color:"#94a3b8" }}>Pipeline not found</h2>
        <p style={{ margin:0, fontSize:"0.85rem", color:"#475569", maxWidth:"320px", textAlign:"center" }}>
          This pipeline may have been from a previous session. Dynamic pipelines live only in the active server session.
        </p>
        <button onClick={() => router.back()} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8", padding:"0.5rem 1.25rem", borderRadius:"8px", cursor:"pointer" }}>← Go Back</button>
      </div>
    );
  }

  const color = STATUS_COLORS[pipe.status] ?? "#64748b";
  const doneStages = pipe.stages.filter(s => s.status === "done").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem", paddingBottom:"2rem" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.pdc{animation:fadeUp 0.25s ease both}`}</style>

      {/* ── Back + status row ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" }}>
        <button
          onClick={() => router.back()}
          style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", fontSize:"0.8rem", fontWeight:600, padding:"0.4rem 0.9rem", borderRadius:"8px", cursor:"pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Collaboration
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span style={{ background:`${color}18`, color, border:`1px solid ${color}40`, fontSize:"0.65rem", fontWeight:800, padding:"0.2rem 0.6rem", borderRadius:"4px", textTransform:"uppercase", letterSpacing:"0.07em" }}>
            {STATUS_ICONS[pipe.status]} {pipe.status}
          </span>
          {pipe.eta && <span style={{ fontSize:"0.7rem", color:"#f59e0b", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", padding:"0.2rem 0.6rem", borderRadius:"6px", fontWeight:600 }}>ETA: {pipe.eta}</span>}
        </div>
      </div>

      {/* ── Main two-column grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.25rem", alignItems:"start" }}>

        {/* LEFT ── pipeline info */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

          {/* Header card */}
          <div className="pdc" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"1.75rem", borderLeft:`3px solid ${color}`, backdropFilter:"blur(12px)" }}>
            <h1 style={{ margin:"0 0 0.4rem", fontSize:"1.35rem", fontWeight:700, color:"#f8fafc", lineHeight:1.3 }}>{pipe.name}</h1>
            <div style={{ fontSize:"0.72rem", color:"#475569", marginBottom:"1.5rem" }}>
              Pipeline ID: <code style={{ color:"#94a3b8", background:"rgba(255,255,255,0.05)", padding:"0.1rem 0.4rem", borderRadius:"4px" }}>{pipe.id}</code>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom:"1.25rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.73rem", color:"#94a3b8", marginBottom:"0.45rem" }}>
                <span>Overall Progress</span>
                <span style={{ color, fontWeight:700 }}>{pipe.progress}%</span>
              </div>
              <div style={{ height:"7px", background:"rgba(255,255,255,0.07)", borderRadius:"999px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pipe.progress}%`, background:color, borderRadius:"999px", transition:"width 0.6s ease" }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:"2rem", paddingTop:"1.1rem", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div style={{ fontSize:"0.6rem", color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.2rem" }}>Stages Done</div>
                <div style={{ fontSize:"1.15rem", fontWeight:700, color:"#10b981" }}>{doneStages}/{pipe.stages.length}</div>
              </div>
              <div>
                <div style={{ fontSize:"0.6rem", color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.2rem" }}>Status</div>
                <div style={{ fontSize:"1.15rem", fontWeight:700, color }}>{pipe.status}</div>
              </div>
              {pipe.eta && (
                <div>
                  <div style={{ fontSize:"0.6rem", color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.2rem" }}>ETA</div>
                  <div style={{ fontSize:"1.15rem", fontWeight:700, color:"#f59e0b" }}>{pipe.eta}</div>
                </div>
              )}
            </div>
          </div>

          {/* Stage list */}
          <div className="pdc" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1.5rem", animationDelay:"60ms" }}>
            <h3 style={{ margin:"0 0 1rem", fontSize:"0.78rem", fontWeight:700, color:"#f1f5f9", textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Execution Stages
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {pipe.stages.map((stage, i) => {
                const sc = STAGE_COLORS[stage.status] ?? "#334155";
                const info = STAGE_DESCRIPTIONS[stage.name] || { title: stage.name, desc: "Processing genomic data..." };
                
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.9rem", padding:"0.7rem 1rem", background:"rgba(255,255,255,0.02)", border:`1px solid ${sc}25`, borderRadius:"10px", borderLeft:`3px solid ${sc}` }}>
                    <div style={{ width:9, height:9, borderRadius:"50%", background:sc, flexShrink:0, boxShadow: stage.status === "active" ? `0 0 8px ${sc}` : "none" }} />
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.2rem" }}>
                      <span style={{ fontSize:"0.85rem", color:"#f1f5f9", fontWeight:600 }}>{info.title}</span>
                      <span style={{ fontSize:"0.7rem", color:"#94a3b8" }}>{info.desc}</span>
                    </div>
                    <span style={{ fontSize:"0.6rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color:sc, background:`${sc}15`, padding:"0.12rem 0.45rem", borderRadius:"4px" }}>{stage.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT ── logs */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          <div className="pdc" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", overflow:"hidden", animationDelay:"80ms" }}>
            <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" }}>
              <h3 style={{ margin:0, fontSize:"0.78rem", fontWeight:700, color:"#f1f5f9", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Execution Logs
              </h3>
              <div style={{ fontSize:"0.63rem", color:"#475569", marginTop:"0.2rem" }}>{pipe.logs.length} entries</div>
            </div>
            <div style={{ padding:"0.85rem", display:"flex", flexDirection:"column", gap:"0.35rem", maxHeight: pipe.status === "completed" ? "300px" : "auto", overflowY: "auto" }}>
              {pipe.logs.length === 0 && (
                <div style={{ fontSize:"0.75rem", color:"#475569", textAlign:"center", padding:"1rem" }}>No log entries yet.</div>
              )}
              {pipe.logs.map((log, i) => (
                <div key={i} style={{
                  fontFamily:"'JetBrains Mono','Fira Code',monospace",
                  fontSize:"0.7rem",
                  padding:"0.45rem 0.7rem",
                  borderRadius:"6px",
                  background: log.includes("ERROR") ? "rgba(244,63,94,0.06)" : "rgba(255,255,255,0.02)",
                  border: log.includes("ERROR") ? "1px solid rgba(244,63,94,0.18)" : "1px solid rgba(255,255,255,0.04)",
                  color: log.includes("ERROR") ? "#f43f5e" : log.includes("completed") ? "#10b981" : "#64748b",
                  lineHeight:1.5,
                }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Results Card */}
          {pipe.status === "completed" && pipe.result && (
            <div className="pdc" style={{ background:"rgba(16, 185, 129, 0.05)", border:"1px solid rgba(16, 185, 129, 0.2)", borderRadius:"14px", overflow:"hidden", animationDelay:"120ms" }}>
              <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid rgba(16, 185, 129, 0.1)", background:"rgba(16, 185, 129, 0.08)" }}>
                <h3 style={{ margin:0, fontSize:"0.85rem", fontWeight:700, color:"#10b981", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Discovered Variants ({pipe.result.organism})
                </h3>
              </div>
              <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pipe.result.mutations.map((m: any, i: number) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.6rem 0.8rem", background:"rgba(0,0,0,0.2)", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.2rem" }}>
                      <span style={{ fontSize:"0.8rem", color:"#f8fafc", fontWeight:600 }}>Pos: {m.position} ({m.gene})</span>
                      <span style={{ fontSize:"0.65rem", color:"#94a3b8", fontFamily:"monospace" }}>{m.reference} → {m.query}</span>
                    </div>
                    <span style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color: m.severity === "high" ? "#f43f5e" : m.severity === "medium" ? "#f59e0b" : "#10b981", background: m.severity === "high" ? "rgba(244,63,94,0.15)" : m.severity === "medium" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", padding:"0.2rem 0.5rem", borderRadius:"4px" }}>
                      {m.severity} RISK
                    </span>
                  </div>
                ))}

                <button 
                  onClick={() => router.push("/dashboard/visualization")}
                  style={{ marginTop: "0.5rem", width: "100%", padding: "0.75rem", background: "#10b981", color: "#022c22", fontWeight: 700, fontSize: "0.8rem", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "background 0.2s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#059669"}
                  onMouseOut={(e) => e.currentTarget.style.background = "#10b981"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  View 3D Visualization
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
