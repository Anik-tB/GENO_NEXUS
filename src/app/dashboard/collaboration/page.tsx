"use client";

import styles from "./page.module.css";
import { useState } from "react";

const TEAM = [
  { id: "EH", name: "Dr. E. Hayes", role: "Lead Scientist", status: "online" },
  { id: "RV", name: "Dr. R. Vance", role: "Epidemiologist", status: "offline" },
  { id: "MO", name: "Dr. M. Okafor", role: "Bioinformatician", status: "online" },
  { id: "🤖", name: "AI Base", role: "Nexus Copilot", status: "active" },
];

const HYPOTHESES = [
  { id: "H-402", title: "Targeted CRISPR knock-out efficiency in lung organoids", confidence: 84, active: true, comments: 3, avatars: ["EH", "🤖"] },
  { id: "H-401", title: "Elevated expression of marker genes in drug-resistant strains", confidence: 62, active: true, comments: 7, avatars: ["MO", "RV", "🤖"] },
  { id: "H-399", title: "Patient batch 12 covariance anomaly mapping", confidence: 91, active: false, comments: 1, avatars: ["RV"] },
];

const DATA_STREAMS = [
  { id: 1, type: "model", author: "AI Base", desc: "Re-trained BRCA1 pathogenicity model with Cohort #47.", time: "10 mins ago" },
  { id: 2, type: "data", author: "Dr. E. Hayes", desc: "Uploaded 120 new VCF samples to central storage.", time: "1 hour ago" },
  { id: 3, type: "pipeline", author: "Dr. M. Okafor", desc: "Optimized alignment script for Nextflow WGS Phase 3.", time: "2 hours ago" },
  { id: 4, type: "note", author: "Dr. R. Vance", desc: "Noted significant deviation in control group telemetry.", time: "Yesterday" },
];

const PIPELINES = [
  { name: "Genomic Alignment (WGS)", status: "running", progress: 68 },
  { name: "Pathogen Variant Calling", status: "completed", progress: 100 },
  { name: "Pharmacogenomic Risk Score", status: "failed", progress: 42 },
];

