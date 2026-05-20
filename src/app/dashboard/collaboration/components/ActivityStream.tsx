"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./ActivityStream.module.css";
import { ActivityEntry, TeamMember } from "../collab-data";

interface Props {
  streams: ActivityEntry[];
  members: TeamMember[];
  latestStreamId?: number | string | null;
  wsStatus?: "connecting" | "live" | "reconnecting" | "offline";
  /** Called when user submits a note — sends via WebSocket */
  onPostNote?: (text: string, noteType: ActivityEntry["type"]) => void;
  /** Called when user typing state changes */
  onTyping?: (memberId: string, typing: boolean) => void;
}

const TYPE_COLORS: Record<string, string> = {
  model: "#3b82f6",
  data: "#10b981",
  pipeline: "#d946ef",
  note: "#94a3b8",
  alert: "#f59e0b",
  mutation: "#ec4899",
};

const ENTRY_TYPES: ActivityEntry["type"][] = ["note", "alert", "data", "pipeline", "model", "mutation"];

/** Convert a ms timestamp to a live relative string */
function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  return "Yesterday";
}

function formatAuthorName(authorStr: string): string {
  if (authorStr === "AI") return "Nexus Copilot";
  if (authorStr.includes("@")) return authorStr.split("@")[0];
  return authorStr;
}

/** Clock that ticks every 20s so timestamps stay fresh */
function useLiveClock() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 20_000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

const WS_STATUS_LABEL: Record<string, string> = {
  live: "LIVE",
  connecting: "CONNECTING…",
  reconnecting: "RECONNECTING…",
  offline: "OFFLINE",
};
const WS_STATUS_COLOR: Record<string, string> = {
  live: "#10b981",
  connecting: "#f59e0b",
  reconnecting: "#f59e0b",
  offline: "#ef4444",
};

export default function ActivityStream({
  streams,
  members,
  latestStreamId,
  wsStatus = "live",
  onPostNote,
  onTyping,
}: Props) {
  const router = useRouter();
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<ActivityEntry["type"]>("note");
  const [posted, setPosted] = useState(false);
  const [dotFlash, setDotFlash] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLiveClock();

  // Flash dot & scroll to top when a new WS entry arrives
  useEffect(() => {
    if (latestStreamId == null) return;
    setDotFlash(true);
    const t = setTimeout(() => setDotFlash(false), 1200);
    if (feedRef.current) feedRef.current.scrollTop = 0;
    return () => clearTimeout(t);
  }, [latestStreamId]);

  const typingMembers = members.filter(m => m.typing && m.status !== "offline");

  // Send typing indicator via WS with debounce
  function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNoteText(e.target.value);
    onTyping?.("YOU", true);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => onTyping?.("YOU", false), 2000);
  }

  const handlePost = useCallback(() => {
    const text = noteText.trim();
    if (!text) return;

    if (onPostNote) {
      // Real-time path: send via WebSocket — server will broadcast back to all tabs
      onPostNote(text, noteType);
    }

    setNoteText("");
    setPosted(true);
    setTimeout(() => setPosted(false), 2000);
    inputRef.current?.focus();
    if (feedRef.current) feedRef.current.scrollTop = 0;
    onTyping?.("YOU", false);
  }, [noteText, noteType, onPostNote, onTyping]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
      <div className={styles.panelHeader}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <h2>Live Activity Stream</h2>

        {/* WS status pill */}
        <span
          style={{
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "0.12rem 0.5rem",
            borderRadius: "999px",
            background: `${WS_STATUS_COLOR[wsStatus]}18`,
            color: WS_STATUS_COLOR[wsStatus],
            border: `1px solid ${WS_STATUS_COLOR[wsStatus]}40`,
            textTransform: "uppercase",
            transition: "all 0.3s ease",
          }}
        >
          {WS_STATUS_LABEL[wsStatus] ?? wsStatus.toUpperCase()}
        </span>

        <span className={`${styles.liveStreamDot} ${dotFlash ? styles.liveStreamDotFlash : ""}`} />
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

      <div className={styles.activityFeed} ref={feedRef}>
        <div className={styles.timelineLine} />
        {streams.map((stream, idx) => (
          <div
            key={`${stream.id}-${idx}`}
            className={`${styles.streamItem} ${idx === 0 ? styles.streamItemNew : ""}`}
            onClick={() => router.push(`/dashboard/collaboration/activity/${stream.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.streamDot} style={{ background: TYPE_COLORS[stream.type] || "#64748b" }} />
            <div className={styles.streamCard}>
              <div className={styles.streamHeader}>
                <span className={styles.streamAuthor} title={stream.author}>
                  {formatAuthorName(stream.author)}
                </span>
                <span className={styles.streamTime}>
                  {stream.ts ? relativeTime(stream.ts) : stream.time}
                </span>
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
                  <span className={styles.regionBadge}>📍 {stream.region}</span>
                )}
                <span className={styles.expandHint}>→ View Details</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sleek Post Note Composer ── */}
      <div className={styles.sleekComposerWrapper}>
        <div className={styles.sleekComposer}>
          <div style={{ position: "relative", width: "100%" }}>
            <textarea
              ref={inputRef}
              className={styles.sleekInput}
              placeholder="Post an activity note, alert, or update…"
              value={noteText}
              onChange={handleNoteChange}
              onKeyDown={handleKeyDown}
              maxLength={300}
              aria-label="Activity note input"
            />
          </div>
          <div className={styles.sleekFooter}>
            <div className={styles.sleekActions}>
              <select
                className={styles.sleekSelect}
                value={noteType}
                onChange={e => setNoteType(e.target.value as ActivityEntry["type"])}
                aria-label="Entry type"
              >
                {ENTRY_TYPES.map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
              <span className={styles.sleekHint}>Shift+Enter for new line</span>
            </div>
            <div className={styles.sleekActionsRight}>
              <span className={styles.sleekCharCount}>{noteText.length}/300</span>
              <button
                className={`${styles.sleekPostBtn} ${posted ? styles.sleekPostBtnSuccess : ""}`}
                onClick={handlePost}
                disabled={!noteText.trim() || wsStatus === "offline"}
                aria-label="Post note"
                title={wsStatus === "offline" ? "WebSocket disconnected" : "Post to all collaborators"}
              >
                {posted ? "Posted!" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
