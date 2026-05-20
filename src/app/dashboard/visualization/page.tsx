"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { GenomeBrowser } from "@/components/visualization/GenomeBrowser";

const TABS = [
  {
    id: "chromosome",
    label: "Chromosome Map Viewer",
    icon: "🧬",
    sub: "Explore chromosome mutations & risk loci",
  }
];

function VisualizationContent() {
  const [activeTab, setActiveTab] = useState("chromosome");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showAllPins, setShowAllPins] = useState(false);
  
  const searchParams = useSearchParams();
  const searchPosition = searchParams.get("position");
  const highlightPosition = searchPosition ? parseInt(searchPosition, 10) : undefined;

  useEffect(() => {
    fetch("/api/visualization/analysis-data")
      .then((r) => r.json())
      .then((d) => setAnalysisData(d))
      .catch(() => {});
  }, []);

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>🧬 Molecular Visualization Engine</div>
          <h1 className={styles.title}>{activeTabData.icon} {activeTabData.label}</h1>
          <p className={styles.subtitle}>{activeTabData.sub}</p>
        </div>
      </header>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {activeTab === "chromosome" && (
          <div className={styles.viewerWrapper}>
            {/* Sidebar */}
            <aside className={styles.toolbox}>
              <p className={styles.toolboxLabel}>Sequence Info</p>
              <div className={styles.stats}>
                {[
                  { label: "File",         value: analysisData?.hasData ? analysisData.fileName : "No analysis yet" },
                  { label: "Organism",     value: analysisData?.hasData ? analysisData.organism : "—" },
                  { label: "Seq Match",    value: analysisData?.hasData ? `${analysisData.matchPct}%` : "—" },
                  { label: "Total Variants", value: analysisData?.hasData ? String(analysisData.totalMutations) : "—" },
                  { label: "Ts/Tv Ratio",  value: analysisData?.hasData ? analysisData.tsTvRatio : "—" },
                  { label: "Mutations/kb", value: analysisData?.hasData ? analysisData.mutFreq : "—" },
                  { label: "Indel Bias",   value: analysisData?.hasData ? analysisData.indelRatio : "—" },
                ].map((s, i) => (
                  <div key={i} className={styles.statItem}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <strong className={styles.statValue} style={
                      s.label === "Ts/Tv Ratio" && analysisData?.hasData && parseFloat(analysisData.tsTvRatio) > 2.0 ? { color: 'var(--gn-success)' } : 
                      s.label === "Ts/Tv Ratio" && analysisData?.hasData ? { color: 'var(--gn-warning)' } : {}
                    }>{s.value}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.mutationLegend}>
                <p className={styles.toolboxLabel}>Mutation Legend</p>
                {[
                  { color: "var(--gn-danger)", label: "Pathogenic" },
                  { color: "var(--gn-warning)", label: "Uncertain Significance" },
                  { color: "var(--gn-success)", label: "Benign / Low Risk" },
                ].map((l) => (
                  <div key={l.label} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: l.color }} />
                    <span className={styles.legendLabel}>{l.label}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Render Area */}
            {/* Render Area */}
            <div className={styles.renderArea} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'stretch' }}>
              
              {/* Sci-Fi Top Toolbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(5, 10, 20, 0.65)',
                borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
                padding: '0.75rem 1.25rem',
                zIndex: 20,
                backdropFilter: 'blur(8px)',
                flexWrap: 'wrap',
                gap: '0.75rem',
                width: '100%'
              }}>
                {/* Left Side: Status / System Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className={styles.blinkDot} style={{ color: 'var(--gn-success)', textShadow: '0 0 8px var(--gn-success)' }}>●</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gn-text-secondary)', letterSpacing: '0.05em' }}>SYSTEM ACTIVE</span>
                  </span>
                  <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--gn-text-muted)', fontWeight: 500 }}>
                    💡 Click on any chromosome strand to view alignments
                  </span>
                </div>

                {/* Right Side: Dynamic Filter Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {highlightPosition !== undefined ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '0.35rem 0.75rem', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gn-success)', letterSpacing: '0.05em' }}>
                          FOCUS: POS {highlightPosition}
                        </span>
                        <button 
                          onClick={() => {
                            window.history.replaceState(null, "", "/dashboard/visualization");
                            window.location.reload();
                          }} 
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--gn-danger)', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            padding: '0 2px', 
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Reset Focus Filter"
                        >
                          ✕
                        </button>
                      </div>

                      <button 
                        onClick={() => setShowAllPins(!showAllPins)}
                        style={{ 
                          background: showAllPins ? 'var(--gn-primary)' : 'rgba(0, 229, 255, 0.05)', 
                          border: '1px solid var(--gn-primary)', 
                          color: showAllPins ? '#000000' : 'var(--gn-primary)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '0.35rem 0.85rem',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {showAllPins ? "🌐 Hide Overall Map" : "🔍 Show Overall Map"}
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--gn-primary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      🌐 Overall Genome View
                    </span>
                  )}
                </div>
              </div>

              {/* Chromatid Canvas */}
              <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
                <GenomeBrowser chromosomes={analysisData?.chromosomes} highlightPosition={highlightPosition} showAllPins={showAllPins} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisualizationPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ width: 60, height: 60, border: '4px solid rgba(16, 185, 129, 0.1)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ marginTop: '2rem', color: '#10b981', letterSpacing: '0.1em' }}>LOADING VISUALIZATION...</h2>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <VisualizationContent />
    </Suspense>
  );
}
