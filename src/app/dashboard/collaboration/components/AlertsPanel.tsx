"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SciAlert } from "../collab-data";

interface Props {
  alerts: SciAlert[];
  onDismiss: (id: number) => void;
  visible: boolean;
  onClose: () => void;
}

type Filter = "all" | "critical" | "warning" | "info";

const ICONS: Record<string, string> = {
  pathogenic: "🧬",
  outbreak: "🦠",
  analysis_failed: "⚠️",
  drug_gene: "💊",
  pipeline: "⚡",
};

const TYPE_COLORS: Record<string, { bar: string; bg: string; border: string; badge: string; text: string }> = {
  critical: {
    bar:    "#f43f5e",
    bg:     "rgba(244,63,94,0.07)",
    border: "rgba(244,63,94,0.22)",
    badge:  "rgba(244,63,94,0.18)",
    text:   "#fda4af",
  },
  warning: {
    bar:    "#f59e0b",
    bg:     "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.22)",
    badge:  "rgba(245,158,11,0.18)",
    text:   "#fcd34d",
  },
  info: {
    bar:    "#6366f1",
    bg:     "rgba(99,102,241,0.07)",
    border: "rgba(99,102,241,0.22)",
    badge:  "rgba(99,102,241,0.18)",
    text:   "#a5b4fc",
  },
};