export default function CollaborationNexus() {
  const [activeHypothesis, setActiveHypothesis] = useState<string | null>(null);
  const [showNewHypoModal, setShowNewHypoModal] = useState(false);
  const [expandedStream, setExpandedStream] = useState<number | null>(null);

  return (
    <div className={styles.nexusContainer}>
      
      {/* ── Optional Modal ── */}
      {showNewHypoModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <h3>Initialize New Hypothesis</h3>
               <button onClick={() => setShowNewHypoModal(false)} className={styles.iconActionBtn}>×</button>
             </div>
             <div className={styles.modalBody}>
               <input type="text" placeholder="Hypothesis Title" className={styles.composeInput} />
               <textarea placeholder="Describe biological targets or data parameters..." className={styles.composeInput} rows={4} />
               <button className={styles.sendBtn} style={{width: '100%', padding: '0.75rem', marginTop: '1rem'}}>Launch Protocol</button>
             </div>
          </div>
        </div>
      )}
      
      {/* Nexus Top Bar: Team Presence & Live Status */}
      <header className={styles.presenceHeader}>
        <div className={styles.presenceLeft}>
          <div className={styles.pulseNode}></div>
          <h1 className={styles.nexusTitle}>Collab Nexus</h1>
          <span className={styles.nexusEnv}>Workspace: Alpha</span>
        </div>
        <div className={styles.teamPresence}>
          {TEAM.map(member => (
            <div key={member.id} className={styles.memberNode} title={`${member.name} - ${member.role}`}>
              <span className={styles.memberAvatar}>{member.id}</span>
              <span className={`${styles.statusDot} ${styles[`status_${member.status}`]}`}></span>
            </div>
          ))}
          <button className={styles.inviteBtn}>+ Add Member</button>
        </div>
      </header>

      <div className={styles.nexusGrid}>
        
        {/* Left Column: Active Hypotheses (Replacing Issues) */}
        <section className={styles.boardCol}>
          <div className={styles.panelHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gn-primary)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <h2>Active Hypotheses</h2>
            <button className={styles.iconActionBtn} onClick={() => setShowNewHypoModal(true)}>+</button>
          </div>
          
          <div className={styles.hypoList}>
            {HYPOTHESES.map(hypo => (
              <div 
                key={hypo.id} 
                className={`${styles.hypoCard} ${activeHypothesis === hypo.id ? styles.hypoActive : ""}`}
                onClick={() => setActiveHypothesis(hypo.id)}
              >
                <div className={styles.hypoId}>{hypo.id}</div>
                <h3 className={styles.hypoTitle}>{hypo.title}</h3>
                <div className={styles.hypoBottom}>
                  <div className={styles.confidenceGauge}>
                    <div className={styles.gaugeFill} style={{width: `${hypo.confidence}%`}}></div>
                    <span>{hypo.confidence}% Confidence</span>
                  </div>
                  <div className={styles.hypoAvatars}>
                    {hypo.avatars.map(av => <span key={av} className={styles.microAvatar}>{av}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Center / Deep Dive Panel */}
        <section className={styles.mainFeedCol}>
          {activeHypothesis ? (
             <div className={styles.deepDivePanel}>
                <div className={styles.deepDiveHeader}>
                  <button className={styles.closeBtn} onClick={() => setActiveHypothesis(null)}>← Back to Streams</button>
                  <span className={styles.hypoIdBadge}>{activeHypothesis}</span>
                </div>
                <div className={styles.deepDiveBody}>
                  <h2>Discussion & Metrics</h2>
                  <div className={styles.chatStream}>
                     <div className={styles.chatMsg}>
                       <div className={styles.chatAvatar}>EH</div>
                       <div className={styles.chatBubble}>
                         <p>I've isolated the organoid batches. Seeing high resilience in batch 3.</p>
                         <span className={styles.chatTime}>10:04 AM</span>
                       </div>
                     </div>
                     <div className={styles.chatMsg}>
                       <div className={styles.chatAvatarAI}>🤖</div>
                       <div className={styles.chatBubbleAI}>
                         <p>Analysis confirmed. Batch 3 exhibits anomalous expression of target 4B.</p>
                         <div className={styles.aiGraphMock}></div>
                         <span className={styles.chatTime}>10:05 AM</span>
                       </div>
                     </div>
                  </div>
                  <div className={styles.chatComposer}>
                    <input type="text" placeholder="Add observation or /command AI..." />
                    <button className={styles.sendBtn}>⮞</button>
                  </div>
                </div>
             </div>
          ) : (
            <>
              <div className={styles.panelHeader}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gn-white)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <h2>Live Activity Stream</h2>
              </div>
              <div className={styles.activityFeed}>
                <div className={styles.timelineLine}></div>
                {DATA_STREAMS.map(stream => (
                  <div key={stream.id} className={styles.streamItem} onClick={() => setExpandedStream(expandedStream === stream.id ? null : stream.id)}>
                     <div className={styles.streamDot}></div>
                     <div className={styles.streamCard} style={{cursor: 'pointer'}}>
                        <div className={styles.streamHeader}>
                          <span className={styles.streamAuthor}>{stream.author}</span>
                          <span className={styles.streamTime}>{stream.time}</span>
                        </div>
                        <p className={styles.streamDesc}>{stream.desc}</p>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span className={`${styles.streamTypeBadge} ${styles[`badge_${stream.type}`]}`}>{stream.type}</span>
                          <span style={{fontSize: '0.7rem', color: 'var(--gn-text-muted)'}}>{expandedStream === stream.id ? '↑ Collapse' : '↓ Expand Details'}</span>
                        </div>
                        {expandedStream === stream.id && (
                           <div className={styles.expandedMock}>
                              [System Log] Authenticated via Token-RSA. Operation completed gracefully. Latency: 42ms.
                           </div>
                        )}
                     </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Right Column: Pipeline Engine Status */}
        <section className={styles.engineCol}>
           <div className={styles.panelHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gn-success)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <h2>Computation Pipelines</h2>
           </div>
           
           <div className={styles.pipelineList}>
              {PIPELINES.map(pipe => (
                <div key={pipe.name} className={styles.pipelineCard}>
                   <div className={styles.pipeTop}>
                      <span className={styles.pipeName}>{pipe.name}</span>
                      <span className={`${styles.pipeStatus} ${styles[`pipe_${pipe.status}`]}`}>
                        {pipe.status}
                      </span>
                   </div>
                   <div className={styles.pipeBarTrack}>
                      <div className={`${styles.pipeBarFill} ${styles[`pipeFill_${pipe.status}`]}`} style={{width: `${pipe.progress}%`}}></div>
                   </div>
                </div>
              ))}
           </div>

           <div className={styles.dataNodeMap}>
              <h3>Nexus Topological Overview</h3>
              <div className={styles.nodeMapGfx}>
                 {/* Visual Mock of connected nodes */}
                 <svg width="100%" height="150" viewBox="0 0 200 150">
                    <circle cx="50" cy="50" r="15" fill="var(--gn-bg-glass-strong)" stroke="var(--gn-primary)" strokeWidth="2"/>
                    <circle cx="150" cy="30" r="10" fill="var(--gn-bg-glass-strong)" stroke="var(--gn-accent)" strokeWidth="2"/>
                    <circle cx="120" cy="110" r="12" fill="var(--gn-bg-glass-strong)" stroke="var(--gn-blue)" strokeWidth="2"/>
                    
                    <line x1="63" y1="45" x2="141" y2="34" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="60" y1="60" x2="110" y2="103" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="145" y1="40" x2="128" y2="100" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="4" />
                    
                    <circle cx="50" cy="50" r="4" fill="var(--gn-primary)"/>
                    <circle cx="150" cy="30" r="3" fill="var(--gn-accent)"/>
                    <circle cx="120" cy="110" r="3" fill="var(--gn-blue)"/>
                 </svg>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}
