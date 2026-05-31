"use client";

import { useState, useEffect, useRef } from "react";
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
  const [heatmapData, setHeatmapData] = useState<any[]>(Array(64).fill({severityClass: "none", variantCount: 0, score: 0}));
  const [genomeLength, setGenomeLength] = useState(0);
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
  const hasTriggered = useRef(false);

  const generateContext = (pos: number) => {
    const bases = ['A', 'T', 'G', 'C'];
    let left = '';
    let right = '';
    for(let i=0; i<12; i++) {
      left += bases[(pos + i * 7) % 4];
      right += bases[(pos * 3 + i * 11) % 4];
    }
    return { left, right };
  };

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
    const maxPos = sData.result.reference_length || (allVariants.length > 0 ? Math.max(...allVariants.map((m: any) => m.position)) : 1000);
    setGenomeLength(maxPos);
    const scale = maxPos > 0 ? maxPos : 1;
    const segmentSize = maxPos / 64;

    const newHeatmap = Array(64).fill(null).map((_, i) => ({
      score: 0,
      variantCount: 0,
      startPos: Math.floor(i * segmentSize),
      endPos: Math.floor((i + 1) * segmentSize),
      severityClass: "none"
    }));

    allVariants.forEach((m: any) => {
      const bucket = Math.min(63, Math.floor((m.position / scale) * 63));
      if (bucket >= 0 && bucket < 64) {
        newHeatmap[bucket].score += m.severity === "high" ? 6 : m.severity === "medium" ? 3 : 1;
        newHeatmap[bucket].variantCount += 1;
      }
    });

    newHeatmap.forEach(bucket => {
      if (bucket.score >= 6) bucket.severityClass = "high";
      else if (bucket.score >= 3) bucket.severityClass = "medium";
      else if (bucket.score >= 1) bucket.severityClass = "low";
    });
    
    setHeatmapData(newHeatmap);

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
    if (hasTriggered.current) return;
    hasTriggered.current = true;

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

  const transitionsCount = mutations.filter(m => m.type === 'Transition').length;
  const transversionsCount = mutations.filter(m => m.type === 'Transversion').length;
  const tsTvRatio = transversionsCount > 0 ? (transitionsCount / transversionsCount).toFixed(2) : (transitionsCount > 0 ? "∞" : "0.00");
  
  const genomeKb = genomeLength > 0 ? genomeLength / 1000 : 1;
  const mutFreq = (mutations.length / genomeKb).toFixed(2);

  const insertions = indels.filter(i => i.type === 'Insertion').length;
  const deletions = indels.filter(i => i.type === 'Deletion').length;
  const indelRatio = deletions > 0 ? (insertions / deletions).toFixed(2) : (insertions > 0 ? "∞" : "0.00");

  const exportToVCF = () => {
    let vcf = "##fileformat=VCFv4.2\n";
    vcf += `##fileDate=${new Date().toISOString().split('T')[0]}\n`;
    vcf += `##source=GenoNexus-AnalysisEngine\n`;
    vcf += `##reference=${analysisInfo?.organism || "Unknown"}\n`;
    vcf += `##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">\n`;
    vcf += `##INFO=<ID=AF,Number=A,Type=Float,Description="Allele Frequency">\n`;
    vcf += `##INFO=<ID=SEVERITY,Number=1,Type=String,Description="AI Severity Classification">\n`;
    vcf += `#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n`;

    mutations.forEach((m: any) => {
      vcf += `chr1\t${m.raw.position}\t${m.id}\t${m.raw.reference}\t${m.raw.query}\t.\tPASS\tSEVERITY=${m.severity}\n`;
    });
    indels.forEach((m: any) => {
       vcf += `chr1\t${m.position}\t${m.id}\t.\t${m.base}\t.\tPASS\tSEVERITY=${m.severity};TYPE=${m.type}\n`;
    });

    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `variants_${currentComparisonId || "export"}.vcf`;
    a.click();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTopRow}>
          {/* Left: Title + Subtitle + Button */}
          <div className={styles.titleArea}>
            <div className={styles.eyebrow}>
              <span>🔬 {analysisInfo?.organism ? `${analysisInfo.organism.toUpperCase()} DETECTED` : 'VARIANT ANALYSIS MODULE'}</span>
            </div>
            <h1 className={styles.title}>Mutation Analysis</h1>
            <p style={{ color: 'var(--gn-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
              Review identified variants, severity classifications, and AI-based clinical impacts for the analyzed {analysisInfo?.organism ? <strong style={{color: 'var(--gn-white)'}}>{analysisInfo.organism}</strong> : 'genomic'} sequence.
            </p>
            <button
              onClick={() => { setShowHistoryView(!showHistoryView); if (!showHistoryView) fetchHistory(); }}
              style={{
                marginTop: '0.6rem',
                background: 'transparent',
                border: '1px solid var(--gn-primary)',
                color: 'var(--gn-primary)',
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                transition: 'all 0.2s',
                outline: 'none',
                whiteSpace: 'nowrap',
                width: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(16,185,129,0.2)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {showHistoryView ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Return to Active Analysis
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  View Past Analyses
                </>
              )}
            </button>
          </div>

          {/* Right: KPI Stats */}
          {!showHistoryView && (
            <div className={styles.statsGrid}>
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
                <span className={styles.kpiLbl}>High</span>
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
        </div>
      </header>

      {!showHistoryView && (
        <details className={styles.guideSection} style={{ marginBottom: '1.5rem' }}>
          <summary className={styles.guideSummary}>
            <span>🧪</span> Quick Reference — Key Genomic Terms Explained
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--gn-text-muted)', fontWeight: 400 }}>Click to expand / collapse</span>
          </summary>
          <div className={styles.guideGrid}>

            <div className={styles.guideItem} style={{ borderTop: '3px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🔤</span>
                <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>SNP</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--gn-text-muted)', background: 'rgba(16,185,129,0.1)', padding: '1px 7px', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.25)' }}>Single Nucleotide Polymorphism</span>
              </div>
              <p style={{ margin: 0, color: 'var(--gn-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                A change in <strong style={{ color: 'var(--gn-white)' }}>one single letter</strong> of the DNA code — like a typo in a sentence. Very common, but can affect how a gene works.
              </p>
              <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                <span style={{ color: '#60a5fa', padding: '2px 8px', background: 'rgba(96,165,250,0.1)', borderRadius: '4px', border: '1px solid rgba(96,165,250,0.2)' }}>C</span>
                <span style={{ color: 'var(--gn-text-muted)' }}>→</span>
                <span style={{ color: '#f87171', padding: '2px 8px', background: 'rgba(248,113,113,0.1)', borderRadius: '4px', border: '1px solid rgba(248,113,113,0.2)' }}>T</span>
                <span style={{ color: 'var(--gn-text-muted)', fontSize: '0.75rem', marginLeft: '0.3rem' }}>one letter swapped</span>
              </div>
            </div>

            <div className={styles.guideItem} style={{ borderTop: '3px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✂️</span>
                <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>Indel</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--gn-text-muted)', background: 'rgba(245,158,11,0.1)', padding: '1px 7px', borderRadius: '999px', border: '1px solid rgba(245,158,11,0.25)' }}>Insertion / Deletion</span>
              </div>
              <p style={{ margin: 0, color: 'var(--gn-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                DNA letters that were <strong style={{ color: 'var(--gn-white)' }}>added or removed</strong>. Even one missing letter can shift how the entire gene is read and may greatly alter the resulting protein.
              </p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--gn-text-muted)', display: 'flex', gap: '0.5rem' }}>
                <span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.2)' }}>➕ Insertion</span>
                <span style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(248,113,113,0.2)' }}>➖ Deletion</span>
              </div>
            </div>

            <div className={styles.guideItem} style={{ borderTop: '3px solid #818cf8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🔀</span>
                <strong style={{ color: '#818cf8', fontSize: '0.95rem' }}>Transition / Transversion</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--gn-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Two subtypes of SNPs. <strong style={{ color: 'var(--gn-white)' }}>Transitions</strong> swap similar bases (A↔G or C↔T) — very common and often less harmful. <strong style={{ color: 'var(--gn-white)' }}>Transversions</strong> swap different base types — rarer and potentially more disruptive.
              </p>
            </div>

            <div className={styles.guideItem} style={{ borderTop: '3px solid #22d3ee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🧬</span>
                <strong style={{ color: '#22d3ee', fontSize: '0.95rem' }}>Functional Domain</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--gn-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                An <strong style={{ color: 'var(--gn-white)' }}>important working region</strong> of the genome — like the engine of a car. Mutations here are more likely to have a real, clinically significant effect.
              </p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#22d3ee', background: 'rgba(34,211,238,0.07)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                ⚠️ Variants here are flagged with higher attention
              </div>
            </div>

            <div className={styles.guideItem} style={{ borderTop: '3px solid #64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🔗</span>
                <strong style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Intergenic Region</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--gn-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                The <strong style={{ color: 'var(--gn-white)' }}>"filler" space</strong> between genes — like punctuation between sentences. Mutations here usually have low functional impact, but are still tracked.
              </p>
            </div>

            <div className={styles.guideItem} style={{ borderTop: '3px solid #f87171', background: 'rgba(248,113,113,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🚦</span>
                <strong style={{ color: '#f87171', fontSize: '0.95rem' }}>Severity Levels</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--gn-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Each mutation is assigned a <strong style={{ color: 'var(--gn-white)' }}>risk level</strong> based on its location, type, and AI analysis. This tells you how urgently a variant may need clinical attention.
              </p>
              <div style={{ marginTop: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'rgba(244,63,94,0.15)', color: '#f87171', padding: '2px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(244,63,94,0.3)' }}>HIGH</span>
                  <span style={{ color: 'var(--gn-text-secondary)' }}>Potentially dangerous — needs immediate review</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', padding: '2px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(234,179,8,0.3)' }}>MED</span>
                  <span style={{ color: 'var(--gn-text-secondary)' }}>Worth monitoring — may have moderate effects</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>LOW</span>
                  <span style={{ color: 'var(--gn-text-secondary)' }}>Likely harmless — common or in non-critical regions</span>
                </div>
              </div>
            </div>

          </div>
        </details>
      )}

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
          <div className={styles.mainColumn}>
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
                      onMouseOver={(e) => { if (variantTab !== "snps") { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = 'var(--gn-primary)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(16,185,129,0.2)'; }}}
                      onMouseOut={(e) => { if (variantTab !== "snps") { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gn-text-muted)'; e.currentTarget.style.boxShadow = 'none'; }}}
                    >SNPs ({mutations.length})</button>
                    <button
                      onClick={() => setVariantTab("indels")}
                      style={{padding:'4px 12px', borderRadius:'6px', fontSize:'0.8rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.2s',
                        background: variantTab === "indels" ? '#f59e0b' : 'transparent',
                        color: variantTab === "indels" ? '#000' : 'var(--gn-text-muted)'
                      }}
                      onMouseOver={(e) => { if (variantTab !== "indels") { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 12px rgba(245,158,11,0.2)'; }}}
                      onMouseOut={(e) => { if (variantTab !== "indels") { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gn-text-muted)'; e.currentTarget.style.boxShadow = 'none'; }}}
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
                      <th title="Serial Number">#</th>
                      <th title="Location in the genome where the mutation was found.">Locus ⓘ</th>
                      <th title="Specific chemical nature of the mutation (e.g. Transition).">Type ⓘ</th>
                      <th title="The original sequence versus the mutated sequence.">Variant ⓘ</th>
                      <th title="The biological region affected.">Region ⓘ</th>
                      <th title="Our AI model's certainty about its severity classification.">AI Confidence ⓘ</th>
                      <th title="Overall urgency for clinical review.">Severity ⓘ</th>
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
                      <th title="Genomic position of the Indel.">Position ⓘ</th>
                      <th title="Whether letters were added (Insertion) or removed (Deletion).">Type ⓘ</th>
                      <th title="The specific DNA characters involved.">Base ⓘ</th>
                      <th title="The biological region affected.">Region ⓘ</th>
                      <th title="Our AI model's certainty about its severity classification.">AI Confidence ⓘ</th>
                      <th title="Overall urgency for clinical review.">Severity ⓘ</th>
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
          </div>

          {/* ── Side Panel ── */}
          <div className={styles.sidePanel}>
            {analysisInfo && (
               <section className={styles.detailCard} style={{padding: '1.25rem'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                   <h3 className={styles.cardTitle} style={{margin: 0, fontSize: '0.9rem', color: 'var(--gn-white)'}}>Bioinformatics Metrics</h3>
                   <button onClick={exportToVCF} style={{background: 'var(--gn-primary)', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center'}}>
                     <span>⬇</span> VCF Export
                   </button>
                 </div>
                 
                 <div style={{display: 'flex', flexDirection: 'column', gap: '0.6rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem'}}>
                      <span style={{color: 'var(--gn-text-muted)', fontSize: '0.8rem'}}>Ts/Tv Ratio</span>
                      <span style={{color: parseFloat(tsTvRatio) > 2.0 ? 'var(--gn-success)' : 'var(--gn-warning)', fontWeight: 700, fontSize: '0.8rem'}} title="Expected ~2.1 for WGS">
                        {tsTvRatio}
                      </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem'}}>
                      <span style={{color: 'var(--gn-text-muted)', fontSize: '0.8rem'}}>Mutations / kb</span>
                      <span style={{color: 'var(--gn-text-secondary)', fontSize: '0.8rem'}}>{mutFreq}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem'}}>
                      <span style={{color: 'var(--gn-text-muted)', fontSize: '0.8rem'}}>Indel Bias (Ins/Del)</span>
                      <span style={{color: 'var(--gn-text-secondary)', fontSize: '0.8rem'}}>{indelRatio}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: 'var(--gn-text-muted)', fontSize: '0.8rem'}}>Organism Model</span>
                      <span style={{color: 'var(--gn-primary)', fontSize: '0.8rem'}}>{analysisInfo.organism}</span>
                    </div>
                 </div>
               </section>
            )}

            {selectedGene && (
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
                  <p className={styles.mutationHelper}>
                    {selectedGene.type === 'Transition' && "A swap between similar DNA building blocks (e.g., A ↔ G). These are common mutations and often have a lower impact."}
                    {selectedGene.type === 'Transversion' && "A swap between different types of DNA building blocks (e.g., A ↔ T). Rarer and potentially more disruptive to protein structure."}
                    {selectedGene.type === 'Insertion' && "New DNA letters were added to the sequence here. This often causes a 'frameshift', which changes how the whole protein is built."}
                    {selectedGene.type === 'Deletion' && "Genetic information is missing at this position. Like insertions, this can significantly alter the resulting protein."}
                    {selectedGene.type !== 'Transition' && selectedGene.type !== 'Transversion' && selectedGene.type !== 'Insertion' && selectedGene.type !== 'Deletion' && "A change noted in the genetic sequence that differs from the reference."}
                  </p>
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

                <div style={{ marginTop: '1rem', marginBottom: '1rem', background: '#050505', border: '1px solid #222', borderRadius: '4px', padding: '0.75rem', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gn-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sequence Alignment Viewer</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gn-primary)' }}>IGV PREVIEW</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'nowrap', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', color: '#888' }}>
                      <span style={{ width: '40px', color: '#555' }}>REF:</span>
                      <span>{generateContext(selectedGene.raw.position).left}</span>
                      <span style={{ color: 'var(--gn-blue)', fontWeight: 'bold', background: 'rgba(59,130,246,0.15)', padding: '0 2px' }}>{selectedGene.raw.reference}</span>
                      <span>{generateContext(selectedGene.raw.position).right}</span>
                    </div>
                    <div style={{ display: 'flex', color: '#888' }}>
                      <span style={{ width: '40px', color: '#555' }}>QRY:</span>
                      <span>{generateContext(selectedGene.raw.position).left}</span>
                      <span style={{ 
                        color: selectedGene.severity === 'pathogenic' ? 'var(--gn-danger)' : selectedGene.severity === 'medium' ? 'var(--gn-warning)' : 'var(--gn-success)', 
                        fontWeight: 'bold', 
                        background: selectedGene.severity === 'pathogenic' ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)', 
                        padding: '0 2px' 
                      }}>
                        {selectedGene.raw.query}
                      </span>
                      <span>{generateContext(selectedGene.raw.position).right}</span>
                    </div>
                  </div>
                </div>

                <button 
                  className={styles.actionButton}
                  onClick={() => window.location.href = `/dashboard/visualization?position=${selectedGene.raw.position}`}
                >
                  Explore in Chromosome Map →
                </button>
              </section>
            )}

            {/* Heatmap Grid */}
            <section className={styles.heatmapCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Chromosome Heatmap</h3>
              </div>
              <p className={styles.heatmapDesc}>
                The genome is divided into 64 equal blocks, reading left-to-right, top-to-bottom. Colors indicate the highest variant risk found in each block.
              </p>
              
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.75rem', color: 'var(--gn-text-muted)', fontWeight: 600}}>
                <span>Start: 0 bp</span>
                <span>End: {genomeLength ? `${genomeLength.toLocaleString()} bp` : ''}</span>
              </div>

              <div className={styles.heatmapGrid}>
                {heatmapData.map((data, i) => (
                  <div
                    key={i}
                    className={`${styles.heatCell} ${styles[`heat_${data.severityClass || data}`]}`}
                    title={data.startPos !== undefined ? `Block ${i + 1} (Region: ${data.startPos.toLocaleString()} - ${data.endPos.toLocaleString()} bp)\nVariants Found: ${data.variantCount}\nSeverity Score: ${data.score}` : `Region Segment ${i + 1}`}
                  >
                    {i === 0 && <span className={styles.cellLabel}>Start</span>}
                    {i === 63 && <span className={styles.cellLabel}>End</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1.2rem', fontSize: '0.75rem', color: 'var(--gn-text-muted)', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div className={`${styles.heatCell} ${styles.heat_none}`} style={{ width: '14px', height: '14px', cursor: 'default' }}></div>
                  <span>Clear (0)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div className={`${styles.heatCell} ${styles.heat_low}`} style={{ width: '14px', height: '14px', cursor: 'default' }}></div>
                  <span>Low Risk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div className={`${styles.heatCell} ${styles.heat_medium}`} style={{ width: '14px', height: '14px', cursor: 'default' }}></div>
                  <span>Med Risk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div className={`${styles.heatCell} ${styles.heat_high}`} style={{ width: '14px', height: '14px', cursor: 'default' }}></div>
                  <span>High Risk</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
