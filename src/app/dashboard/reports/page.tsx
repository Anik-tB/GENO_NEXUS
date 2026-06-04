"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoadingList(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
        if (data.reports.length > 0) {
          fetchReportDetails(data.reports[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }

  async function fetchReportDetails(id: string) {
    setSelectedReportId(id);
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReport(false);
    }
  }

  async function generateReport() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/reports", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => [data.report, ...prev]);
        fetchReportDetails(data.report.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  }

  function formatBytes(bytes: number) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(isoString: string) {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
  }

  return (
    <div className={styles.container}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .gn-print-target, .gn-print-target * { visibility: visible; }
          .gn-print-target { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; color: black; }
          main, div { overflow: visible !important; max-height: none !important; }
        }
      `}</style>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>📄 Clinical Reporting Suite</div>
          <h1 className={styles.title}>Clinical Reports</h1>
          <p className={styles.subtitle}>Generate, review, and export AI-synthesized patient genomic dossiers with a single click.</p>
        </div>
        <button 
          className={styles.generateBtn} 
          onClick={generateReport}
          disabled={isGenerating}
          style={{ opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          {isGenerating ? (
            <div style={{width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderLeftColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
          {isGenerating ? "Generating..." : "Generate New Report"}
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </button>
      </header>

      <div className={styles.contentGrid}>
        {/* ── Document Preview ── */}
        <div className={styles.previewPanel}>
          <div className={styles.previewToolbar}>
            <div className={styles.previewTabs}>
              <button className={styles.tab} onClick={() => scrollToSection('sec-executive')}>Executive Summary</button>
              <button className={styles.tab} onClick={() => scrollToSection('sec-findings')}>Variant Pathologies</button>
              <button className={styles.tab} onClick={() => scrollToSection('sec-recommendations')}>Therapy Guidance</button>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.iconBtn} title="Print" disabled={!reportData} onClick={handlePrint}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
              <button className={styles.iconBtn} title="Share" disabled={!reportData} onClick={handlePrint}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
              <button className={styles.downloadBtn} disabled={!reportData} onClick={handlePrint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </button>
            </div>
          </div>

          <div className={styles.documentPreview}>
            {loadingReport ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gn-text-muted)' }}>
                <div style={{width: 40, height: 40, border: '3px solid rgba(16, 185, 129, 0.1)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem'}} />
                Loading report data...
              </div>
            ) : !reportData ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gn-text-muted)' }}>
                Select a report from the archive to view details.
              </div>
            ) : (
              <div className={`${styles.documentPage} gn-print-target`}>
                <div className={styles.docHeader}>
                  <div className={styles.docBrand}>
                    <span className={styles.docBrandIcon}>🧬</span> GenoNexus Clinical
                  </div>
                  <div className={styles.docMeta}>
                    <span><strong>Report Date:</strong> {formatDate(reportData.created_at)}</span>
                    <span className={styles.metaDivider}>·</span>
                    <span className={styles.signedBadge}>✓ Electronically {reportData.status}</span>
                  </div>
                </div>

                {reportData.content?.demographics && (
                  <div className={styles.demographicsBox}>
                    <div className={styles.demoItem}><span>Patient MRN:</span> <strong>{reportData.content.demographics.mrn}</strong></div>
                    <div className={styles.demoItem}><span>DOB:</span> <strong>{reportData.content.demographics.dob}</strong></div>
                    <div className={styles.demoItem}><span>Specimen:</span> <strong>{reportData.content.demographics.specimen}</strong></div>
                    <div className={styles.demoItem}><span>Physician:</span> <strong>{reportData.content.demographics.physician}</strong></div>
                    <div className={styles.demoItem}><span>Indication:</span> <strong>{reportData.content.demographics.disease}</strong></div>
                  </div>
                )}

                <h1 className={styles.docTitle}>{reportData.name}</h1>

                <div id="sec-executive" className={styles.docSection}>
                  <h2>1. AI Executive Synopsis</h2>
                  <p>{reportData.content?.synopsis || "No synopsis available."}</p>
                </div>

                {reportData.content?.qc && (
                  <div className={styles.docSection}>
                    <h2>2. Quality Control Metrics</h2>
                    <div className={styles.qcGrid}>
                      <div className={styles.qcItem}>
                        <span className={styles.qcLabel}>Total Variants</span>
                        <span className={styles.qcValue}>{reportData.content.qc.totalVariants}</span>
                      </div>
                      <div className={styles.qcItem}>
                        <span className={styles.qcLabel}>Alignment Match</span>
                        <span className={styles.qcValue}>{reportData.content.qc.matchPercentage}%</span>
                      </div>
                      <div className={styles.qcItem}>
                        <span className={styles.qcLabel}>Ts/Tv Ratio</span>
                        <span className={styles.qcValue}>{reportData.content.qc.tsTvRatio}</span>
                      </div>
                      <div className={styles.qcItem}>
                        <span className={styles.qcLabel}>SNPs / Indels</span>
                        <span className={styles.qcValue}>{reportData.content.qc.snps} / {reportData.content.qc.indels}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div id="sec-findings" className={styles.docSection}>
                  <h2>{reportData.content?.qc ? "3" : "2"}. Genomic Alterations & Biomarkers</h2>
                  {reportData.content?.findings && reportData.content.findings.length > 0 ? (
                    <table className={styles.docTable}>
                      <thead><tr><th>Gene</th><th>Variant (HGVS)</th><th>AMP/ASCO/CAP Tier</th><th>Clinical Implication</th></tr></thead>
                      <tbody>
                        {reportData.content.findings.map((f: any, idx: number) => (
                          <tr key={idx}>
                            <td><strong>{f.gene}</strong></td>
                            <td><code>{f.hgvs || f.variant}</code></td>
                            <td>
                              <span className={`${styles.tierBadge} ${f.tierClass ? styles[f.tierClass] : (f.risk === 'High' ? styles.tier1 : f.risk === 'Medium' ? styles.tier2 : styles.tier3)}`}>
                                {f.tier || f.risk}
                              </span>
                            </td>
                            <td>{f.implication}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{color: 'var(--gn-text-muted)', fontStyle: 'italic', fontSize: '0.9rem'}}>No reportable variants identified.</p>
                  )}
                </div>

                {reportData.content?.therapeutics && reportData.content.therapeutics.length > 0 ? (
                  <div id="sec-recommendations" className={styles.docSection}>
                    <h2>{reportData.content?.qc ? "4" : "3"}. Actionable Therapeutics (PGx)</h2>
                    <table className={styles.docTable}>
                      <thead><tr><th>Therapy / Drug</th><th>Status</th><th>Rationale</th></tr></thead>
                      <tbody>
                        {reportData.content.therapeutics.map((t: any, idx: number) => (
                          <tr key={idx}>
                            <td><strong>{t.drug}</strong></td>
                            <td>
                              <span className={t.status === 'Indicated' ? styles.statusIndicated : styles.statusContra}>
                                {t.status}
                              </span>
                            </td>
                            <td>{t.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : reportData.content?.recommendations && reportData.content.recommendations.length > 0 ? (
                  <div id="sec-recommendations" className={styles.docSection}>
                    <h2>{reportData.content?.qc ? "4" : "3"}. Therapy Guidance & Recommendations</h2>
                    <ul style={{ paddingLeft: '1.5rem', color: 'var(--gn-text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                      {reportData.content.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {reportData.content?.trials && reportData.content.trials.length > 0 && (
                  <div className={styles.docSection}>
                    <h2>{reportData.content?.qc ? "5" : "4"}. Clinical Trials Matching</h2>
                    <div className={styles.trialsList}>
                      {reportData.content.trials.map((trial: any, idx: number) => (
                        <div key={idx} className={styles.trialItem}>
                          <div className={styles.trialHeader}>
                            <strong>{trial.id}</strong> <span className={styles.trialPhase}>{trial.phase}</span>
                          </div>
                          <div className={styles.trialTitle}>{trial.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportData.content?.methodology && (
                  <div className={styles.methodology}>
                    <strong>Methodology & Limitations:</strong> {reportData.content.methodology}
                  </div>
                )}

                <div className={styles.docFooter}>
                  Electronically {reportData.status.toLowerCase()} by GenoNexus AI Copilot · Validation Hash: {reportData.id.split('-')[0].toUpperCase()} · Confidential
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── History Panel ── */}
        <div className={styles.historyPanel}>
          <h3 className={styles.panelTitle}>Report Archive</h3>
          <div className={styles.archiveList}>
            {loadingList ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gn-text-muted)' }}>Loading...</div>
            ) : reports.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gn-text-muted)' }}>No reports found. Generate one above.</div>
            ) : (
              reports.map((rep) => (
                <div 
                  key={rep.id} 
                  className={styles.archiveCard}
                  onClick={() => fetchReportDetails(rep.id)}
                  style={{ 
                    cursor: 'pointer', 
                    borderColor: selectedReportId === rep.id ? 'var(--gn-primary)' : 'var(--gn-border-light-strong)',
                    background: selectedReportId === rep.id ? 'rgba(16, 185, 129, 0.05)' : 'var(--gn-bg-glass)'
                  }}
                >
                  <div className={styles.archiveIconBox}>📄</div>
                  <div className={styles.archiveInfo}>
                    <strong className={styles.archiveName}>{rep.name}</strong>
                    <span className={styles.archiveMeta}>{rep.patient_id} · {formatDate(rep.created_at)}</span>
                    <div className={styles.archiveFooter}>
                      <span className={styles.archiveSize}>{formatBytes(rep.size_bytes)}</span>
                      <span className={`${styles.archiveStatus} ${rep.status === "Signed" ? styles.statusSigned : styles.statusDraft}`}>
                        {rep.status === "Signed" ? "✓ " : "✎ "}{rep.status}
                      </span>
                    </div>
                  </div>
                  <button 
                    className={styles.dlBtn} 
                    title="Download" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (selectedReportId !== rep.id) {
                        fetchReportDetails(rep.id).then(() => setTimeout(handlePrint, 300));
                      } else {
                        handlePrint();
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.exportOptions}>
            <p className={styles.exportTitle}>Export Format</p>
            <div className={styles.exportBtns}>
              <button className={styles.exportBtn}>PDF</button>
              <button className={styles.exportBtn}>DOCX</button>
              <button className={styles.exportBtn}>HL7 FHIR</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
