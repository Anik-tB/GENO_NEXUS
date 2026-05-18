"use client";

import { useState } from "react";
import styles from "./HypothesisBoard.module.css";
import { Hypothesis, HYPOTHESES, CHAT_MESSAGES } from "../collab-data";

interface Props {
  onSelectHypothesis: (id: string | null) => void;
  activeHypothesis: string | null;
}

export default function HypothesisBoard({ onSelectHypothesis, activeHypothesis }: Props) {
  const [showModal, setShowModal] = useState(false);

  if (activeHypothesis) {
    const hypo = HYPOTHESES.find(h => h.id === activeHypothesis);
    if (!hypo) return null;

    return (
      <div className={styles.deepDivePanel}>
        <div className={styles.deepDiveHeader}>
          <button className={styles.closeBtn} onClick={() => onSelectHypothesis(null)}>
            ← Back
          </button>
          <span className={styles.hypoIdBadge}>{hypo.id}</span>
          <span className={styles.versionBadge}>v{hypo.version}</span>
        </div>

        <div className={styles.deepDiveBody}>
          <h2>{hypo.title}</h2>
          <div className={styles.hypoTagRow}>
            {hypo.tags.map(tag => (
              <span key={tag} className={styles.hypoTag}>{tag}</span>
            ))}
          </div>

          {hypo.annotations.length > 0 && (
            <div className={styles.annotationsSection}>
              <h4 className={styles.sectionSubTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Mutation Annotations
              </h4>
              {hypo.annotations.map((ann, i) => (
                <div key={i} className={styles.annotationItem}>
                  <span className={styles.annotationDot} />
                  <span>{ann}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.chatStream}>
            {CHAT_MESSAGES.map(msg => (
              <div key={msg.id} className={styles.chatMsg}>
                <div className={msg.isAI ? styles.chatAvatarAI : styles.chatAvatar}>
                  {msg.isAI ? "🤖" : msg.author}
                </div>
                <div className={msg.isAI ? styles.chatBubbleAI : styles.chatBubble}>
                  <p>{msg.text}</p>
                  <span className={styles.chatTime}>{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.chatComposer}>
            <input type="text" placeholder="Add observation or /command AI..." />
            <button className={styles.sendBtn}>⮞</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Initialize New Hypothesis</h3>
              <button onClick={() => setShowModal(false)} className={styles.iconActionBtn}>×</button>
            </div>
            <div className={styles.modalBody}>
              <input type="text" placeholder="Hypothesis Title" className={styles.composeInput} />
              <textarea placeholder="Describe biological targets or data parameters..." className={styles.composeInput} rows={3} />
              <div className={styles.modalTagRow}>
                <input type="text" placeholder="Tags (comma-separated)" className={styles.composeInput} />
              </div>
              <button className={styles.launchBtn}>Launch Protocol</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.panelHeader}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <h2>Hypothesis Board</h2>
        <button className={styles.iconActionBtn} onClick={() => setShowModal(true)}>+</button>
      </div>

      <div className={styles.hypoList}>
        {HYPOTHESES.map(hypo => (
          <div
            key={hypo.id}
            className={styles.hypoCard}
            onClick={() => onSelectHypothesis(hypo.id)}
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
                  <span key={av} className={styles.microAvatar}>
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
        ))}
      </div>
    </>
  );
}
