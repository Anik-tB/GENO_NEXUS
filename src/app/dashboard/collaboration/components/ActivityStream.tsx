"use client";

import { useState } from "react";
import styles from "./ActivityStream.module.css";
import { ActivityEntry, TeamMember } from "../collab-data";

interface Props {
  streams: ActivityEntry[];
  members: TeamMember[];
}

const TYPE_COLORS: Record<string, string> = {
  model: "#3b82f6",
  data: "#10b981",
  pipeline: "#d946ef",
  note: "#94a3b8",
  alert: "#f59e0b",
  mutation: "#ec4899",
};

export default function ActivityStream({ streams, members }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const typingMembers = members.filter(m => m.typing && m.status !== "offline");

  return (
    <>
      <div className={styles.panelHeader}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <h2>Live Activity Stream</h2>
        <span className={styles.liveStreamDot} />
      </div>

      {typingMembers.length > 0 && (
        <div className={styles.typingIndicator}>
          <div className={styles.typingDots}>
            <span /><span /><span />
          </div>
          <span>
            {typingMembers.map(m => m.name.split(" ").pop()).join(", ")}{" "}
            {typingMembers.length === 1 ? "is" : "are"} typing...
          </span>
        </div>
      )}

      <div className={styles.activityFeed}>
        <div className={styles.timelineLine} />
        {streams.map((stream, idx) => (
          <div
            key={stream.id}
            className={`${styles.streamItem} ${idx === 0 ? styles.streamItemNew : ""}`}
            onClick={() => setExpandedId(expandedId === stream.id ? null : stream.id)}
          >
            <div className={styles.streamDot} style={{ background: TYPE_COLORS[stream.type] || "#64748b" }} />
            <div className={styles.streamCard} style={{ cursor: "pointer" }}>
              <div className={styles.streamHeader}>
                <span className={styles.streamAuthor}>{stream.author}</span>
                <span className={styles.streamTime}>{stream.time}</span>
              </div>
              <p className={styles.streamDesc}>{stream.desc}</p>
              <div className={styles.streamFooter}>
                <span
                  className={styles.streamTypeBadge}
                  style={{
                    background: `${TYPE_COLORS[stream.type]}15`,
                    color: TYPE_COLORS[stream.type],
                    borderColor: `${TYPE_COLORS[stream.type]}30`,
                  }}
                >
                  {stream.type}
                </span>
                {stream.region && (
                  <span className={styles.regionBadge}>
                    📍 {stream.region}
                  </span>
                )}
                <span className={styles.expandHint}>
                  {expandedId === stream.id ? "↑ Collapse" : "↓ Expand"}
                </span>
              </div>
              {expandedId === stream.id && (
                <div className={styles.expandedMock}>
                  <div className={styles.expandedLog}>
                    [System] Authenticated via Token-RSA · Operation ID: {stream.id.toString(16)}
                  </div>
                  <div className={styles.expandedLog}>
                    [Trace] Latency: {Math.floor(Math.random() * 80 + 10)}ms · Node: compute-{Math.floor(Math.random() * 4) + 1}
                  </div>
                  {stream.region && (
                    <button className={styles.openVizBtn}>
                      🔬 Open in Genome Browser
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
