"use client";

import { useState } from "react";
import styles from "./page.module.css";

const PROJECTS = [
  { id: "pj1", name: "Oncology Precision Trial B", role: "Owner", updated: "2 hours ago", members: 4 },
  { id: "pj2", name: "Pharmacogenomic Mapping", role: "Contributor", updated: "1 day ago", members: 12 },
  { id: "pj3", name: "Rare Disease Cohort X", role: "Viewer", updated: "3 days ago", members: 2 }
];

const COMMENTS = [
  { id: 1, user: "Dr. E. Hayes", avatar: "EH", time: "1 hour ago", text: "The CYP2C19 variant in patient JD-8942 strongly suggests avoiding Clopidogrel.", role: "Lead Genomist" },
  { id: 2, user: "Dr. R. Vance", avatar: "RV", time: "3 hours ago", text: "I've reviewed the automated outbreak forecast. The 45% variance seems accurate given the new strain.", role: "Epidemiologist" },
  { id: 3, user: "System Copilot", avatar: "🤖", time: "5 hours ago", text: "Analysis Complete: 14 high-risk pathogenic markers identified across the new cohort batch.", role: "AI Assistant" }
];

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState("comments");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Team Collaboration</h1>
          <p className={styles.subtitle}>Coordinate analysis and clinical interventions across your research groups.</p>
        </div>
        <button className={styles.actionBtn}>
          <span className={styles.icon}>+</span> New Project
        </button>
      </header>

      <div className={styles.layout}>
        {/* Left Column: Projects & Sharing */}
        <div className={styles.sidebarColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Active Projects</h2>
            </div>
            <div className={styles.projectList}>
              {PROJECTS.map(proj => (
                <div key={proj.id} className={styles.projectItem}>
                  <div className={styles.projectInfo}>
                    <h4>{proj.name}</h4>
                    <span>Last updated {proj.updated}</span>
                  </div>
                  <div className={styles.projectMeta}>
                    <span className={styles.roleBadge}>{proj.role}</span>
                    <div className={styles.memberAvatars}>
                      {Array.from({ length: Math.min(proj.members, 3) }).map((_, i) => (
                        <div key={i} className={styles.miniAvatar} />
                      ))}
                      {proj.members > 3 && <div className={styles.miniAvatarCount}>+{proj.members - 3}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Share Analysis</h2>
            </div>
            <p className={styles.shareText}>Invite external clinicians or researchers to view specific genomic profiles securely.</p>
            <div className={styles.shareForm}>
              <input type="email" placeholder="Email address..." className={styles.input} />
              <select className={styles.select}>
                <option>Viewer</option>
                <option>Contributor</option>
              </select>
              <button className={styles.primaryBtn}>Send Invite</button>
            </div>
          </section>
        </div>

        {/* Right Column: Discussion Feed */}
        <div className={styles.mainColumn}>
          <section className={`${styles.card} ${styles.discussionCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Project Discussion</h2>
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tab} ${activeTab === 'comments' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'activity' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  Activity Log
                </button>
              </div>
            </div>

            <div className={styles.feedArea}>
              {COMMENTS.map(comment => (
                <div key={comment.id} className={`${styles.commentItem} ${comment.user === 'System Copilot' ? styles.aiComment : ''}`}>
                  <div className={styles.avatar}>{comment.avatar}</div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <div>
                        <strong>{comment.user}</strong>
                        <span className={styles.roleLabel}>{comment.role}</span>
                      </div>
                      <span className={styles.timeLabel}>{comment.time}</span>
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                    <div className={styles.commentActions}>
                      <button>Reply</button>
                      <button>Resolve</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.composerArea}>
              <textarea placeholder="Write a comment... use @ to mention teammates." className={styles.textarea} />
              <div className={styles.composerTools}>
                <button className={styles.toolIcon}>📎</button>
                <button className={styles.toolIcon}>🧬</button>
                <button className={styles.sendBtn}>Post Comment</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
