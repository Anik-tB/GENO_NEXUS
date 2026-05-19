"use client";

import { useState, useMemo } from "react";
import styles from "./ResearchTimeline.module.css";
import { TIMELINE_EVENTS, TEAM } from "../collab-data";

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

export default function ResearchTimeline() {
  const [showGraph, setShowGraph] = useState(false);
  const [activeUser, setActiveUser] = useState<string>("Workspace");

  const contributionGrid = useMemo(() => {
    const grid: number[][] = [];
    for (let w = 0; w < 52; w++) {
      const week: number[] = [];
      for (let d = 0; d < 7; d++) {
        const rand = Math.random();
        let level = 0;
        if (rand > 0.95) level = 4;
        else if (rand > 0.85) level = 3;
        else if (rand > 0.70) level = 2;
        else if (rand > 0.50) level = 1;
        week.push(level);
      }
      grid.push(week);
    }
    return grid;
  }, [activeUser]);

  return (
    <div className={styles.timelineSection}>
      <div className={styles.timelineHeader}>
        <div className={styles.headerLeft}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h3>Research History & Audit Trail</h3>
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
                className={`${styles.contribTab} ${activeUser === 'Workspace' ? styles.activeTab : ''}`}
                onClick={() => setActiveUser('Workspace')}
              >
                Workspace
              </button>
              {TEAM.map(member => (
                <button
                  key={member.id}
                  className={`${styles.contribTab} ${activeUser === member.id ? styles.activeTab : ''}`}
                  onClick={() => setActiveUser(member.id)}
                  title={member.name}
                >
                  {member.id === "AI" ? "🤖" : member.id}
                </button>
              ))}
            </div>
            <span className={styles.contribTitle}>
              {activeUser === 'Workspace' 
                ? 'Total Workspace Contributions' 
                : `${TEAM.find(m => m.id === activeUser)?.name}'s Contributions`}
            </span>
          </div>
          <div className={styles.contribGraphScroll}>
            <div className={styles.contribGrid}>
              {contributionGrid.map((week, w) => (
                <div key={w} className={styles.contribWeek}>
                  {week.map((level, d) => (
                    <div 
                      key={d} 
                      className={`${styles.contribDay} ${styles[`level_${level}`]}`} 
                      title={`${level > 0 ? level * 3 : 'No'} contributions`} 
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.contribLegend}>
            <span>Less</span>
            <div className={`${styles.contribDay} ${styles.level_0}`} />
            <div className={`${styles.contribDay} ${styles.level_1}`} />
            <div className={`${styles.contribDay} ${styles.level_2}`} />
            <div className={`${styles.contribDay} ${styles.level_3}`} />
            <div className={`${styles.contribDay} ${styles.level_4}`} />
            <span>More</span>
          </div>
        </div>
      )}

      <div className={styles.timelineScroll}>
        <div className={styles.timelineTrack} />
        {TIMELINE_EVENTS.map(event => (
          <div key={event.id} className={styles.timelineEvent}>
            <div
              className={styles.timelineEventDot}
              style={{ background: EVENT_COLORS[event.type], boxShadow: `0 0 8px ${EVENT_COLORS[event.type]}50` }}
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
