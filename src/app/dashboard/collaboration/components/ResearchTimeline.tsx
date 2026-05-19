"use client";

import { useState, useMemo } from "react";
import styles from "./ResearchTimeline.module.css";
import { TimelineEvent } from "../collab-data";
import { Contributor, ContributionData } from "@/hooks/useCollabStats";

interface Props {
  timeline: TimelineEvent[];
  contributors?: Contributor[];
  contributions?: Record<string, ContributionData[]>;
  loading: boolean;
}

const EVENT_ICONS: Record<string, string> = {
  version: "📦",
  milestone: "🏆",
  edit: "✏️",
  access: "🔐",
};

const EVENT_COLORS: Record<string, string> = {
  version: "#6366f1",
  milestone: "#10b981",
  edit: "#f59e0b",
  access: "#06b6d4",
};

export default function ResearchTimeline({ timeline, contributors, contributions, loading }: Props) {
  const [showGraph, setShowGraph] = useState(false);
  const [activeUser, setActiveUser] = useState<string>("Workspace");

  // Contribution grid — maps exact dates and real counts
  const contributionGrid = useMemo(() => {
    const dateCounts: Record<string, number> = {};
    if (contributions && contributions[activeUser]) {
      contributions[activeUser].forEach(c => {
        dateCounts[c.date] = c.count;
      });
    }

    const grid: { date: string; level: number; count: number }[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Exact 52 weeks = 364 days
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 363);

    let currentDate = new Date(startDate);

    for (let w = 0; w < 52; w++) {
      const week: { date: string; level: number; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const count = dateCounts[dateStr] || 0;
        
        let level = 0;
        if (count > 0) level = 1;
        if (count > 3) level = 2;
        if (count > 7) level = 3;
        if (count > 15) level = 4;

        week.push({ date: dateStr, level, count });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      grid.push(week);
    }
    
    // Compute month labels
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, w) => {
      if (!week[0]) return;
      const month = new Date(week[0].date).getMonth();
      if (month !== lastMonth) {
        if (w !== 0 || new Date(week[0].date).getDate() <= 15) {
          monthLabels.push({
            label: new Date(week[0].date).toLocaleString("default", { month: "short" }),
            colIndex: w,
          });
        }
        lastMonth = month;
      }
    });

    return { grid, monthLabels };
  }, [activeUser, contributions]);

  return (
    <div className={styles.timelineSection}>
      <div className={styles.timelineHeader}>
        <div className={styles.headerLeft}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h3>Research History &amp; Audit Trail</h3>
        </div>
        <button className={styles.contribBtn} onClick={() => setShowGraph(!showGraph)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          View Contributions
        </button>
      </div>

      {showGraph && (
        <div className={styles.contribGraphContainer}>
          <div className={styles.contribHeader}>
            <div className={styles.contribTabs}>
              <button
                className={`${styles.contribTab} ${activeUser === "Workspace" ? styles.activeTab : ""}`}
                onClick={() => setActiveUser("Workspace")}
              >
                Workspace
              </button>
              {contributors?.map(member => (
                <button
                  key={member.id}
                  className={`${styles.contribTab} ${activeUser === member.id ? styles.activeTab : ""}`}
                  onClick={() => setActiveUser(member.id)}
                  title={member.name}
                >
                  {member.initials}
                </button>
              ))}
            </div>
            <span className={styles.contribTitle}>
              {activeUser === "Workspace"
                ? "Total Workspace Contributions"
                : `${contributors?.find(m => m.id === activeUser)?.name}'s Contributions`}
            </span>
          </div>
          <div className={styles.contribGraphScroll}>
            <div style={{ position: "relative", marginBottom: "4px", height: "16px" }}>
              {contributionGrid.monthLabels.map((m, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${m.colIndex * 15}px`,
                    fontSize: "0.65rem",
                    color: "var(--gn-text-muted)",
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className={styles.contribGrid}>
              {contributionGrid.grid.map((week, w) => (
                <div key={w} className={styles.contribWeek}>
                  {week.map((cell, d) => (
                    <div
                      key={d}
                      className={`${styles.contribDay} ${styles[`level_${cell.level}`]}`}
                      title={`${cell.count > 0 ? cell.count : "No"} contributions on ${new Date(cell.date).toLocaleDateString()}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.contribLegend}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(l => (
              <div key={l} className={`${styles.contribDay} ${styles[`level_${l}`]}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      )}

      <div className={styles.timelineScroll}>
        <div className={styles.timelineTrack} />

        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.timelineEvent} style={{ opacity: 0.4 }}>
              <div className={styles.timelineEventDot} style={{ background: "#334155" }} />
              <div className={styles.timelineEventCard}>
                <div style={{ height: "0.8rem", width: "60%", background: "#1e293b", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: "0.65rem", width: "90%", background: "#1e293b", borderRadius: 4 }} />
              </div>
            </div>
          ))}

        {!loading && timeline.length === 0 && (
          <div style={{ color: "#64748b", fontSize: "0.78rem", padding: "1.5rem 0.5rem", textAlign: "center" }}>
            No analysis history yet. Run your first analysis to see the audit trail here.
          </div>
        )}

        {!loading && timeline.map(event => (
          <div key={event.id} className={styles.timelineEvent}>
            <div
              className={styles.timelineEventDot}
              style={{
                background: EVENT_COLORS[event.type],
                boxShadow: `0 0 8px ${EVENT_COLORS[event.type]}50`,
              }}
            />
            <div className={styles.timelineEventCard}>
              <div className={styles.timelineEventTop}>
                <span className={styles.timelineEventIcon}>{EVENT_ICONS[event.type]}</span>
                <span className={styles.timelineEventTitle}>{event.title}</span>
                <span
                  className={styles.timelineEventType}
                  style={{ color: EVENT_COLORS[event.type], borderColor: `${EVENT_COLORS[event.type]}40` }}
                >
                  {event.type}
                </span>
              </div>
              <p className={styles.timelineEventDetail}>{event.detail}</p>
              <div className={styles.timelineEventMeta}>
                <span>{event.author}</span>
                <span>{event.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