function Drawer({ alerts, onDismiss, visible, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (!visible) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [visible, onClose]);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  if (!ready || !visible) return null;

  const active = alerts.filter(a => !a.dismissed);
  const shown  = filter === "all" ? active : active.filter(a => a.type === filter);
  const cnt    = (t: string) => active.filter(a => a.type === t).length;

  const tabs: { key: Filter; label: string }[] = [
    { key: "all",      label: `All (${active.length})` },
    { key: "critical", label: `Critical (${cnt("critical")})` },
    { key: "warning",  label: `Warning (${cnt("warning")})` },
    { key: "info",     label: `Info (${cnt("info")})` },
  ];

  /* ── inline styles (immune to CSS-module scoping issues) ── */
  const S = {
    overlay: {
      position:  "fixed",
      inset:     0,
      background: "rgba(2,6,23,0.72)",
      backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)",
      zIndex:    99998,
    } as React.CSSProperties,

    panel: {
      position:      "fixed",
      top:           0,
      right:         0,
      bottom:        0,
      width:         "440px",
      maxWidth:      "100vw",
      zIndex:        99999,
      display:       "flex",
      flexDirection: "column",
      background:    "linear-gradient(160deg,#0d1117 0%,#0c1424 100%)",
      borderLeft:    "1px solid rgba(255,255,255,0.08)",
      boxShadow:     "-28px 0 80px rgba(0,0,0,0.85)",
      animation:     "gnSlideIn 0.32s cubic-bezier(0.16,1,0.3,1) both",
      overflow:      "hidden",
    } as React.CSSProperties,

    header: {
      display:        "flex",
      alignItems:     "center",
      gap:            "0.85rem",
      padding:        "1.2rem 1.4rem",
      borderBottom:   "1px solid rgba(255,255,255,0.07)",
      background:     "rgba(255,255,255,0.02)",
      flexShrink:     0,
    } as React.CSSProperties,

    iconBox: {
      width:          "38px",
      height:         "38px",
      borderRadius:   "10px",
      background:     "rgba(245,158,11,0.1)",
      border:         "1px solid rgba(245,158,11,0.25)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      flexShrink:     0,
    } as React.CSSProperties,

    titleGroup: { flex: 1, minWidth: 0 } as React.CSSProperties,

    h2: {
      margin:      0,
      fontSize:    "0.95rem",
      fontWeight:  700,
      color:       "#f1f5f9",
      lineHeight:  1.2,
    } as React.CSSProperties,

    sub: {
      display:    "block",
      marginTop:  "0.1rem",
      fontSize:   "0.67rem",
      color:      "#475569",
    } as React.CSSProperties,

    badge: {
      background:   "rgba(244,63,94,0.18)",
      color:        "#fda4af",
      fontSize:     "0.68rem",
      fontWeight:   800,
      padding:      "0.2rem 0.65rem",
      borderRadius: "999px",
      border:       "1px solid rgba(244,63,94,0.3)",
      flexShrink:   0,
    } as React.CSSProperties,

    closeBtn: {
      width:          "34px",
      height:         "34px",
      borderRadius:   "8px",
      background:     "rgba(255,255,255,0.04)",
      border:         "1px solid rgba(255,255,255,0.08)",
      color:          "#64748b",
      fontSize:       "1rem",
      cursor:         "pointer",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      flexShrink:     0,
      transition:     "all 0.18s",
    } as React.CSSProperties,

    tabs: {
      display:      "flex",
      gap:          "0.25rem",
      padding:      "0.6rem 1rem",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      flexShrink:   0,
      overflowX:    "auto",
    } as React.CSSProperties,

    list: {
      flex:           1,
      overflowY:      "auto",
      padding:        "1rem",
      display:        "flex",
      flexDirection:  "column",
      gap:            "0.75rem",
    } as React.CSSProperties,

    empty: {
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      flex:           1,
      padding:        "4rem 2rem",
      textAlign:      "center",
      color:          "#475569",
    } as React.CSSProperties,

    footer: {
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      padding:        "0.85rem 1.25rem",
      borderTop:      "1px solid rgba(255,255,255,0.06)",
      flexShrink:     0,
      background:     "rgba(255,255,255,0.01)",
    } as React.CSSProperties,
  };

  const content = (
    <>
      {/* keyframe injected once */}
      <style>{`
        @keyframes gnSlideIn {
          from { transform: translateX(100%); opacity: .7; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes gnCardIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Overlay */}
      <div style={S.overlay} onClick={onClose} />

      {/* Panel */}
      <aside style={S.panel}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.iconBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <div style={S.titleGroup}>
            <h2 style={S.h2}>Scientific Alerts</h2>
            <span style={S.sub}>Real-time genomic notifications</span>
          </div>

          {active.length > 0 && <span style={S.badge}>{active.length}</span>}

          <button
            style={S.closeBtn}
            onClick={onClose}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f43f5e";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(244,63,94,0.35)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >✕</button>
        </div>

        {/* Filter tabs */}
        <div style={S.tabs}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding:      "0.3rem 0.85rem",
                borderRadius: "7px",
                fontSize:     "0.68rem",
                fontWeight:   600,
                cursor:       "pointer",
                border:       filter === t.key ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                background:   filter === t.key ? "rgba(255,255,255,0.09)" : "transparent",
                color:        filter === t.key ? "#e2e8f0" : "#475569",
                transition:   "all 0.15s",
                whiteSpace:   "nowrap",
                letterSpacing:"0.02em",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={S.list}>
          {shown.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>✓</div>
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.9rem", fontWeight: 600, color: "#64748b" }}>All clear</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
                {filter === "all" ? "No active alerts right now." : `No ${filter} alerts.`}
              </p>
            </div>
          ) : (
            shown.map((alert, i) => {
              const c = TYPE_COLORS[alert.type] ?? TYPE_COLORS.info;
              return (
                <div
                  key={alert.id}
                  style={{
                    borderRadius:  "12px",
                    padding:       "1rem 1.1rem 1rem 1.4rem",
                    background:    c.bg,
                    border:        `1px solid ${c.border}`,
                    position:      "relative",
                    animation:     `gnCardIn 0.3s ease ${i * 40}ms both`,
                    cursor:        "pointer",
                  }}
                >
                  {/* Left accent bar */}
                  <div style={{
                    position:     "absolute",
                    left:         0,
                    top:          0,
                    bottom:       0,
                    width:        "3px",
                    borderRadius: "12px 0 0 12px",
                    background:   c.bar,
                  }} />

                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem" }}>
                    <span style={{ fontSize: "1rem", lineHeight: 1 }}>
                      {ICONS[alert.category] ?? "🔔"}
                    </span>
                    <span style={{
                      fontSize:     "0.6rem",
                      fontWeight:   800,
                      textTransform:"uppercase",
                      letterSpacing:"0.08em",
                      padding:      "0.15rem 0.5rem",
                      borderRadius: "4px",
                      background:   c.badge,
                      color:        c.text,
                    }}>
                      {alert.type}
                    </span>
                    <span style={{ fontSize: "0.62rem", color: "#475569", marginLeft: "auto" }}>
                      {alert.time}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 style={{
                    margin:     "0 0 0.4rem",
                    fontSize:   "0.875rem",
                    fontWeight: 600,
                    color:      "#f1f5f9",
                    lineHeight: 1.35,
                  }}>
                    {alert.title}
                  </h4>

                  {/* Description */}
                  <p style={{
                    margin:     "0 0 0.9rem",
                    fontSize:   "0.775rem",
                    color:      "#94a3b8",
                    lineHeight: 1.6,
                  }}>
                    {alert.desc}
                  </p>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      style={{
                        padding:      "0.32rem 0.8rem",
                        background:   "rgba(16,185,129,0.1)",
                        border:       "1px solid rgba(16,185,129,0.3)",
                        color:        "#34d399",
                        fontSize:     "0.7rem",
                        fontWeight:   600,
                        borderRadius: "6px",
                        cursor:       "pointer",
                      }}
                    >
                      ✓ Acknowledge
                    </button>
                    <button
                      style={{
                        padding:      "0.32rem 0.8rem",
                        background:   "rgba(255,255,255,0.04)",
                        border:       "1px solid rgba(255,255,255,0.09)",
                        color:        "#64748b",
                        fontSize:     "0.7rem",
                        fontWeight:   600,
                        borderRadius: "6px",
                        cursor:       "pointer",
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {active.length > 0 && (
          <div style={S.footer}>
            <span style={{ fontSize: "0.68rem", color: "#475569" }}>
              {active.length} active alert{active.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => active.forEach(a => onDismiss(a.id))}
              style={{
                fontSize:     "0.72rem",
                fontWeight:   600,
                color:        "#10b981",
                background:   "none",
                border:       "none",
                cursor:       "pointer",
                padding:      "0.3rem 0.65rem",
                borderRadius: "6px",
              }}
            >
              Acknowledge All
            </button>
          </div>
        )}
      </aside>
    </>
  );

  return createPortal(content, document.body);
}

export default function AlertsPanel(props: Props) {
  return <Drawer {...props} />;
}
