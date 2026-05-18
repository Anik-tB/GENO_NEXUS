"use client";

import styles from "./ResearchTimeline.module.css";
import { TIMELINE_EVENTS } from "../collab-data";

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
  return (
    <div className={styles.timelineSection}>
      <div className={styles.timelineHeader}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <h3>Research History & Audit Trail</h3>
      </div>

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
