"use client";

import styles from "./PresenceHeader.module.css";
import { TeamMember } from "../collab-data";

interface Props {
  members: TeamMember[];
  alertCount: number;
  onToggleAlerts: () => void;
}

export default function PresenceHeader({ members, alertCount, onToggleAlerts }: Props) {
  const onlineCount = members.filter(m => m.status !== "offline").length;

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
        </div>
      </div>

      <div className={styles.teamPresence}>
        {members.map(member => (
          <div key={member.id} className={styles.memberNode} title={`${member.name} — ${member.role}`}>
            <span className={styles.memberAvatar} style={{ borderColor: member.color }}>
              {member.id === "AI" ? "🤖" : member.id}
            </span>
            <span className={`${styles.statusDot} ${styles[`status_${member.status}`]}`} />
            {member.typing && <span className={styles.typingRing} />}
            {member.viewing && member.status !== "offline" && (
              <div className={styles.viewingTooltip}>
                <span className={styles.viewingLabel}>Viewing</span>
                <span className={styles.viewingDataset}>{member.viewing}</span>
              </div>
            )}
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
