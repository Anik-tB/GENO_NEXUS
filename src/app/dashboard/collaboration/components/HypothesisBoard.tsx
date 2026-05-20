"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import styles from "./HypothesisBoard.module.css";
import { useHypotheses } from "@/hooks/useHypotheses";
import { TEAM } from "../collab-data";

interface Props {
  onSelectHypothesis: (id: string | null) => void;
  activeHypothesis: string | null;
}

export default function HypothesisBoard({ onSelectHypothesis, activeHypothesis }: Props) {
  const router = useRouter();
  const { hypotheses, loading, createHypothesis } = useHypotheses();

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const tagsRef  = useRef<HTMLInputElement>(null);
  const descRef  = useRef<HTMLTextAreaElement>(null);

  const getMemberColor = (authorId: string) => {
    const member = TEAM.find(m => m.id === authorId);
    return member?.color;
  };

  const handleCardClick = (hypoId: string) => {
    router.push(`/dashboard/collaboration/hypothesis/${hypoId}`);
  };

  const handleCreate = async () => {
    const title = titleRef.current?.value?.trim();
    if (!title) return;
    setCreating(true);
    const tags = tagsRef.current?.value
      ? tagsRef.current.value.split(",").map(t => t.trim()).filter(Boolean)
      : [];
    await createHypothesis(title, tags);
    setCreating(false);
    setShowModal(false);
    if (titleRef.current) titleRef.current.value = "";
    if (tagsRef.current)  tagsRef.current.value  = "";
    if (descRef.current)  descRef.current.value  = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
      {/* ── New Hypothesis Modal ── */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Initialize New Hypothesis</h3>
              <button onClick={() => setShowModal(false)} className={styles.iconActionBtn}>×</button>
            </div>
            <div className={styles.modalBody}>
              <input
                ref={titleRef}
                type="text"
                placeholder="Hypothesis Title"
                className={styles.composeInput}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
              <textarea
                ref={descRef}
                placeholder="Describe biological targets or data parameters..."
                className={styles.composeInput}
                rows={3}
              />
              <div className={styles.modalTagRow}>
                <input
                  ref={tagsRef}
                  type="text"
                  placeholder="Tags (comma-separated): BRCA1, SNP, oncology"
                  className={styles.composeInput}
                />
              </div>
              <button
                className={styles.launchBtn}
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Creating…" : "Launch Protocol"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel Header ── */}
      <div className={styles.panelHeader}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <h2>Hypothesis Board</h2>
        <button className={styles.iconActionBtn} onClick={() => setShowModal(true)}>+</button>
      </div>

      {/* ── Hypothesis List ── */}
      <div className={styles.hypoList}>
        {loading ? (
          /* Skeleton loader */
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.hypoCard} style={{ opacity: 0.4, pointerEvents: "none" }}>
              <div className={styles.hypoCardTop}>
                <span className={styles.hypoId} style={{ background: "rgba(255,255,255,0.1)", color: "transparent" }}>H-000</span>
              </div>
              <div style={{ height: "14px", background: "rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "0.5rem" }} />
              <div style={{ height: "10px", width: "60%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
            </div>
          ))
        ) : hypotheses.length === 0 ? (
          <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#475569", fontSize: "0.82rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧬</div>
            No hypotheses yet.
            <br />
            <button
              onClick={() => setShowModal(true)}
              style={{ marginTop: "0.75rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
            >
              + Start First Hypothesis
            </button>
          </div>
        ) : (
          hypotheses.map(hypo => (
            <div
              key={hypo.id}
              className={styles.hypoCard}
              onClick={() => handleCardClick(hypo.id)}
            >
              <div className={styles.hypoCardTop}>
                <span className={styles.hypoId}>{hypo.id}</span>
                <span className={styles.versionBadge}>v{hypo.version}</span>
              </div>
              <h3 className={styles.hypoTitle}>{hypo.title}</h3>
              <div className={styles.hypoTagRow}>
                {hypo.tags.map(tag => (
                  <span key={tag} className={styles.hypoTagSmall}>{tag}</span>
                ))}
              </div>
              <div className={styles.hypoBottom}>
                <div className={styles.confidenceGauge}>
                  <div className={styles.gaugeFill} style={{ width: `${hypo.confidence}%` }} />
                  <span>{hypo.confidence}% Confidence</span>
                </div>
                <div className={styles.hypoAvatars}>
                  {hypo.avatars.map(av => (
                    <span
                      key={av}
                      className={styles.microAvatar}
                      style={av !== "AI" ? { borderColor: getMemberColor(av), color: getMemberColor(av) } : {}}
                    >
                      {av === "AI" ? "🤖" : av}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.hypoMeta}>
                <span>💬 {hypo.comments}</span>
                <span>✏️ {hypo.lastEdited}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
