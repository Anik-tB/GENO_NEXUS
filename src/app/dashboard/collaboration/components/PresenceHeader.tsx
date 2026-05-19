"use client";

import styles from "./PresenceHeader.module.css";
import { TeamMember } from "../collab-data";

interface Props {
  members: TeamMember[];
  alertCount: number;
  onToggleAlerts: () => void;
  wsStatus?: "connecting" | "live" | "reconnecting" | "offline";
}

export default function PresenceHeader({ members, alertCount, onToggleAlerts, wsStatus = "live" }: Props) {
  const onlineCount = members.filter(m => m.status !== "offline").length;

  const wsColor = wsStatus === "live" ? "#10b981" : wsStatus === "offline" ? "#ef4444" : "#f59e0b";
  const wsLabel = wsStatus === "live" ? "WS Live" : wsStatus === "offline" ? "WS Offline" : "WS Syncing";

  return (
    <header className={styles.presenceHeader}>
      <div className={styles.presenceLeft}>
        <div className={styles.pulseNode} />
        <div>
          <h1 className={styles.nexusTitle}>Collab Nexus</h1>
          <span className={styles.nexusEnv}>Workspace: Alpha</span>
        </div>
        <div className={styles.onlineBadge}>
          <span className={styles.onlineDot} />
          {onlineCount} online
          <span style={{
            marginLeft: "0.5rem",
            fontSize: "0.58rem",
            fontWeight: 700,
            padding: "0.1rem 0.4rem",
            borderRadius: "999px",
            background: `${wsColor}18`,
            color: wsColor,
            border: `1px solid ${wsColor}40`,
            textTransform: "uppercase" as const,
            letterSpacing: "0.04em",
            transition: "all 0.3s ease",
          }}>{wsLabel}</span>
        </div>
      </div>

      <div className={styles.teamPresence}>
        {members.map(member => (
          <div key={member.id} className={styles.memberNode}>
            <span className={styles.memberAvatar} style={{ borderColor: member.color }}>
              {member.id === "AI" ? "🤖" : member.id}
            </span>
            <span className={`${styles.statusDot} ${styles[`status_${member.status}`]}`} />
            {member.typing && <span className={styles.typingRing} />}
            <div className={styles.viewingTooltip}>
              <span className={styles.memberName}>{member.name}</span>
              <span className={styles.memberRole}>{member.role}</span>
              {member.viewing && member.status !== "offline" && (
                <>
                  <div className={styles.tooltipDivider} />
                  <span className={styles.viewingLabel}>Viewing</span>
                  <span className={styles.viewingDataset}>{member.viewing}</span>
                </>
              )}
            </div>
          </div>
        ))}

        <button className={styles.inviteBtn}>+ Add Member</button>

        <button className={styles.alertToggleBtn} onClick={onToggleAlerts}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {alertCount > 0 && <span className={styles.alertBadgeCount}>{alertCount}</span>}
        </button>
      </div>
    </header>
  );
}
