"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_STREAMS, INCOMING_STREAMS } from "../../collab-data";

const ALL_STREAMS = [...INITIAL_STREAMS, ...INCOMING_STREAMS];

const TYPE_COLORS: Record<string, string> = {
  model:    "#3b82f6",
  data:     "#10b981",
  pipeline: "#d946ef",
  note:     "#94a3b8",
  alert:    "#f59e0b",
  mutation: "#ec4899",
};

const TYPE_ICONS: Record<string, string> = {
  model:    "🧠",
  data:     "📊",
  pipeline: "⚡",
  note:     "📝",
  alert:    "🔔",
  mutation: "🧬",
};

function formatAuthorName(s: string) {
  if (s === "AI") return "Nexus Copilot";
  if (s.includes("@")) return s.split("@")[0];
  return s;
}

interface PageProps { params: Promise<{ id: string }> }

export default function ActivityDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id: rawId } = use(params);
  const id = Number(rawId);
  
  const [stream, setStream] = useState<any>(ALL_STREAMS.find(s => s.id === id) || null);
  const [loading, setLoading] = useState(!stream);

  useEffect(() => {
    if (stream) return; // Already found in static data
    
    fetch("/api/collaboration/stats")
      .then(r => r.json())
      .then(json => {
        if (json?.success && json.data?.streams) {
          const found = json.data.streams.find((s: any) => s.id === id);
          if (found) setStream(found);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, stream]);

  const auditLogs = [
    `[System]  Authenticated via Token-RSA · Operation ID: ${id.toString(16).toUpperCase()}`,
    `[Trace]   Latency: ${(id % 80) + 10}ms · Node: compute-${(id % 4) + 1}`,
    `[Info]    Event dispatched to collaboration workspace`,
    `[Index]   Entry indexed in activity timeline · Seq: ${id + 1000}`,
    stream?.region ? `[GEO]     Region mapped: ${stream.region}` : null,
    `[Audit]   Integrity hash: sha256:${id.toString(36).padStart(12, "0")}...`,
  ].filter(Boolean) as string[];

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"1rem", color:"#475569" }}>
        <h2 style={{ margin:0, color:"#94a3b8" }}>Loading Activity...</h2>
      </div>
    );
  }

  if (!stream) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"1rem", color:"#475569" }}>
        <span style={{ fontSize:"3rem" }}>📭</span>
        <h2 style={{ margin:0, color:"#94a3b8" }}>Activity entry not found</h2>
        <button onClick={() => router.back()} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8", padding:"0.5rem 1.25rem", borderRadius:"8px", cursor:"pointer" }}>← Go Back</button>
      </div>
    );
  }

  const color = TYPE_COLORS[stream.type] ?? "#64748b";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem", maxWidth:"860px", margin:"0 auto", width:"100%", paddingBottom:"2rem" }}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} } .adc{animation:fadeUp 0.25s ease both}`}</style>

      {/* ── Back + badge row ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" }}>
        <button
          onClick={() => router.back()}
          style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", fontSize:"0.8rem", fontWeight:600, padding:"0.4rem 0.9rem", borderRadius:"8px", cursor:"pointer", transition:"all 0.2s" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Collaboration
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span style={{ background:`${color}18`, color, border:`1px solid ${color}40`, fontSize:"0.65rem", fontWeight:800, padding:"0.2rem 0.6rem", borderRadius:"4px", textTransform:"uppercase", letterSpacing:"0.07em" }}>
            {TYPE_ICONS[stream.type]} {stream.type}
          </span>
          <span style={{ fontSize:"0.68rem", color:"#475569", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", padding:"0.2rem 0.55rem", borderRadius:"4px" }}>ID #{id}</span>
        </div>
      </div>

      {/* ── Event card ── */}
      <div className="adc" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"1.75rem", borderLeft:`3px solid ${color}`, backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.1rem" }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`${color}15`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>
            {TYPE_ICONS[stream.type]}
          </div>
          <div>
            <div style={{ fontSize:"0.65rem", color, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.15rem" }}>{stream.type} event</div>
            <div style={{ fontSize:"0.72rem", color:"#64748b" }}>
              by <strong style={{ color:"#94a3b8" }}>{formatAuthorName(stream.author)}</strong> · {stream.time}
            </div>
          </div>
        </div>
        <p style={{ margin:"0 0 1rem", fontSize:"1rem", color:"#f1f5f9", lineHeight:1.65, fontWeight:400 }}>{stream.desc}</p>
        {stream.region && (
          <span style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:"rgba(6,182,212,0.08)", border:"1px solid rgba(6,182,212,0.2)", color:"#06b6d4", borderRadius:"6px", padding:"0.3rem 0.7rem", fontSize:"0.75rem", fontFamily:"monospace" }}>
            📍 {stream.region}
          </span>
        )}
      </div>

      {/* ── Audit trail ── */}
      <div className="adc" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1.5rem", animationDelay:"60ms" }}>
        <h3 style={{ margin:"0 0 1rem", fontSize:"0.78rem", fontWeight:700, color:"#f1f5f9", textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Audit Trail
        </h3>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
          {auditLogs.map((log, i) => (
            <div key={i} style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:"0.73rem", color: log.includes("[Audit]") ? "#818cf8" : log.includes("[GEO]") ? "#06b6d4" : "#64748b", padding:"0.4rem 0.8rem", background:"rgba(255,255,255,0.02)", borderRadius:"6px", border:"1px solid rgba(255,255,255,0.05)", lineHeight:1.5 }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="adc" style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", animationDelay:"120ms" }}>
        {stream.region && (
          <button style={{ padding:"0.55rem 1.1rem", background:`${color}12`, border:`1px solid ${color}30`, color, borderRadius:"8px", fontWeight:600, fontSize:"0.78rem", cursor:"pointer" }}>
            🔬 Open in Genome Browser
          </button>
        )}
        <button onClick={() => router.back()} style={{ padding:"0.55rem 1.1rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"#64748b", borderRadius:"8px", fontWeight:600, fontSize:"0.78rem", cursor:"pointer" }}>
          ← Back to Stream
        </button>
      </div>
    </div>
  );
}
