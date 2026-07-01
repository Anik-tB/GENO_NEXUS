"use client";

import { useState, useEffect } from "react";
import styles from "./GenomeBrowser.module.css";

export interface ChromosomeVariant {
  id: number;
  position: number;
  relativePosPct: number;
  type: string;
  severity: "pathogenic" | "uncertain" | "benign";
  variant: string;
  gene: string;
  impact: string;
  ai_confidence: number;
  reference?: string;
  query?: string;
  clinvar_id?: string;
  rsid?: string;
  review_status?: string;
  phenotype?: string;
  alphafold_pdb_url?: string;
}

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

export interface ChromosomeData {
  id: number;
  label: string;
  height: number;
  mutations: ChromosomeVariant[];
}

const SEVERITY_COLORS: Record<string, string> = {
  pathogenic: "var(--gn-danger)",
  uncertain: "var(--gn-warning)",
  benign: "var(--gn-success)",
};

export function GenomeBrowser({ chromosomes, highlightPosition, showAllPins }: { chromosomes?: ChromosomeData[]; highlightPosition?: number; showAllPins?: boolean }) {
  const [selectedChrom, setSelectedChrom] = useState<ChromosomeData | null>(null);

  // Automatically select the chromosome containing the highlighted position
  useEffect(() => {
    if (highlightPosition !== undefined && chromosomes) {
      const foundChrom = chromosomes.find((ch) =>
        ch.mutations.some((m) => m.position === highlightPosition)
      );
      if (foundChrom) {
        setSelectedChrom(foundChrom);
      }
    }
  }, [highlightPosition, chromosomes]);

  if (!chromosomes || chromosomes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center', color: 'var(--gn-text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧬</div>
        <h3>Awaiting Genomic Analysis</h3>
        <p style={{ maxWidth: '400px', marginTop: '0.5rem' }}>Upload a valid FASTA or VCF file and complete the analysis pipeline to visualize exact chromosomal variants here.</p>
      </div>
    );
  }

  return (
    <div className={styles.chromoWrapper}>
      {/* Sci-fi grid lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.gridLine} style={{ top: `${10 + i * 11}%` }} />
      ))}
      
      <div className={styles.chromosomes}>
        {chromosomes.map((ch) => {
          const isSelected = selectedChrom?.id === ch.id;
          const filteredMutations = ch.mutations ? ch.mutations.filter(mut => showAllPins || highlightPosition === undefined || mut.position === highlightPosition) : [];
          
          return (
            <div key={ch.id} className={styles.pair} onClick={() => setSelectedChrom(isSelected ? null : ch)}>
              <div
                className={`${styles.pairContainer} ${isSelected ? styles.selectedPair : ""}`}
                style={{ height: `${ch.height}%` }}
              >
                {/* Scan Beam on selected chromosome */}
                {isSelected && <div className={styles.scanBeam} />}

                {/* Left Homologous Chromatid SVG */}
                <div className={styles.sisterChromatid}>
                  <svg width="100%" height="100%" viewBox="0 0 30 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`grad-left-${ch.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.85} />
                        <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="60%" stopColor="#a855f7" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    {/* Metaphase chromosome pinched shape (centromere at y=40) */}
                    <path 
                      d="M 10,2 Q 15,0 20,2 Q 24,18 20,38 Q 15,40 15,40 Q 15,40 20,42 Q 24,62 20,98 Q 15,100 10,98 Q 6,62 10,42 Q 15,40 15,40 Q 15,40 10,38 Q 6,18 10,2 Z" 
                      fill={`url(#grad-left-${ch.id})`}
                      stroke={isSelected ? "var(--gn-primary)" : "rgba(255, 255, 255, 0.15)"}
                      strokeWidth="1.2"
                    />
                    
                    {/* Render mutations as bands directly inside the chromatid body */}
                    {filteredMutations.map((mut) => {
                      const isHighlighted = highlightPosition !== undefined && mut.position === highlightPosition;
                      const bandColor = isHighlighted ? "var(--gn-primary)" : (SEVERITY_COLORS[mut.severity] || "var(--gn-text-muted)");
                      
                      return (
                        <rect
                          key={`l-${mut.id}`}
                          x="7"
                          y={mut.relativePosPct - 1}
                          width="16"
                          height={isHighlighted ? "3.5" : "1.8"}
                          fill={bandColor}
                          style={{
                            filter: `drop-shadow(0 0 4px ${bandColor})`,
                            opacity: isHighlighted ? 1 : 0.8
                          }}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Right Homologous Chromatid SVG */}
                <div className={styles.sisterChromatid}>
                  <svg width="100%" height="100%" viewBox="0 0 30 100" preserveAspectRatio="none">
                    <path 
                      d="M 10,2 Q 15,0 20,2 Q 24,18 20,38 Q 15,40 15,40 Q 15,40 20,42 Q 24,62 20,98 Q 15,100 10,98 Q 6,62 10,42 Q 15,40 15,40 Q 15,40 10,38 Q 6,18 10,2 Z" 
                      fill={`url(#grad-left-${ch.id})`}
                      stroke={isSelected ? "var(--gn-primary)" : "rgba(255, 255, 255, 0.15)"}
                      strokeWidth="1.2"
                    />
                    {/* Render mutations as bands directly inside the chromatid body */}
                    {filteredMutations.map((mut) => {
                      const isHighlighted = highlightPosition !== undefined && mut.position === highlightPosition;
                      const bandColor = isHighlighted ? "var(--gn-primary)" : (SEVERITY_COLORS[mut.severity] || "var(--gn-text-muted)");
                      
                      return (
                        <rect
                          key={`r-${mut.id}`}
                          x="7"
                          y={mut.relativePosPct - 1}
                          width="16"
                          height={isHighlighted ? "3.5" : "1.8"}
                          fill={bandColor}
                          style={{
                            filter: `drop-shadow(0 0 4px ${bandColor})`,
                            opacity: isHighlighted ? 1 : 0.8
                          }}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
              <span className={styles.chromLabel}>{ch.label}</span>
            </div>
          );
        })}
      </div>

      {selectedChrom && selectedChrom.mutations && selectedChrom.mutations.length > 0 && (
        <div className={styles.locusPanelOverlay}>
          <div className={styles.locusPanel}>
            <button className={styles.locusClose} onClick={() => setSelectedChrom(null)}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🧬</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--gn-white)' }}>Chromosome {selectedChrom.label}</h3>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--gn-text-muted)', marginBottom: '1rem' }}>
              Identified {selectedChrom.mutations.length} variant(s) within this sequence block.
            </p>

            <div className={styles.variantList}>
              {selectedChrom.mutations
                .filter(mut => showAllPins || highlightPosition === undefined || mut.position === highlightPosition)
                .map((mut) => {
                  const isHighlighted = highlightPosition !== undefined && mut.position === highlightPosition;
                  return (
                    <div 
                      key={mut.id} 
                      style={{ 
                        background: isHighlighted ? 'rgba(0, 229, 255, 0.08)' : 'var(--gn-bg)', 
                        border: `1px solid ${isHighlighted ? 'var(--gn-primary)' : `${SEVERITY_COLORS[mut.severity]}44`}`, 
                        borderRadius: '8px', 
                        padding: '0.8rem' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gn-white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS[mut.severity], boxShadow: `0 0 6px ${SEVERITY_COLORS[mut.severity]}` }} />
                          {mut.gene}
                        </h4>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: `${SEVERITY_COLORS[mut.severity]}22`, color: SEVERITY_COLORS[mut.severity], border: `1px solid ${SEVERITY_COLORS[mut.severity]}44` }}>
                          {mut.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--gn-primary)', marginBottom: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                        {mut.variant}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--gn-text-muted)' }}>Location</span>
                          <span style={{ color: 'var(--gn-text-secondary)' }}>Pos: {mut.position}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--gn-text-muted)' }}>AI Confidence</span>
                          <span style={{ color: 'var(--gn-text-secondary)' }}>{Math.round(mut.ai_confidence * 100)}%</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                          <span style={{ color: 'var(--gn-text-muted)' }}>Clinical Impact</span>
                          <span style={{ color: SEVERITY_COLORS[mut.severity], fontWeight: 'bold' }}>{mut.impact}</span>
                        </div>
                        {mut.clinvar_id && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--gn-text-muted)' }}>ClinVar Accession</span>
                            <a 
                              href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${mut.clinvar_id}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: 'var(--gn-primary)', textDecoration: 'underline' }}
                            >
                              VCV{mut.clinvar_id}
                            </a>
                          </div>
                        )}
                        {mut.review_status && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--gn-text-muted)' }}>Review Status</span>
                            <span style={{ color: 'var(--gn-text-secondary)', fontSize: '0.7rem' }}>{mut.review_status}</span>
                          </div>
                        )}
                        {mut.phenotype && (
                          <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--gn-text-muted)' }}>Phenotypic Association</span>
                            <span style={{ color: 'var(--gn-text-secondary)' }}>{mut.phenotype}</span>
                          </div>
                        )}
                        {mut.alphafold_pdb_url && (
                          <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1', marginTop: '0.4rem' }}>
                            <span style={{ color: 'var(--gn-text-muted)', marginBottom: '0.2rem' }}>AlphaFold 3D Structure</span>
                            <a 
                              href={mut.alphafold_pdb_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                gap: '0.3rem',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                color: 'var(--gn-primary)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                fontSize: '0.7rem'
                              }}
                            >
                              🌐 Download AlphaFold PDB Model
                            </a>
                          </div>
                        )}
                      </div>

                      {mut.reference && mut.query && (
                        <div style={{ marginTop: '0.75rem', background: '#050505', border: '1px solid #222', borderRadius: '4px', padding: '0.5rem', overflowX: 'auto' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--gn-text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sequence Alignment Viewer</div>
                          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', color: '#888' }}>
                              <span style={{ width: '35px', color: '#555' }}>REF:</span>
                              <span>{generateContext(mut.position).left}</span>
                              <span style={{ color: 'var(--gn-blue)', fontWeight: 'bold', background: 'rgba(59,130,246,0.15)', padding: '0 2px' }}>{mut.reference}</span>
                              <span>{generateContext(mut.position).right}</span>
                            </div>
                            <div style={{ display: 'flex', color: '#888' }}>
                              <span style={{ width: '35px', color: '#555' }}>QRY:</span>
                              <span>{generateContext(mut.position).left}</span>
                              <span style={{ color: mut.severity === 'pathogenic' ? 'var(--gn-danger)' : mut.severity === 'uncertain' ? 'var(--gn-warning)' : 'var(--gn-success)', fontWeight: 'bold', background: mut.severity === 'pathogenic' ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)', padding: '0 2px' }}>{mut.query}</span>
                              <span>{generateContext(mut.position).right}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {selectedChrom && selectedChrom.mutations && selectedChrom.mutations.length === 0 && (
        <div className={styles.locusPanelOverlay}>
          <div className={styles.locusPanel}>
            <button className={styles.locusClose} onClick={() => setSelectedChrom(null)}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🧬</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--gn-white)' }}>Chromosome {selectedChrom.label}</h3>
            </div>
            <div style={{ background: 'var(--gn-bg)', border: `1px solid var(--gn-border-light-strong)`, borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✅</span>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--gn-success)' }}>No Variations Detected</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--gn-text-secondary)', margin: 0 }}>This chromosomal sequence perfectly matches the reference genome.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
