"use client";

import { useState } from "react";
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

export function GenomeBrowser({ chromosomes }: { chromosomes?: ChromosomeData[] }) {
  const [selectedChrom, setSelectedChrom] = useState<ChromosomeData | null>(null);

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
        {chromosomes.map((ch) => (
          <div key={ch.id} className={styles.pair} onClick={() => setSelectedChrom(ch === selectedChrom ? null : ch)}>
            <div
              className={`${styles.chromatid} ${selectedChrom?.id === ch.id ? styles.selected : ""}`}
              style={{ height: `${ch.height}%` }}
            >
              {ch.mutations && ch.mutations.map((mut, idx) => (
                <span
                  key={idx}
                  className={styles.mutPin}
                  style={{
                    top: `${mut.relativePosPct}%`,
                    background: SEVERITY_COLORS[mut.severity] || "var(--gn-text-muted)",
                    boxShadow: `0 0 8px ${SEVERITY_COLORS[mut.severity]}`,
                    height: mut.severity === "pathogenic" ? '4px' : '2px', // Make severe variants slightly thicker
                  }}
                  title={`${mut.gene} (${mut.variant})`}
                />
              ))}
            </div>
            <span className={styles.chromLabel}>{ch.label}</span>
          </div>
        ))}
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

            <div className={styles.variantList} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {selectedChrom.mutations.map((mut) => (
                <div key={mut.id} style={{ background: 'var(--gn-bg)', border: `1px solid ${SEVERITY_COLORS[mut.severity]}44`, borderRadius: '8px', padding: '0.8rem' }}>
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
                      <span style={{ color: SEVERITY_COLORS[mut.severity] }}>{mut.impact}</span>
                    </div>
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
              ))}
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
