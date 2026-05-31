"use client";

import { useRouter } from "next/navigation";
import styles from "./PipelineEngine.module.css";
import { Pipeline } from "../collab-data";

interface Props {
  pipelines: Pipeline[];
  onToggle: (id: string, action: "pause" | "resume" | "stop") => void;
  onSpawn: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  running: "#3b82f6",
  completed: "#10b981",
  failed: "#f43f5e",
  paused: "#f59e0b",
  queued: "#64748b",
};

export default function PipelineEngine({ pipelines, onToggle, onSpawn }: Props) {
  const router = useRouter();

  // Find the most relevant pipeline to visualize (e.g. the first running one, or just the first one)
  const activePipe = pipelines.find(p => p.status === "running") || pipelines[0];

  // Helper to determine style based on pipeline stage
  const getStageStatus = (stageName: string) => {
    if (!activePipe) return "pending";
    const stage = activePipe.stages.find(s => s.name === stageName);
    return stage ? stage.status : "pending";
  };

  const getStageColor = (status: string, baseColor: string) => {
    if (status === "done") return baseColor;
    if (status === "active") return baseColor;
    return "#334155"; // dim when pending
  };

  const getStageOpacity = (status: string) => {
    if (status === "done") return 0.8;
    if (status === "active") return 0.5;
    return 0.1;
  };

  return (
    <div style={{ display: "contents" }}>
      <div className={styles.panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <h2>Pipeline Engine</h2>
        </div>
        <button className={styles.spawnBtn} onClick={onSpawn} title="Launch Demo Pipeline">
          🚀 Launch Pipeline
        </button>
      </div>

      <div className={styles.pipelineList}>
        {pipelines.map(pipe => (
          <div
            key={pipe.id}
            className={styles.pipelineCard}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/dashboard/collaboration/pipeline/${pipe.id}`)}
          >
            <div className={styles.pipeTop}>
              <span className={styles.pipeName}>{pipe.name}</span>
              <span className={styles.pipeStatus} style={{ color: STATUS_COLORS[pipe.status] }}>
                {pipe.status.toUpperCase()}
              </span>
            </div>

            <div className={styles.pipeBarTrack}>
              <div
                className={styles.pipeBarFill}
                style={{
                  width: `${pipe.progress}%`,
                  background: STATUS_COLORS[pipe.status],
                  animation: pipe.status === "running" ? "pipeGlow 2s infinite" : "none",
                }}
              />
            </div>

            <div className={styles.pipeInfo}>
              <span className={styles.pipeProgress}>{pipe.progress}%</span>
              {pipe.eta && <span className={styles.pipeEta}>ETA: {pipe.eta}</span>}
            </div>

            {/* Controls — stop propagation so they don't navigate */}
            <div className={styles.pipeControls} onClick={e => e.stopPropagation()}>
              {pipe.status === "running" && (
                <>
                  <button className={styles.pipeCtrlBtn} onClick={() => onToggle(pipe.id, "pause")} title="Pause">⏸</button>
                  <button className={styles.pipeCtrlBtnDanger} onClick={() => onToggle(pipe.id, "stop")} title="Stop">⏹</button>
                </>
              )}
              {pipe.status === "paused" && (
                <button className={styles.pipeCtrlBtn} onClick={() => onToggle(pipe.id, "resume")} title="Resume">▶</button>
              )}
              <button
                className={styles.pipeCtrlBtn}
                onClick={() => router.push(`/dashboard/collaboration/pipeline/${pipe.id}`)}
                title="View Logs"
              >
                📋
              </button>
            </div>

            {/* Stage DAG */}
            <div className={styles.stageDag}>
              {pipe.stages.map((stage, i) => (
                <div key={i} className={styles.stageNode}>
                  <div className={`${styles.stageCircle} ${styles[`stage_${stage.status}`]}`} />
                  {i < pipe.stages.length - 1 && (
                    <div className={`${styles.stageConnector} ${stage.status === "done" ? styles.connectorDone : ""}`} />
                  )}
                  <span className={styles.stageLabel}>{stage.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline DAG Visualization */}
      <div className={styles.dataNodeMap}>
        <h3>Workflow Topology</h3>
        <div className={styles.nodeMapGfx}>
          <svg width="100%" height="140" viewBox="0 0 240 140">
            {/* Nodes */}
            <circle cx="30" cy="40" r="14" fill={getStageColor(getStageStatus("QC"), "#10b981")} fillOpacity={getStageOpacity(getStageStatus("QC"))} stroke={getStageColor(getStageStatus("QC"), "#10b981")} strokeWidth="2" />
            <circle cx="120" cy="25" r="12" fill={getStageColor(getStageStatus("Align"), "#6366f1")} fillOpacity={getStageOpacity(getStageStatus("Align"))} stroke={getStageColor(getStageStatus("Align"), "#6366f1")} strokeWidth="2" />
            <circle cx="210" cy="45" r="14" fill={getStageColor(getStageStatus("Call"), "#06b6d4")} fillOpacity={getStageOpacity(getStageStatus("Call"))} stroke={getStageColor(getStageStatus("Call"), "#06b6d4")} strokeWidth="2" />
            <circle cx="75" cy="110" r="10" fill={getStageColor(getStageStatus("Filter"), "#ec4899")} fillOpacity={getStageOpacity(getStageStatus("Filter"))} stroke={getStageColor(getStageStatus("Filter"), "#ec4899")} strokeWidth="2" />
            <circle cx="170" cy="115" r="12" fill={getStageColor(getStageStatus("Annotate"), "#f59e0b")} fillOpacity={getStageOpacity(getStageStatus("Annotate"))} stroke={getStageColor(getStageStatus("Annotate"), "#f59e0b")} strokeWidth="2" />

            {/* Connections with animated flow */}
            <line x1="44" y1="40" x2="108" y2="28" stroke={getStageColor(getStageStatus("Align"), "#10b981")} strokeWidth="1.5" strokeDasharray="4 3" className={getStageStatus("Align") === "active" ? styles.flowLine : ""} />
            <line x1="132" y1="30" x2="197" y2="40" stroke={getStageColor(getStageStatus("Call"), "#6366f1")} strokeWidth="1.5" strokeDasharray="4 3" className={getStageStatus("Call") === "active" ? styles.flowLine : ""} />
            <line x1="38" y1="52" x2="68" y2="102" stroke={getStageColor(getStageStatus("Filter"), "#ec4899")} strokeWidth="1.5" strokeDasharray="4 3" className={getStageStatus("Filter") === "active" ? styles.flowLine : ""} />
            <line x1="85" y1="112" x2="158" y2="115" stroke={getStageColor(getStageStatus("Annotate"), "#f59e0b")} strokeWidth="1.5" strokeDasharray="4 3" className={getStageStatus("Annotate") === "active" ? styles.flowLine : ""} />
            <line x1="178" y1="107" x2="204" y2="57" stroke={getStageColor(getStageStatus("Call"), "#06b6d4")} strokeWidth="1.5" strokeDasharray="4 3" className={getStageStatus("Call") === "active" ? styles.flowLine : ""} />

            {/* Center dots */}
            <circle cx="30" cy="40" r="4" fill={getStageColor(getStageStatus("QC"), "#10b981")} />
            <circle cx="120" cy="25" r="3" fill={getStageColor(getStageStatus("Align"), "#6366f1")} />
            <circle cx="210" cy="45" r="4" fill={getStageColor(getStageStatus("Call"), "#06b6d4")} />
            <circle cx="75" cy="110" r="3" fill={getStageColor(getStageStatus("Filter"), "#ec4899")} />
            <circle cx="170" cy="115" r="3" fill={getStageColor(getStageStatus("Annotate"), "#f59e0b")} />

            {/* Labels */}
            <text x="30" y="65" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">QC</text>
            <text x="120" y="8" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Align</text>
            <text x="210" y="70" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Call</text>
            <text x="75" y="130" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Filter</text>
            <text x="170" y="135" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Annotate</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
