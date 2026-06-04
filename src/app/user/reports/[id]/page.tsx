"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import styles from "./report.module.css";
import Image from "next/image";

interface ReportContent {
  demographics?: {
    mrn: string;
    dob: string;
    specimen: string;
    physician: string;
    disease: string;
  };
  synopsis?: string;
  qc?: {
    totalVariants: number;
    snps: number;
    indels: number;
    tsTvRatio: string;
    matchPercentage: number;
  };
  findings?: Array<{
    gene: string;
    hgvs: string;
    tier: string;
    tierClass: string;
    implication: string;
  }>;
  therapeutics?: Array<{
    drug: string;
    status: string;
    reason: string;
  }>;
  trials?: Array<{
    id: string;
    phase: string;
    title: string;
  }>;
  methodology?: string;
}

interface ReportData {
  id: string;
  name: string;
  patient_id: string;
  size_bytes: number;
  status: string;
  created_at: string;
  content: ReportContent;
}

const EN = {
  back: "← Back to Reports",
  download: "📄 Download PDF",
  title: "GenoNexus Clinical",
  date: "Report Date",
  id: "Report ID",
  status: "Status",
  patientInfo: "Patient & Specimen Information",
  patientId: "Patient ID / MRN",
  dob: "Date of Birth",
  indication: "Primary Indication",
  specimen: "Specimen Type",
  synopsis: "Clinical Synopsis",
  genomicFindings: "Clinically Significant Genomic Findings",
  geneRegion: "Gene / Region",
  variant: "Variant (HGVS)",
  tier: "Tier (AMP/ASCO/CAP)",
  implication: "Clinical Implication",
  pharmacogenomics: "Pharmacogenomics & Therapeutic Implications",
  agent: "Therapeutic Agent",
  rationale: "Rationale",
  trials: "Relevant Clinical Trials",
  trialId: "Trial ID",
  phase: "Phase",
  trialTitle: "Title",
  qc: "Quality Control Metrics",
  coverage: "Target Coverage / Match",
  totalVariants: "Total Variants",
  snpsIndels: "SNPs / Indels",
  tstv: "Ts/Tv Ratio",
  methodology: "Methodology",
  director: "Laboratory Director",
  signed: "Electronically Signed",
  errTitle: "Error Loading Report",
  errDesc: "Report not found",
  disclaimer: "This report is for research and investigational purposes only. Decisions on patient care and treatment must be based on the independent medical judgment of the treating physician. The test was developed and its performance characteristics determined by GenoNexus Clinical Laboratories.",
};

