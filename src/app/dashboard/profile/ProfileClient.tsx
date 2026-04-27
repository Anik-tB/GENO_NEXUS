"use client";

import styles from "./page.module.css";
import { useState } from "react";

export default function ProfileClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("intel");

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown User";
  const userInitials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "GN";

  const RESEARCHER = {
    name: fullName,
    idString: `UID: ${userInitials}-${user.id?.substring(0, 5) || "ALPHA"}`,
    role: "Lead Bioinformatician",
    clearance: "Level 5 - Nexus Alpha",
    status: "Active Deployment",
    specialties: ["Machine Learning", "Pharmacogenomics", "Outbreak Modeling"],
    avatar: userInitials,
  };

  const STATS = {
    modelsDeployed: 14,
    hypothesesResolved: 48,
    datasetAuthored: 120,
    nexusScore: 9840,
  };

  const RECENT_ACCESS_LOGS = [
    { time: "09:42 AM", location: "Global Nexus Hub", action: "Authorized" },
    { time: "08:14 AM", location: "Cluster 4 (WGS Pipeline)", action: "Compute Init" },
    { time: "Yesterday", location: "Bio-containment DB", action: "Pushed Update" },
  ];

  const DEPLOYED_MODELS = [
    { name: "BRCA1 Pathogenicity Rescorer", status: "Active", accuracy: "99.4%", uptime: "240h" },
    { name: "CYP450 Metabolizer Intel", status: "Iterating", accuracy: "84.2%", uptime: "12h" },
    { name: "Global Outbreak Forecaster", status: "Active", accuracy: "92.1%", uptime: "15d" },
  ];

  return (
    <div className={styles.dossierContainer}>
      
      {/* ── Dossier Header ── */}
      <header className={styles.dossierHeader}>
        <div className={styles.headerGlow}></div>
        <div className={styles.headerContent}>
          <div className={styles.holoBadge}>
            <div className={styles.avatarNode}>{RESEARCHER.avatar}</div>
            <div className={styles.scanLines}></div>
          </div>
          <div className={styles.researcherIdentity}>
            <h1 className={styles.resName}>{RESEARCHER.name}</h1>
            <div className={styles.resTags}>
              <span className={styles.tagId}>{RESEARCHER.idString}</span>
              <span className={styles.tagClearance}>{RESEARCHER.clearance}</span>
            </div>
            <h2 className={styles.resRole}>{RESEARCHER.role}</h2>
          </div>
        </div>
        <div className={styles.headerMetrics}>
          <div className={styles.metricCard}>
            <span className={styles.metricVal}>{STATS.nexusScore}</span>
            <span className={styles.metricLabel}>Nexus Score</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricVal}>{STATS.modelsDeployed}</span>
            <span className={styles.metricLabel}>Models Deployed</span>
          </div>
        </div>
      </header>

      {/* ── Dossier Grid ── */}
      <div className={styles.dossierGrid}>

        {/* Left Col: Specs & Logs */}
        <aside className={styles.sideCol}>
          
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/></svg>
              Core Specialties
            </h3>
            <ul className={styles.specialtyList}>
              {RESEARCHER.specialties.map(spec => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Access Logs
            </h3>
            <div className={styles.logStream}>
              {RECENT_ACCESS_LOGS.map((log, i) => (
                <div key={i} className={styles.logItem}>
                   <div className={styles.logIndicator}></div>
                   <div className={styles.logDetails}>
                     <span className={styles.logLoc}>{log.location}</span>
                     <span className={styles.logAction}>{log.action} · {log.time}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.radarPanel}>
             <h3 className={styles.panelTitle}>Aptitude Resonance</h3>
             <div className={styles.radarMock}>
               {/* Pure CSS/SVG Mock of a radar chart */}
               <svg viewBox="0 0 100 100" className={styles.radarSvg}>
                 <polygon points="50,10 90,40 75,90 25,90 10,40" stroke="var(--gn-border-light-strong)" fill="transparent" strokeWidth="1"/>
                 <polygon points="50,20 80,45 70,80 30,80 20,45" stroke="var(--gn-border-light-strong)" fill="transparent" strokeWidth="1"/>
                 <polygon points="50,30 70,50 63,70 37,70 30,50" stroke="var(--gn-border-light-strong)" fill="transparent" strokeWidth="1"/>
                 <line x1="50" y1="50" x2="50" y2="10" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="2"/>
                 <line x1="50" y1="50" x2="90" y2="40" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="2"/>
                 <line x1="50" y1="50" x2="75" y2="90" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="2"/>
                 <line x1="50" y1="50" x2="25" y2="90" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="2"/>
                 <line x1="50" y1="50" x2="10" y2="40" stroke="var(--gn-border-light-strong)" strokeWidth="1" strokeDasharray="2"/>
                 
                 <polygon points="50,15 85,50 65,85 40,75 20,35" fill="rgba(16, 185, 129, 0.4)" stroke="var(--gn-primary)" strokeWidth="2"/>
               </svg>
             </div>
          </div>
        </aside>

        {/* Main Col */}
        <main className={styles.mainCol}>
          
          {/* Custom Tabs */}
          <div className={styles.dossierTabs}>
            <button className={`${styles.dTab} ${activeTab === "intel" ? styles.dTabActive : ""}`} onClick={() => setActiveTab("intel")}>Output & Intel</button>
            <button className={`${styles.dTab} ${activeTab === "models" ? styles.dTabActive : ""}`} onClick={() => setActiveTab("models")}>Deployed Models</button>
            <button className={`${styles.dTab} ${activeTab === "auth" ? styles.dTabActive : ""}`} onClick={() => setActiveTab("auth")}>Permissions</button>
          </div>

          <div className={styles.dossierContent}>
            
            {activeTab === "intel" && (
              <div className={styles.fadePanels}>
                
                <div className={styles.panel}>
                  <div className={styles.panelHeaderFlex}>
                    <h3 className={styles.panelTitle}>Research & Hypothesis Activity</h3>
                    <span className={styles.pulseLive}>Live Sync</span>
                  </div>
                  {/* Hexagon/Grid heatmap mock instead of squares */}
                  <div className={styles.hexGrid}>
                     {Array.from({length: 48}).map((_, i) => {
                       const intensity = Math.floor(Math.random() * 4);
                       return <div key={i} className={`${styles.hexCell} ${styles[`hex_${intensity}`]}`}></div>
                     })}
                  </div>
                </div>

                <div className={styles.panel}>
                  <h3 className={styles.panelTitle}>Recent Data Operations</h3>
                  <div className={styles.dataOpsList}>
                    <div className={styles.dataOp}>
                      <div className={styles.opIcon}>🧬</div>
                      <div className={styles.opText}>
                        <strong>Compiled WGS Cohort #47</strong>
                        <span>Integrated 14,000 variants. Confidence validation complete.</span>
                      </div>
                      <span className={styles.opMeta}>2H AGO</span>
                    </div>
                    <div className={styles.dataOp}>
                      <div className={styles.opIcon}>⚗️</div>
                      <div className={styles.opText}>
                        <strong>Formulated Hypothesis H-401</strong>
                        <span>Target: Elevated expression of marker genes in drug-resistant strains.</span>
                      </div>
                      <span className={styles.opMeta}>1D AGO</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "models" && (
              <div className={styles.fadePanels}>
                <div className={styles.modelsGrid}>
                   {DEPLOYED_MODELS.map(model => (
                     <div key={model.name} className={styles.modelCard}>
                       <div className={styles.modelStatusFlex}>
                         <div className={`${styles.modelStatusDot} ${model.status === "Active" ? styles.dotActive : styles.dotIterating}`}></div>
                         <span className={styles.modelStatusText}>{model.status}</span>
                       </div>
                       <h4 className={styles.modelName}>{model.name}</h4>
                       <div className={styles.modelStats}>
                         <div><label>Accuracy</label> <span>{model.accuracy}</span></div>
                         <div><label>Uptime</label> <span>{model.uptime}</span></div>
                       </div>
                       <div className={styles.modelGraphMock}>
                         <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                           <polyline points="0,15 20,10 40,18 60,5 80,12 100,2" fill="none" stroke="var(--gn-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                         </svg>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
