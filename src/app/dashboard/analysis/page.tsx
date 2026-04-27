"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

const CATEGORY_ICONS: Record<string, string> = {
  Pharmacogenomic: "💊",
  Oncology: "🔬",
  Neurology: "🧠",
  Hematology: "🩸",
  "Drug Resistance": "⚠️",
  "Functional Domain": "🧬",
  Genomic: "🔗",
};

const SEVERITY_LABELS: Record<string, string> = { high: "HIGH", medium: "MED", low: "LOW" };

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mutations, setMutations] = useState<any[]>([]);
  const [indels, setIndels] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<string[]>(Array(64).fill("none"));
  const [selectedGene, setSelectedGene] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [variantTab, setVariantTab] = useState<"snps" | "indels">("snps");
  const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [analysisInfo, setAnalysisInfo] = useState<any>(null);
  const searchParams = useSearchParams();
  const explicitQueryId = searchParams.get("queryId");
  const explicitRefId = searchParams.get("refId");

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/analysis/history");
      const data = await res.json();
      if (data.success) setHistory(data.history || []);
    } catch (err) {}
  };

  useEffect(() => {
    if (error) fetchHistory();
  }, [error]);

  const processAnalysisResult = (sData: any) => {
    const rawMutations: any[] = sData.result.mutations_found || [];
    const rawIndels: any[] = sData.result.indels_found || [];

    // Organism & metadata banner
    setAnalysisInfo({
      organism:       sData.result.detected_organism ?? "Unknown",
      alignmentScore: sData.result.alignment_score ?? null,
      queryLength:    sData.result.query_length ?? null,
      refLength:      sData.result.reference_length ?? null,
      model:          sData.result.analysis_metadata?.model ?? "RandomForest-v1",
      algorithm:      sData.result.analysis_metadata?.algorithm ?? "Needleman-Wunsch",
      geneMap:        sData.result.analysis_metadata?.gene_map_used ?? [],
    });

    // Chromosome heatmap — weighted by AI severity
    const allVariants = [...rawMutations, ...rawIndels];
    const newHeatmap = Array(64).fill(0);
    const maxPos = allVariants.length > 0 ? Math.max(...allVariants.map((m: any) => m.position)) : 1;
    const scale = maxPos > 0 ? maxPos : 1;
    allVariants.forEach((m: any) => {
      const bucket = Math.min(63, Math.floor((m.position / scale) * 63));
      if (bucket >= 0 && bucket < 64) {
        newHeatmap[bucket] += m.severity === "high" ? 6 : m.severity === "medium" ? 3 : 1;
      }
    });
    setHeatmapData(newHeatmap.map(count => {
      if (count >= 6) return "high";
      if (count >= 3) return "medium";
      if (count >= 1) return "low";
      return "none";
    }));

    // Format SNPs — severity, category, impact come from AI engine directly
    const formatted = rawMutations.map((m: any, idx: number) => {
      const severity = m.severity ?? "low";
      const region = m.functional_region ?? "Intergenic";
      const confidence = m.ai_confidence ?? 0;
      const isDrSite = m.drug_resistance_site ?? false;

      let category = "Genomic";
      if (isDrSite) category = "Drug Resistance";
      else if (region !== "Intergenic") category = "Functional Domain";

      const impact = isDrSite
        ? `⚠️ Known drug-resistance site at position ${m.position} (${region}). Clinical correlation required.`
        : m.in_functional_domain
          ? `Variant in ${region} gene region. ${m.type} at codon position ${m.codon_position}. AI confidence: ${(confidence * 100).toFixed(0)}%.`
          : `${m.type} in intergenic region at position ${m.position}. Likely low functional impact. AI confidence: ${(confidence * 100).toFixed(0)}%.`;

      const hgvs = `${region}:g.${m.position}${m.reference}>${m.query}`;
      return {
        id: `mut_${idx}`,
        gene: hgvs,
        type: m.type ?? "SNP",
        variant: `${m.reference} → ${m.query}`,
        severity,
        impact,
        category,
        ai_confidence: confidence,
        functional_region: region,
        drug_resistance_site: isDrSite,
        raw: m,
      };
    });
    setMutations(formatted);

    // Format Indels
    const formattedIndels = rawIndels.map((m: any, idx: number) => ({
      id: `indel_${idx}`,
      position: m.position,
      type: m.type === "insertion" ? "Insertion" : "Deletion",
      base: m.query_base ?? m.reference_base ?? "–",
      severity: m.severity ?? "low",
      functional_region: m.functional_region ?? "Intergenic",
      ai_confidence: m.ai_confidence ?? 0,
      drug_resistance_site: m.drug_resistance_site ?? false,
    }));
    setIndels(formattedIndels);

    if (formatted.length > 0) setSelectedGene(formatted[0]);
    else if (formattedIndels.length > 0) setVariantTab("indels");
  };

  const loadHistoricalAnalysis = async (id: string) => {
    setLoading(true);
    setError("");
    setIsDismissed(false);
    setShowHistoryView(false);
    setCurrentComparisonId(id);
    try {
      const sRes = await fetch(`/api/analysis/compare/${id}`);
      const sData = await sRes.json();
      if (sData.success && sData.result.status === 'completed') {
        processAnalysisResult(sData);
      } else {
        throw new Error("Analysis results not ready or failed.");
      }
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically trigger the Python pipeline silently
    const triggerAutoAnalysis = async () => {
      try {
        let data;
        
        if (explicitQueryId && explicitRefId) {
          const res = await fetch("/api/analysis/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queryFileId: explicitQueryId, referenceFileId: explicitRefId })
          });
          data = await res.json();
        } else {
          const res = await fetch("/api/analysis/auto", { method: "POST" });
          data = await res.json();
        }
        
        if (!data.success) {
          throw new Error(data.error || "Failed to trigger analysis workflow. Did you upload files?");
        }
        
        setCurrentComparisonId(data.comparisonId);

        // Poll for background progression
        const pollId = setInterval(async () => {
          const sRes = await fetch(`/api/analysis/compare/${data.comparisonId}`);
          const sData = await sRes.json();
          if (sData.success) {
            if (sData.result.status === 'completed') {
              clearInterval(pollId);
              processAnalysisResult(sData);
              setLoading(false);
            } else if (sData.result.status === 'failed') {
               clearInterval(pollId);
               setError("Python Engine computation failed drastically.");
               setLoading(false);
            } else if (sData.result.status === 'dismissed') {
               clearInterval(pollId);
               setError("Analysis dismissed.");
               setIsDismissed(true);
               setLoading(false);
            }
          }
        }, 1500);

      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    triggerAutoAnalysis();
  }, []);

  if (loading) {
    return (
      <div className={styles.container} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh'}}>
        <div style={{width: 60, height: 60, border: '4px solid rgba(16, 185, 129, 0.1)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
        <h2 style={{marginTop: '2rem', color: '#10b981', letterSpacing: '0.1em'}}>SCANNING MOLECULAR DATA...</h2>
        <p style={{color: '#888', marginTop: '0.5rem'}}>Passing sequences through the Python Alignment Engine</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleDismiss = async () => {
    if (!currentComparisonId) return;
    try {
      await fetch(`/api/analysis/dismiss/${currentComparisonId}`, { method: "POST" });
      setError("Analysis dismissed.");
      setIsDismissed(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (error) {
    const isMissing = error.includes("Missing either");
    const isFriendly = isMissing || isDismissed;

    return (
      <div className={styles.container} style={{padding: '5rem', textAlign: 'center'}}>
        <h2 style={{color: isFriendly ? 'var(--gn-warning)' : '#ef4444'}}>
          {isMissing ? "Action Required" : isDismissed ? "Dashboard Ready" : "Analysis System Failure"}
        </h2>
        <p style={{color: '#888', marginTop: '1rem', marginBottom: '2rem'}}>
          {isDismissed ? "No active analysis. Please upload new genomic data to begin." : error}
        </p>
        
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
          <a href="/dashboard/upload" style={{display: 'inline-block', padding: '1rem 2rem', background: 'var(--gn-primary)', color: 'black', fontWeight: 'bold', borderRadius: '8px', textDecoration: 'none'}}>
            {isMissing || isDismissed ? "Go to Upload Station" : "Upload Different File"}
          </a>
          
          {!isFriendly && currentComparisonId && (
            <button 
              onClick={handleDismiss} 
              style={{padding: '1rem 2rem', background: 'transparent', color: '#888', border: '1px solid #333', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', outline: 'none'}}
            >
              Dismiss Error
            </button>
          )}
        </div>

        {history.length > 0 && (
          <div style={{marginTop: '4rem', textAlign: 'left', maxWidth: '1000px', margin: '4rem auto 0'}}>
            <h3 style={{color: 'var(--gn-text-secondary)', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', fontWeight: 600}}>Previous Analysis Runs</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {history.map((h: any) => (
                <div key={h.id} 
                  onClick={() => h.status === 'completed' && loadHistoricalAnalysis(h.id)}
                  style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '1.25rem', 
                    background: 'var(--gn-bg-glass)', 
                    border: '1px solid var(--gn-border-light-strong)', 
                    borderRadius: '8px', 
                    cursor: h.status === 'completed' ? 'pointer' : 'default',
                    opacity: h.status === 'completed' ? 1 : 0.6,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={(e) => h.status === 'completed' && (e.currentTarget.style.borderColor = 'var(--gn-primary)')}
                  onMouseOut={(e) => h.status === 'completed' && (e.currentTarget.style.borderColor = 'var(--gn-border-light-strong)')}
                >
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.3rem'}}>
                    <strong style={{color: 'var(--gn-white)', fontSize: '1.05rem'}}>{h.query_name} <span style={{color: 'var(--gn-text-muted)', margin: '0 0.5rem'}}>vs</span> <span style={{fontWeight: 'normal', color: 'var(--gn-blue)'}}>{h.ref_name}</span></strong>
                    <span style={{fontSize: '0.85rem', color: 'var(--gn-text-muted)'}}>{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.3rem 0.6rem', borderRadius: '4px',
                      background: h.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      color: h.status === 'completed' ? 'var(--gn-success)' : 'var(--gn-danger)'
                    }}>
                      {h.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const filtered = variantTab === "indels"
    ? (filter === "all" ? indels : indels.filter((m) => m.severity === filter))
    : (filter === "all" ? mutations : mutations.filter((m) => m.severity === filter));
  const highCount = mutations.filter((m) => m.severity === "high").length;
  const medCount  = mutations.filter((m) => m.severity === "medium").length;
  const lowCount  = mutations.filter((m) => m.severity === "low").length;
  const drCount   = mutations.filter((m) => m.drug_resistance_site).length;

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>
            <span>🔬 Variant Analysis Module</span>
          </div>
          <h1 className={styles.title}>Mutation Analysis</h1>
          <p className={styles.subtitle}>Review identified variants, severity classifications, and evidence-based clinical impacts.</p>
          {analysisInfo && (
            <div style={{
              marginTop: '1rem', padding: '0.75rem 1.25rem',
              background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '10px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center'
            }}>
              <span style={{color: 'var(--gn-primary)', fontWeight: 700, fontSize: '0.9rem'}}>
                🧬 {analysisInfo.organism || "Unknown Organism"}
              </span>
              <span style={{color: 'var(--gn-text-muted)', fontSize: '0.8rem'}}>•</span>
              <span style={{color: 'var(--gn-text-secondary)', fontSize: '0.82rem'}}>
                {analysisInfo.algorithm} alignment
              </span>
              <span style={{color: 'var(--gn-text-muted)', fontSize: '0.8rem'}}>•</span>
              <span style={{color: 'var(--gn-text-secondary)', fontSize: '0.82rem'}}>
                AI: {analysisInfo.model}
              </span>
              {analysisInfo.geneMap?.length > 0 && (
                <>
                  <span style={{color: 'var(--gn-text-muted)', fontSize: '0.8rem'}}>•</span>
                  <span style={{color: 'var(--gn-text-secondary)', fontSize: '0.82rem'}}>
                    Gene map: {analysisInfo.geneMap.join(", ")}
                  </span>
                </>
              )}
              {drCount > 0 && (
                <span style={{
                  background: 'rgba(239,68,68,0.15)', color: '#f87171',
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700
                }}>⚠️ {drCount} Drug Resistance Site{drCount > 1 ? 's' : ''}</span>
              )}
            </div>
          )}
          <button 
            onClick={() => { setShowHistoryView(!showHistoryView); if (!showHistoryView) fetchHistory(); }}
            style={{ 
               background: 'transparent', border: '1px solid var(--gn-primary)', 
               color: 'var(--gn-primary)', padding: '0.5rem 1rem', borderRadius: '6px', 
               cursor: 'pointer', fontSize: '0.85rem', marginTop: '1rem', fontWeight: 600,
               width: 'fit-content', transition: 'all 0.2s', outline: 'none'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {showHistoryView ? "← Return to Active Analysis" : "View Past Analyses"}
          </button>
        </div>
        {!showHistoryView && (
          <div className={styles.kpiStrip}>
            <div className={styles.kpiBubble}>
              <span className={styles.kpiNum}>{mutations.length}</span>
              <span className={styles.kpiLbl}>SNPs</span>
            </div>
            <div className={styles.kpiBubble}>
              <span className={styles.kpiNum}>{indels.length}</span>
              <span className={styles.kpiLbl}>Indels</span>
            </div>
            <div className={`${styles.kpiBubble} ${styles.kpiDanger}`}>
              <span className={styles.kpiNum}>{highCount}</span>
              <span className={styles.kpiLbl}>High Priority</span>
            </div>
            <div className={`${styles.kpiBubble} ${styles.kpiWarning}`}>
              <span className={styles.kpiNum}>{medCount}</span>
              <span className={styles.kpiLbl}>Medium</span>
            </div>
            <div className={`${styles.kpiBubble} ${styles.kpiSuccess}`}>
              <span className={styles.kpiNum}>{lowCount}</span>
              <span className={styles.kpiLbl}>Low Risk</span>
            </div>
            <div className={`${styles.kpiBubble}`} style={{borderColor: '#f59e0b', background: 'rgba(245,158,11,0.05)'}}>
              <span className={styles.kpiNum} style={{color: '#f59e0b'}}>{drCount}</span>
              <span className={styles.kpiLbl}>Drug Resist.</span>
            </div>
          </div>
        )}
      </header>

      {showHistoryView ? (
        <div style={{marginTop: '2rem', textAlign: 'left', maxWidth: '100%', margin: '2rem 0 4rem 0'}}>
          <h3 style={{color: 'var(--gn-text-secondary)', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', fontWeight: 600}}>Previous Analysis Runs</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            {history.length === 0 ? (
               <p style={{color: 'var(--gn-text-muted)'}}>No past experiments found.</p>
            ) : history.map((h: any) => (
              <div key={h.id} 
                onClick={() => h.status === 'completed' && loadHistoricalAnalysis(h.id)}
                style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1.25rem', 
                  background: 'var(--gn-bg-glass)', 
                  border: '1px solid var(--gn-border-light-strong)', 
                  borderRadius: '8px', 
                  cursor: h.status === 'completed' ? 'pointer' : 'default',
                  opacity: h.status === 'completed' ? 1 : 0.6,
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e) => h.status === 'completed' && (e.currentTarget.style.borderColor = 'var(--gn-primary)')}
                onMouseOut={(e) => h.status === 'completed' && (e.currentTarget.style.borderColor = 'var(--gn-border-light-strong)')}
              >
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.3rem'}}>
                  <strong style={{color: 'var(--gn-white)', fontSize: '1.05rem'}}>{h.query_name} <span style={{color: 'var(--gn-text-muted)', margin: '0 0.5rem'}}>vs</span> <span style={{fontWeight: 'normal', color: 'var(--gn-blue)'}}>{h.ref_name}</span></strong>
                  <span style={{fontSize: '0.85rem', color: 'var(--gn-text-muted)'}}>{new Date(h.created_at).toLocaleString()}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.3rem 0.6rem', borderRadius: '4px',
                    background: h.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    color: h.status === 'completed' ? 'var(--gn-success)' : 'var(--gn-danger)'
                  }}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
        {/* ── Variant Table ── */}
        <section className={styles.tableSection}>
          <div className={styles.cardHeader}>
            <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>
              <h2 className={styles.cardTitle}>Identified Variants</h2>
              <div style={{display:'flex', background:'#05080d', padding:'3px', borderRadius:'8px', border:'1px solid #1e293b'}}>
                <button
                  onClick={() => setVariantTab("snps")}
                  style={{padding:'4px 12px', borderRadius:'6px', fontSize:'0.8rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.2s',
                    background: variantTab === "snps" ? 'var(--gn-primary)' : 'transparent',
                    color: variantTab === "snps" ? '#000' : 'var(--gn-text-muted)'
                  }}
                >SNPs ({mutations.length})</button>
                <button
                  onClick={() => setVariantTab("indels")}
                  style={{padding:'4px 12px', borderRadius:'6px', fontSize:'0.8rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.2s',
                    background: variantTab === "indels" ? '#f59e0b' : 'transparent',
                    color: variantTab === "indels" ? '#000' : 'var(--gn-text-muted)'
                  }}
                >Indels ({indels.length})</button>
              </div>
            </div>
            <div className={styles.filterPills}>
              {["all", "high", "medium", "low"].map((s) => (
                <button
                  key={s}
                  className={`${styles.pill} ${filter === s ? styles.pillActive : ""} ${filter === s && s !== "all" ? styles[`pill_${s}`] : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {variantTab === "snps" ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Locus</th>
                  <th>Type</th>
                  <th>Variant</th>
                  <th>Region</th>
                  <th>AI Confidence</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {(filter === "all" ? mutations : mutations.filter(m => m.severity === filter)).map((mut, idx) => (
                  <tr
                    key={mut.id}
                    className={`${styles.tableRow} ${selectedGene?.id === mut.id ? styles.rowActive : ""}`}
                    onClick={() => setSelectedGene(mut)}
                    style={mut.drug_resistance_site ? {borderLeft: '3px solid #f87171'} : {}}
                  >
                    <td className={styles.tdNum}>{idx + 1}</td>
                    <td>
                      <span className={styles.geneLabel}>{mut.gene}</span>
                    </td>
                    <td>{mut.type}</td>
                    <td><code className={styles.code} style={{color: '#f87171'}}>{mut.variant}</code></td>
                    <td>
                      <span className={styles.categoryPill}>
                        {CATEGORY_ICONS[mut.category] ?? '🔗'} {mut.functional_region}
                      </span>
                    </td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'0.4rem'}}>
                        <div style={{width:40, height:5, background:'#1e293b', borderRadius:3, overflow:'hidden'}}>
                          <div style={{width:`${Math.round(mut.ai_confidence*100)}%`, height:'100%', background: mut.ai_confidence > 0.7 ? 'var(--gn-primary)' : '#f59e0b', borderRadius:3}} />
                        </div>
                        <span style={{fontSize:'0.75rem', color:'var(--gn-text-muted)'}}>{Math.round(mut.ai_confidence*100)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.severityBadge} ${styles[`badge_${mut.severity}`]}`}>
                        {SEVERITY_LABELS[mut.severity]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Position</th>
                  <th>Type</th>
                  <th>Base</th>
                  <th>Region</th>
                  <th>AI Confidence</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {(filter === "all" ? indels : indels.filter(m => m.severity === filter)).map((indel, idx) => (
                  <tr key={indel.id} className={styles.tableRow} style={indel.drug_resistance_site ? {borderLeft: '3px solid #f87171'} : {}}>
                    <td className={styles.tdNum}>{idx + 1}</td>
                    <td><span className={styles.geneLabel}>pos.{indel.position}</span></td>
                    <td><code className={styles.code} style={{color: indel.type === 'Insertion' ? '#34d399' : '#f87171'}}>{indel.type}</code></td>
                    <td><code className={styles.code}>{indel.base}</code></td>
                    <td><span className={styles.categoryPill}>🧬 {indel.functional_region}</span></td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'0.4rem'}}>
                        <div style={{width:40, height:5, background:'#1e293b', borderRadius:3, overflow:'hidden'}}>
                          <div style={{width:`${Math.round(indel.ai_confidence*100)}%`, height:'100%', background: indel.ai_confidence > 0.7 ? 'var(--gn-primary)' : '#f59e0b', borderRadius:3}} />
                        </div>
                        <span style={{fontSize:'0.75rem', color:'var(--gn-text-muted)'}}>{Math.round(indel.ai_confidence*100)}%</span>
                      </div>
                    </td>
                    <td><span className={`${styles.severityBadge} ${styles[`badge_${indel.severity}`]}`}>{SEVERITY_LABELS[indel.severity]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          {filtered.length === 0 && (
            <div className={styles.noResults}>No variations detected within this biological filter set.</div>
          )}
        </section>

        {/* ── Side Panel ── */}
        {selectedGene && (
          <div className={styles.sidePanel}>
            {/* Gene Detail */}
            <section className={styles.detailCard}>
              <div className={styles.detailTopBar}>
                <span className={styles.categoryTag}>
                  {CATEGORY_ICONS[selectedGene.category]} {selectedGene.category}
                </span>
                <span className={`${styles.severityBadge} ${styles[`badge_${selectedGene.severity}`]}`}>
                  {SEVERITY_LABELS[selectedGene.severity]}
                </span>
              </div>

              <h3 className={styles.detailGeneName}>{selectedGene.gene}</h3>

              <div className={styles.detailProperty}>
                <span className={styles.propertyLabel}>Mutation Type</span>
                <span className={styles.propertyValue}>{selectedGene.type}</span>
              </div>
              <div className={styles.detailProperty}>
                <span className={styles.propertyLabel}>Variant Substitution Map</span>
                <code className={styles.code} style={{display: 'inline-block', background: 'var(--gn-bg)', border: '1px solid var(--gn-border)', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '1.1rem', letterSpacing: '4px'}}>
                  <span style={{color: 'var(--gn-blue)', fontWeight: 'bold'}}>{selectedGene.raw.reference}</span>
                  <span style={{color: '#555', margin: '0 1rem'}}>→</span>
                  <span style={{color: 'var(--gn-danger)', fontWeight: 'bold'}}>{selectedGene.raw.query}</span>
                </code>
              </div>
              <div className={styles.detailProperty}>
                <span className={styles.propertyLabel}>Clinical Impact</span>
                <p className={styles.impactText}>{selectedGene.impact}</p>
              </div>

              {selectedGene.severity === "high" && (
                <div className={styles.urgentAlert}>
                  <span>⚠️</span>
                  <span>Immediate clinical review recommended for this variant.</span>
                </div>
              )}

              <button className={styles.actionButton}>
                Explore in 3D Viewer →
              </button>
            </section>

            {/* Heatmap */}
            <section className={styles.heatmapCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Chromosome Heatmap</h3>
              </div>
              <p className={styles.heatmapDesc}>Mutation density distribution across the evaluated genomic sequence.</p>
              <div className={styles.heatmapGrid}>
                {heatmapData.map((val, i) => (
                  <div
                    key={i}
                    className={`${styles.heatCell} ${styles[`heat_${val}`]}`}
                    title={`Region Segment ${i + 1}: ${val} mutation density`}
                  />
                ))}
              </div>
              <div className={styles.heatLegend}>
                <span>Low</span>
                <div className={styles.legendGradient} />
                <span>High</span>
              </div>
            </section>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