const BN = {
  back: "← রিপোর্টে ফিরে যান",
  download: "📄 পিডিএফ ডাউনলোড করুন",
  title: "জিনোনেক্সাস ক্লিনিক্যাল",
  date: "রিপোর্টের তারিখ",
  id: "রিপোর্ট আইডি",
  status: "অবস্থা",
  patientInfo: "রোগী ও নমুনা সংক্রান্ত তথ্য",
  patientId: "রোগীর আইডি / এমআরএন (MRN)",
  dob: "জন্ম তারিখ",
  indication: "প্রধান লক্ষণ / রোগ",
  specimen: "নমুনার ধরণ",
  synopsis: "ক্লিনিক্যাল সিনোপসিস (সংক্ষিপ্ত বিবরণ)",
  genomicFindings: "ক্লিনিক্যালি গুরুত্বপূর্ণ জিনোমিক ফলাফল",
  geneRegion: "জিন / অঞ্চল",
  variant: "ভ্যারিয়েন্ট (HGVS)",
  tier: "টিয়ার (AMP/ASCO/CAP)",
  implication: "ক্লিনিক্যাল প্রভাব",
  pharmacogenomics: "ফার্মাকোজেনোমিক্স এবং থেরাপিউটিক প্রভাব",
  agent: "থেরাপিউটিক এজেন্ট (ওষুধ)",
  rationale: "যৌক্তিকতা ও কারণ",
  trials: "প্রাসঙ্গিক ক্লিনিক্যাল ট্রায়ালসমূহ",
  trialId: "ট্রায়াল আইডি",
  phase: "ধাপ (Phase)",
  trialTitle: "ট্রায়ালের নাম",
  qc: "কোয়ালিটি কন্ট্রোল মেট্রিক্স",
  coverage: "টার্গেট কভারেজ / মিল",
  totalVariants: "মোট ভ্যারিয়েন্ট",
  snpsIndels: "SNPs / Indels",
  tstv: "Ts/Tv অনুপাত",
  methodology: "বিশ্লেষণ পদ্ধতি",
  director: "ল্যাবরেটরি পরিচালক",
  signed: "ইলেকট্রনিকভাবে স্বাক্ষরিত",
  errTitle: "রিপোর্ট লোড করতে সমস্যা",
  errDesc: "রিপোর্ট খুঁজে পাওয়া যায়নি",
  disclaimer: "এই প্রতিবেদনটি শুধুমাত্র গবেষণা এবং তদন্তের উদ্দেশ্যে তৈরি। রোগীর যত্ন ও চিকিৎসার সিদ্ধান্তগুলো অবশ্যই চিকিৎসকের স্বাধীন চিকিৎসা রায়ের উপর ভিত্তি করে নিতে হবে। টেস্টটি জিনোনেক্সাস ক্লিনিক্যাল ল্যাবরেটরিজ দ্বারা তৈরি এবং এর কার্যকারিতা যাচাই করা হয়েছে।",
};

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;

  const [lang, setLang] = useState("en");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    setLang(savedLang);

    const handleLangEvent = () => {
      const updated = localStorage.getItem("language") || "en";
      setLang(updated);
    };
    window.addEventListener("languageChange", handleLangEvent);
    return () => window.removeEventListener("languageChange", handleLangEvent);
  }, []);

  const d = lang === "bn" ? BN : EN;

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${reportId}`);
        const data = await res.json();

        if (res.ok && data.success) {
          // Parse content if it's a string
          let parsedContent = data.report.content;
          if (typeof parsedContent === 'string') {
            try {
              parsedContent = JSON.parse(parsedContent);
            } catch (e) {
              console.error("Failed to parse report content JSON", e);
            }
          }
          setReport({ ...data.report, content: parsedContent });
        } else {
          throw new Error(data.error || "Failed to load report");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred while loading the report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: "flex", justifyContent: "center", padding: "8rem" }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(16, 185, 129, 0.1)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.page}>
        <Link href="/user/reports" className={styles.back}>{d.back}</Link>
        <div style={{ padding: "2rem", color: "var(--gn-danger)", background: "rgba(244,63,94,0.1)", borderRadius: "8px" }}>
          <h2>{d.errTitle}</h2>
          <p>{error || d.errDesc}</p>
        </div>
      </div>
    );
  }

  const { demographics, synopsis, qc, findings, therapeutics, trials, methodology } = report.content;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  let reportName = report.name;
  if (lang === "bn" && reportName.includes("Clinical Genomic Report")) {
    reportName = reportName.replace("Clinical Genomic Report", "ক্লিনিক্যাল জিনোমিক রিপোর্ট");
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerTop}>
        <div className={styles.header}>
          <Link href="/user/reports" className={styles.back}>{d.back}</Link>
        </div>
        <button className={styles.btnDownload} onClick={() => window.print()}>
          {d.download}
        </button>
      </div>

      <div className={styles.document}>
        {/* ─── Header ────────────────────────────────────────────── */}
        <div className={styles.docHeader}>
          <div className={styles.docBrand}>
            <Image src="/dna-icon.svg" alt="GenoNexus Logo" width={40} height={40} className={styles.docLogo} />
            <h1 className={styles.docBrandName}>{d.title}</h1>
          </div>
          <div className={styles.docMeta}>
            <p><strong>{d.date}:</strong> {formatDate(report.created_at)}</p>
            <p><strong>{d.id}:</strong> {report.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>{d.status}:</strong> {report.status === "completed" && lang === "bn" ? "সম্পন্ন" : report.status}</p>
          </div>
        </div>

        {/* ─── Patient Demographics ──────────────────────────────── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{d.patientInfo}</h2>
          <div className={styles.grid}>
            <div className={styles.dataBox}>
              <p className={styles.dataLabel}>{d.patientId}</p>
              <p className={styles.dataValue}>{demographics?.mrn || report.patient_id}</p>
            </div>
            <div className={styles.dataBox}>
              <p className={styles.dataLabel}>{d.dob}</p>
              <p className={styles.dataValue}>{demographics?.dob || "N/A"}</p>
            </div>
            <div className={styles.dataBox}>
              <p className={styles.dataLabel}>{d.indication}</p>
              <p className={styles.dataValue}>
                {demographics?.disease === "COVID-19" && lang === "bn" ? "কোভিড-১৯" : demographics?.disease || "N/A"}
              </p>
            </div>
            <div className={styles.dataBox}>
              <p className={styles.dataLabel}>{d.specimen}</p>
              <p className={styles.dataValue}>
                {demographics?.specimen === "DNA Isolate" && lang === "bn" ? "ডিএনএ নমুনা" : demographics?.specimen || "DNA Isolate"}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Clinical Synopsis ─────────────────────────────────── */}
        {synopsis && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{d.synopsis}</h2>
            <p className={styles.synopsisText}>{synopsis}</p>
          </div>
        )}

        {/* ─── Genomic Findings ──────────────────────────────────── */}
        {findings && findings.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{d.genomicFindings}</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{d.geneRegion}</th>
                  <th>{d.variant}</th>
                  <th>{d.tier}</th>
                  <th>{d.implication}</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => (
                  <tr key={i}>
                    <td className={styles.geneName}>{f.gene}</td>
                    <td className={styles.hgvs}>{f.hgvs}</td>
                    <td>
                      <span className={`${styles.tierBadge} ${styles[f.tierClass]}`}>
                        {f.tier}
                      </span>
                    </td>
                    <td>{f.implication}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pharmacogenomics (Therapeutics) ───────────────────── */}
        {therapeutics && therapeutics.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{d.pharmacogenomics}</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{d.agent}</th>
                  <th>{d.status}</th>
                  <th>{d.rationale}</th>
                </tr>
              </thead>
              <tbody>
                {therapeutics.map((t, i) => {
                  let statusClass = styles.statusIndicated;
                  if (t.status.toLowerCase().includes("contra")) statusClass = styles.statusContraindicated;
                  if (t.status.toLowerCase().includes("resist")) statusClass = styles.statusResistance;

                  return (
                    <tr key={i}>
                      <td className={styles.geneName}>{t.drug}</td>
                      <td className={statusClass}>{t.status}</td>
                      <td>{t.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Clinical Trials ────────────────────────────────────── */}
        {trials && trials.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{d.trials}</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{d.trialId}</th>
                  <th>{d.phase}</th>
                  <th>{d.trialTitle}</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t, i) => (
                  <tr key={i}>
                    <td className={styles.hgvs}>{t.id}</td>
                    <td><span className={`${styles.tierBadge} ${styles.tier3}`}>{t.phase}</span></td>
                    <td>{t.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── QC Metrics ────────────────────────────────────────── */}
        {qc && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{d.qc}</h2>
            <div className={styles.grid}>
              <div className={styles.dataBox}>
                <p className={styles.dataLabel}>{d.coverage}</p>
                <p className={styles.dataValue}>{qc.matchPercentage}%</p>
              </div>
              <div className={styles.dataBox}>
                <p className={styles.dataLabel}>{d.totalVariants}</p>
                <p className={styles.dataValue}>{qc.totalVariants}</p>
              </div>
              <div className={styles.dataBox}>
                <p className={styles.dataLabel}>{d.snpsIndels}</p>
                <p className={styles.dataValue}>{qc.snps} / {qc.indels}</p>
              </div>
              <div className={styles.dataBox}>
                <p className={styles.dataLabel}>{d.tstv}</p>
                <p className={styles.dataValue}>{qc.tsTvRatio}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Methodology & Footer ──────────────────────────────── */}
        <div className={styles.docFooter}>
          <div className={styles.section}>
            <h3 style={{ fontSize: "0.85rem", margin: "0 0 0.5rem", color: "#0f172a", textTransform: "uppercase" }}>{d.methodology}</h3>
            <p style={{ margin: 0 }}>{methodology || (lang === "bn" ? "জিনোনেক্সাস পাইপলাইন ব্যবহার করে জিনোমিক বিশ্লেষণ সম্পন্ন করা হয়েছে।" : "Genomic analysis performed using the GenoNexus pipeline.")}</p>
            <p style={{ marginTop: "1rem" }}>
              <strong>{lang === "bn" ? "দাবিত্যাগ:" : "Disclaimer:"}</strong> {d.disclaimer}
            </p>
          </div>

          <div className={styles.signatureBox}>
            <div className={styles.signatureLine}></div>
            <span className={styles.signatureText}>{d.director}</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.signed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
