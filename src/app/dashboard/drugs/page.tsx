"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface DrugItem {
  name: string;
  score: number;
  gene: string;
  note: string;
  pathways: string[];
  variantEvidence: string;
  severity?: "high" | "medium";
}

interface MetabolicEnzyme {
  enzyme: string;
  status: string;
  description: string;
}

interface PrescribingProfile {
  hasData: boolean;
  fileName?: string;
  metabolicProfile: MetabolicEnzyme[];
  favorable: DrugItem[];
  avoid: DrugItem[];
}

export default function DrugsPage() {
  const [profile, setProfile] = useState<PrescribingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPathway, setSelectedPathway] = useState("All");
  const [selectedDrug, setSelectedDrug] = useState<DrugItem | null>(null);

  // Fetch pharmacogenomics profile on mount
  useEffect(() => {
    fetch("/api/copilot/pharmacogenomics")
      .then(async (r) => {
        if (!r.ok) {
          const errText = await r.text().catch(() => "Unknown error");
          let errData;
          try {
            errData = JSON.parse(errText);
          } catch {
            errData = { error: errText || `HTTP ${r.status}` };
          }
          throw new Error(errData.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Error fetching pharmacogenomics data:", err);
        setProfile({ error: err.message || "Failed to fetch pharmacogenomics data." } as any);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh" }}>
        <div style={{ width: 60, height: 60, border: "3px solid rgba(16, 185, 129, 0.1)", borderTopColor: "var(--gn-primary)", borderRadius: "50%", animation: "spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite" }} />
        <h3 style={{ marginTop: "1.5rem", color: "var(--gn-primary)", letterSpacing: "0.15em", fontSize: "0.9rem", fontWeight: 700 }}>SEQUENCING METABOLIC PATHWAYS</h3>
        <p style={{ color: "var(--gn-text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Cross-referencing genetic variants with clinical drug interactions...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeProfile = (profile && profile.favorable && profile.avoid) ? profile : {
    hasData: false,
    metabolicProfile: [],
    favorable: [],
    avoid: []
  };

  const filterDrugs = (list: DrugItem[] = []) => {
    if (!list || !Array.isArray(list)) return [];
    return list.filter((drug) => {
      const matchesSearch = drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            drug.gene.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPathway = selectedPathway === "All" || drug.pathways.includes(selectedPathway);
      return matchesSearch && matchesPathway;
    });
  };

  const filteredFavorable = filterDrugs(activeProfile.favorable);
  const filteredAvoid = filterDrugs(activeProfile.avoid);

  const allPathways = ["All", ...Array.from(new Set([
    ...activeProfile.favorable.flatMap((d) => d.pathways),
    ...activeProfile.avoid.flatMap((d) => d.pathways)
  ]))];

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <div className={styles.eyebrow}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.5 16.5h13"/><path d="M12 13v7"/></svg>
              Precision Prescribing Engine
            </div>
            <span style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.68rem",
              background: activeProfile.hasData ? "rgba(16, 185, 129, 0.15)" : "rgba(234, 179, 8, 0.15)",
              color: activeProfile.hasData ? "var(--gn-success)" : "var(--gn-warning)",
              border: `1px solid ${activeProfile.hasData ? "var(--gn-success)" : "var(--gn-warning)"}33`,
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: 700
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 6px currentColor" }}></span>
              {activeProfile.hasData ? `Active Genome Linked (${activeProfile.fileName})` : "Standard Guidelines Mode"}
            </span>
          </div>
          <h1 className={styles.title}>Pharmacogenomics</h1>
          <p className={styles.subtitle}>AI-guided precision prescribing based on patient metabolic pathway profiling. Each recommendation is backed by detected variant evidence.</p>
        </div>
      </header>

      {profile && (profile as any).error && (
        <div style={{
          background: "rgba(244, 63, 94, 0.08)",
          border: "1px solid rgba(244, 63, 94, 0.25)",
          color: "var(--gn-danger)",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          fontSize: "0.82rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
        }}>
          <strong style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Error Loading Pharmacogenomics Report
          </strong>
          <span style={{ opacity: 0.9 }}>{(profile as any).error}</span>
        </div>
      )}

      {profile && (profile as any).isFallback && (
        <div style={{
          background: "rgba(234, 179, 8, 0.08)",
          border: "1px solid rgba(234, 179, 8, 0.25)",
          color: "var(--gn-warning)",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          fontSize: "0.82rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
        }}>
          <strong style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Genome Copilot API Quota Limit Reached
          </strong>
          <span style={{ opacity: 0.9, lineHeight: 1.4 }}>
            The system could not retrieve customized AI recommendations due to Gemini API rate limits. 
            Displaying standard baseline reference guidelines based on assumed normal metabolizer phenotypes.
          </span>
          <span style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.1rem" }}>
            API Details: {(profile as any).errorDetails}
          </span>
        </div>
      )}

      {/* ── Grid Layout ── */}
      <div className={styles.layout}>
        {/* Left Column: Search, Filters & Drug Lists */}
        <div className={styles.mainContent}>
          {/* Search & Filter Controls */}
          <div className={styles.filterRow}>
            {/* Search Dropdown */}
            <div className={styles.searchWrapper}>
              <select 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchSelect}
              >
                <option value="" style={{ background: "#0f172a", color: "var(--gn-white)" }}>Browse available Drugs & Genes...</option>
                <optgroup label="Medications" style={{ background: "#0f172a", color: "var(--gn-primary)" }}>
                  {Array.from(new Set([...activeProfile.favorable, ...activeProfile.avoid].map(d => d.name))).sort().map(name => (
                    <option key={name} value={name} style={{ color: "var(--gn-white)" }}>{name}</option>
                  ))}
                </optgroup>
                <optgroup label="Target Genes" style={{ background: "#0f172a", color: "var(--gn-warning)" }}>
                  {Array.from(new Set([...activeProfile.favorable, ...activeProfile.avoid].map(d => d.gene))).sort().map(gene => (
                    <option key={gene} value={gene} style={{ color: "var(--gn-white)" }}>{gene}</option>
                  ))}
                </optgroup>
              </select>
              <svg 
                className={styles.searchIcon}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {/* Pathway Tags */}
            <div className={styles.tagList}>
              {allPathways.map((pathway) => (
                <button
                  key={pathway}
                  onClick={() => setSelectedPathway(pathway)}
                  className={`${styles.filterTag} ${selectedPathway === pathway ? styles.filterTagActive : ""}`}
                >
                  {pathway}
                </button>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div className={styles.columns}>
            {/* ── Recommended ── */}
            <section className={styles.column}>
              <div className={`${styles.columnHeader} ${styles.headerSuccess}`}>
                <div className={styles.headerIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h2>Favorable Response</h2>
                  <p>{filteredFavorable.length} drugs matched criteria</p>
                </div>
              </div>
              <div className={styles.drugList}>
                {filteredFavorable.map((drug, i) => (
                  <article 
                    key={i} 
                    className={`${styles.drugCard} ${styles.cardSuccess}`}
                    onClick={() => setSelectedDrug(drug)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.cardTop}>
                      <div>
                        <h3 className={styles.drugName}>{drug.name}</h3>
                        <code className={styles.geneTag}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 5.4.5 7.6 1.5 2.2 4.2 3.4 6.8 3.1 1.4-.2 2.7-.8 3.7-1.8l.9.9c1 1 2.3 1.5 3.7 1.5 1.5 0 2.9-.6 3.9-1.6 1-1.1 1.6-2.5 1.6-4 0-1.5-.6-2.9-1.6-4-.9-1-2.2-1.6-3.6-1.6-1.5 0-2.9.6-3.9 1.6l-.9-.9c-1-1-2.3-1.5-3.7-1.5z"/></svg>
                          {drug.gene}
                        </code>
                      </div>
                      <div className={styles.scoreBadge}>
                        <span className={styles.scoreVal}>{drug.score}</span>
                        <span className={styles.scoreLbl}>Efficacy</span>
                      </div>
                    </div>
                    <div className={styles.efficacyBar}>
                      <div className={styles.efficacyFill} style={{ width: `${drug.score}%` }} />
                    </div>
                    <p className={styles.drugNote}>{drug.note}</p>
                    <div className={styles.pathwayTags}>
                      {drug.pathways.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                    </div>
                  </article>
                ))}
                {filteredFavorable.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--gn-text-muted)", fontSize: "0.8rem", background: "var(--gn-bg-glass)", borderRadius: "14px", border: "1px dashed var(--gn-border-light-strong)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: "0.4rem" }}><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <br/>
                    No favorable drug response matches found.
                  </div>
                )}
              </div>
            </section>

            {/* ── Avoid ── */}
            <section className={styles.column}>
              <div className={`${styles.columnHeader} ${styles.headerDanger}`}>
                <div className={styles.headerIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div>
                  <h2>Contraindicated / High Risk</h2>
                  <p>{filteredAvoid.length} drugs flagged</p>
                </div>
              </div>
              <div className={styles.drugList}>
                {filteredAvoid.map((drug, i) => (
                  <article 
                    key={i} 
                    className={`${styles.drugCard} ${styles.cardDanger}`}
                    onClick={() => setSelectedDrug(drug)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.cardTop}>
                      <div>
                        <h3 className={styles.drugName}>{drug.name}</h3>
                        <code className={styles.geneTag} style={{ background: "linear-gradient(90deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))", color: "var(--gn-danger)", borderColor: "rgba(244,63,94,0.2)" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 5.4.5 7.6 1.5 2.2 4.2 3.4 6.8 3.1 1.4-.2 2.7-.8 3.7-1.8l.9.9c1 1 2.3 1.5 3.7 1.5 1.5 0 2.9-.6 3.9-1.6 1-1.1 1.6-2.5 1.6-4 0-1.5-.6-2.9-1.6-4-.9-1-2.2-1.6-3.6-1.6-1.5 0-2.9.6-3.9 1.6l-.9-.9c-1-1-2.3-1.5-3.7-1.5z"/></svg>
                          {drug.gene}
                        </code>
                      </div>
                      <span className={`${styles.sevBadge} ${styles[`sev_${drug.severity || "high"}`]}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        {drug.severity === "medium" ? "ELEVATED RISK" : "HIGH RISK"}
                      </span>
                    </div>
                    <p className={styles.drugNote}>{drug.note}</p>
                    <div className={styles.failureRow}>
                      <span className={styles.failureLabel}>Toxicity / Failure</span>
                      <div className={styles.failureTrack}>
                        <div className={styles.failureBar} style={{ width: `${100 - drug.score}%` }} />
                      </div>
                      <span className={styles.failurePct}>{100 - drug.score}%</span>
                    </div>
                  </article>
                ))}
                {filteredAvoid.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--gn-text-muted)", fontSize: "0.8rem", background: "var(--gn-bg-glass)", borderRadius: "14px", border: "1px dashed var(--gn-border-light-strong)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: "0.4rem" }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    <br/>
                    No contraindicated drug response matches found.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Sidebar with Pathway Status */}
        <aside className={styles.sidebar}>
          <span className={styles.mutedLabel}>Metabolic Pathway Status</span>
          <div className={styles.pathwayGrid}>
            {activeProfile.metabolicProfile.map((met, idx) => {
              const isPoor = met.status.toLowerCase().includes("poor") || met.status.toLowerCase().includes("impaired");
              const isUltra = met.status.toLowerCase().includes("ultra");
              
              let statusClass = styles.pathwayCardSuccess;
              let statusColor = "var(--gn-success)";
              if (isPoor) {
                statusClass = styles.pathwayCardDanger;
                statusColor = "var(--gn-danger)";
              } else if (isUltra) {
                statusClass = styles.pathwayCardWarning;
                statusColor = "var(--gn-warning)";
              } else if (met.status.toLowerCase().includes("awaiting")) {
                statusClass = styles.pathwayCardMuted;
                statusColor = "var(--gn-text-muted)";
              }

              return (
                <div key={idx} className={`${styles.pathwayCard} ${statusClass}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--gn-white)" }}>{met.enzyme}</strong>
                    <span style={{ fontSize: "0.62rem", padding: "2px 6px", borderRadius: "4px", background: `${statusColor}15`, color: statusColor, fontWeight: 800, border: `1px solid ${statusColor}33`, letterSpacing: "0.05em" }}>
                      {met.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--gn-text-secondary)", lineHeight: 1.4 }}>{met.description}</p>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ── Interactive Detail Modal ── */}
      {selectedDrug && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDrug(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedDrug(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className={styles.modalHeader}>
              <div 
                className={styles.modalIconWrapper}
                style={{ 
                  background: selectedDrug.severity ? "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))" : "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
                  border: selectedDrug.severity ? "1px solid rgba(244,63,94,0.25)" : "1px solid rgba(16,185,129,0.25)",
                  color: selectedDrug.severity ? "var(--gn-danger)" : "var(--gn-success)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.5 16.5h13"/><path d="M12 13v7"/></svg>
              </div>
              <div>
                <h3 className={styles.modalTitle}>{selectedDrug.name}</h3>
                <code className={styles.modalGeneTag}>
                  Gene Target: {selectedDrug.gene}
                </code>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div>
                <span className={styles.mutedLabel}>Genomic Variant Evidence</span>
                <p className={styles.modalEvidenceText}>
                  {selectedDrug.variantEvidence || "No specific variant flagged in sequence."}
                </p>
              </div>

              <div>
                <span className={styles.mutedLabel}>Clinical Interaction Note</span>
                <p className={styles.modalNoteText}>
                  {selectedDrug.note}
                </p>
              </div>

              <div 
                className={styles.modalDiagnosticBox}
                style={{ 
                  background: selectedDrug.severity ? "linear-gradient(135deg, rgba(244,63,94,0.08), transparent)" : "linear-gradient(135deg, rgba(16,185,129,0.08), transparent)", 
                }}
              >
                <div className={styles.modalDiagnosticHeader}>
                  <span className={styles.modalDiagnosticLabel}>Diagnostic Metric</span>
                  <span 
                    className={styles.modalDiagnosticValue}
                    style={{ color: selectedDrug.severity ? "var(--gn-danger)" : "var(--gn-success)" }}
                  >
                    {selectedDrug.severity ? "TOXICITY RISK" : "METABOLIC EFFICACY"}
                  </span>
                </div>
                <div className={styles.modalProgressBarWrapper}>
                  <div className={styles.modalProgressBarTrack}>
                    <div 
                      className={styles.modalProgressBarFill}
                      style={{
                        width: `${selectedDrug.severity ? (100 - selectedDrug.score) : selectedDrug.score}%`,
                        background: selectedDrug.severity ? "linear-gradient(90deg, var(--gn-danger), #fb7185)" : "linear-gradient(90deg, var(--gn-success), #34d399)",
                      }} 
                    />
                  </div>
                  <strong 
                    className={styles.modalProgressValue}
                    style={{ color: selectedDrug.severity ? "var(--gn-danger)" : "var(--gn-success)" }}
                  >
                    {selectedDrug.severity ? `${100 - selectedDrug.score}%` : `${selectedDrug.score}%`}
                  </strong>
                </div>
              </div>

              <div className={styles.modalFooterInfo}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Recommendations sourced from CPIC & FDA guidelines. Consult a medical provider.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
