"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TEAM } from "../../collab-data";
import { useCollabStats } from "@/hooks/useCollabStats";
import styles from "./HypothesisDetail.module.css";

interface ChatMessage {
  id:     number;
  author: string;
  text:   string;
  isAI:   boolean;
  time:   string;
}

interface Hypothesis {
  id:           string;
  title:        string;
  tags:         string[];
  annotations:  string[];
  confidence:   number;
  version:      number;
  active:       boolean;
  comments:     number;
  avatars:      string[];
  lastEdited:   string;
  chatMessages: ChatMessage[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HypothesisDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { activeUser } = useCollabStats();

  const [hypo, setHypo]         = useState<Hypothesis | null>(null);
  const [messages, setMessages]  = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading]    = useState(true);
  const [notFound, setNotFound]  = useState(false);

  // ── Fetch hypothesis from real API ───────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(`/api/collaboration/hypotheses/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setHypo(json.data);
          setMessages(json.data.chatMessages ?? []);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const getMemberColor = (authorId: string) => {
    const member = TEAM.find(m => m.id === authorId);
    if (member) return member.color;
    // Generate a nice consistent HSL color based on the initials/authorId
    let hash = 0;
    for (let i = 0; i < authorId.length; i++) {
      hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 60%)`;
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userInitials = activeUser?.initials || "AU";
    const newMsg: ChatMessage = {
      id:     Date.now(),
      author: userInitials,
      text:   inputText,
      isAI:   false,
      time:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");

    // Persist to DB
    const res = await fetch(`/api/collaboration/hypotheses/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: { author: userInitials, text: inputText, isAI: false } }),
    });
    const json = await res.json();
    if (json.success && json.chatMessages) {
      setMessages(json.chatMessages);
    }
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    if (hypo) {
      setHypo({ ...hypo, confidence: newVal });
    }
  };

  const handleConfidenceCommit = async (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const newVal = Number((e.target as HTMLInputElement).value);
    if (!hypo) return;
    try {
      await fetch(`/api/collaboration/hypotheses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidence: newVal }),
      });
    } catch (err) {
      console.error("Failed to update confidence score:", err);
    }
  };

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "2rem" }}>
        <div style={{ height: "36px", width: "200px", background: "rgba(255,255,255,0.06)", borderRadius: "8px", animation: "pulse 1.5s ease infinite" }} />
        <div style={{ height: "200px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", animation: "pulse 1.5s ease infinite" }} />
        <style>{`@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
      </div>
    );
  }

  if (notFound || !hypo) {
    return (
      <div className={styles.notFound}>
        <span>🧬</span>
        <h2>Hypothesis not found</h2>
        <button onClick={() => router.back()}>← Go Back</button>
      </div>
    );
  }

  const confidenceColor =
    hypo.confidence >= 80 ? "#10b981" :
    hypo.confidence >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "2rem" }}>
      {/* ── Back + badges ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <button
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: "pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Collaboration
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "6px" }}>{hypo.id}</span>
          <span style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)", fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "5px" }}>v{hypo.version}</span>
          <span style={{ background: `${confidenceColor}18`, color: confidenceColor, border: `1px solid ${confidenceColor}40`, fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "999px" }}>{hypo.confidence}% Confidence</span>
        </div>
      </div>

      {/* ── Main layout: left content + right chat ── */}
      <div className={styles.layout}>

        {/* LEFT: hypothesis details */}
        <div className={styles.leftPanel}>
          {/* Header */}
          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderTop}>
              <div>
                <h1 className={styles.hypoTitle}>{hypo.title}</h1>
                <div className={styles.tagRow}>
                  {hypo.tags.map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Confidence gauge */}
            <div className={styles.gaugeSection}>
              <div className={styles.gaugeLabel}>
                <span>Confidence Score</span>
                <span style={{ color: confidenceColor, fontWeight: 700 }}>{hypo.confidence}%</span>
              </div>
              <div className={styles.gaugeTrack}>
                <div
                  className={styles.gaugeFill}
                  style={{ width: `${hypo.confidence}%`, background: `linear-gradient(90deg, ${confidenceColor}88, ${confidenceColor})` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hypo.confidence}
                  onChange={handleConfidenceChange}
                  onMouseUp={handleConfidenceCommit}
                  onTouchEnd={handleConfidenceCommit}
                  className={styles.confidenceSlider}
                  title="Adjust confidence score"
                />
              </div>
            </div>

            {/* Meta */}
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Last Edited</span>
                <span className={styles.metaValue}>✏️ {hypo.lastEdited}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Comments</span>
                <span className={styles.metaValue}>💬 {messages.length}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Collaborators</span>
                <div className={styles.avatarRow}>
                  {hypo.avatars.map(av => (
                    <span
                      key={av}
                      className={styles.avatar}
                      style={av !== "AI" ? { borderColor: getMemberColor(av), color: getMemberColor(av) } : {}}
                    >
                      {av === "AI" ? "🤖" : av}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mutation Annotations */}
          {hypo.annotations.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Mutation Annotations
              </h3>
              <div className={styles.annotationList}>
                {hypo.annotations.map((ann, i) => (
                  <div key={i} className={styles.annotationItem}>
                    <div className={styles.annotationDot} />
                    <code className={styles.annotationText}>{ann}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Protocol Status
            </h3>
            <div className={styles.statusCard}>
              <div className={styles.statusDot} style={{ background: hypo.active ? "#10b981" : "#64748b" }} />
              <span style={{ color: hypo.active ? "#10b981" : "#64748b", fontWeight: 600, fontSize: "0.85rem" }}>
                {hypo.active ? "Active Research" : "Archived"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#64748b" }}>
                Version {hypo.version} · {hypo.lastEdited}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: AI chat panel */}
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.chatTitle}>Research Discussion</h3>
              <span className={styles.chatSub}>{messages.length} messages · Nexus Copilot active</span>
            </div>
            <span className={styles.liveTag}>LIVE</span>
          </div>

          <div className={styles.chatMessages}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.chatMsg} ${msg.isAI ? styles.chatMsgAI : ""}`}>
                <div
                  className={msg.isAI ? styles.chatAvatarAI : styles.chatAvatar}
                  style={!msg.isAI ? { borderColor: getMemberColor(msg.author), color: getMemberColor(msg.author) } : {}}
                >
                  {msg.isAI ? "🤖" : msg.author}
                </div>
                <div className={msg.isAI ? styles.bubbleAI : styles.bubble}>
                  <p>{msg.text}</p>
                  <span className={styles.chatTime}>{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.chatComposer}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Add observation or type /command for AI..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <button className={styles.sendBtn} onClick={handleSend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
