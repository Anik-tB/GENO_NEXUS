"use client";

import { useState } from "react";
import styles from "./PresenceHeader.module.css";
import { TeamMember } from "../collab-data";

interface Props {
  members: TeamMember[];
  alertCount: number;
  onToggleAlerts: () => void;
  onAddMember?: (member: TeamMember) => void;
  wsStatus?: "connecting" | "live" | "reconnecting" | "offline";
}

export default function PresenceHeader({ members, alertCount, onToggleAlerts, onAddMember, wsStatus = "live" }: Props) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    
    setIsInviting(true);
    setInviteError("");
    
    try {
      const res = await fetch("/api/collaboration/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: inviteUsername }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to invite user");
      }
      
      if (onAddMember && data.data) {
        onAddMember(data.data);
      }
      
      setIsInviteOpen(false);
      setInviteUsername("");
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

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
          <div key={member.id} className={styles.memberNode} style={{ borderColor: member.color }}>
            <span className={styles.memberAvatar}>
              {member.id === "AI" ? "🤖" : (member.initials || member.name.substring(0, 2).toUpperCase())}
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

        <div className={styles.inviteContainer} style={{ position: "relative" }}>
          <button className={styles.inviteBtn} onClick={() => setIsInviteOpen(!isInviteOpen)}>
            + Add Member
          </button>
          
          {isInviteOpen && (
            <div className={styles.inviteDropdown} style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#1e293b", border: "1px solid #334155",
              borderRadius: "8px", padding: "12px", width: "240px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)", zIndex: 100
            }}>
              <form onSubmit={handleInvite}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "8px" }}>
                  Invite via GitHub Username
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="e.g. octocat"
                    disabled={isInviting}
                    style={{
                      width: "100%", padding: "6px 8px", background: "#0f172a",
                      border: "1px solid #334155", borderRadius: "4px",
                      color: "#f8fafc", fontSize: "0.875rem", marginBottom: "8px"
                    }}
                    autoFocus
                  />
                </div>
                {inviteError && (
                  <div style={{ color: "#ef4444", fontSize: "0.7rem", marginBottom: "8px" }}>{inviteError}</div>
                )}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setIsInviteOpen(false)} disabled={isInviting}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isInviting || !inviteUsername.trim()}
                    style={{ background: "#3b82f6", border: "none", color: "white", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "0.8rem" }}>
                    {isInviting ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

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
