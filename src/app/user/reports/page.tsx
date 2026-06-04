"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface Report {
  id: string;
  name: string;
  patient_id: string;
  size_bytes: number;
  status: string;
  created_at: string;
}

const EN = {
  loading: "Loading your clinical reports...",
  title: "Clinical Reports",
  subtitle: "Access and download your comprehensive genomic analysis reports.",
  generateNew: "Generate New Report",
  generateComp: "Generate Comprehensive Report",
  generating: "Generating...",
  emptyTitle: "No Reports Yet",
  emptyDesc: "You haven't generated any comprehensive clinical reports yet. Once your DNA is analyzed, you can generate a detailed medical-grade PDF report here.",
  patientId: "Patient ID",
  dateGen: "Date Generated",
  size: "Size",
  errorGen: "An error occurred while generating the report. Make sure you have uploaded and analyzed a DNA file first.",
};

const BN = {
  loading: "আপনার ক্লিনিক্যাল রিপোর্ট লোড হচ্ছে...",
  title: "ক্লিনিক্যাল রিপোর্টসমূহ",
  subtitle: "আপনার বিশদ জেনেটিক বিশ্লেষণ রিপোর্টগুলো ডাউনলোড করুন ও অ্যাক্সেস করুন।",
  generateNew: "নতুন রিপোর্ট তৈরি করুন",
  generateComp: "নতুন রিপোর্ট তৈরি করুন",
  generating: "তৈরি হচ্ছে...",
  emptyTitle: "এখনও কোনো রিপোর্ট নেই",
  emptyDesc: "আপনি এখনও কোনো সমন্বিত ক্লিনিক্যাল রিপোর্ট তৈরি করেননি। আপনার ডিএনএ ফাইল বিশ্লেষণ শেষ হলে, আপনি এখানে একটি বিশদ মেডিকেল-গ্রেড পিডিএফ রিপোর্ট তৈরি করতে পারেন।",
  patientId: "রোগীর আইডি (ID)",
  dateGen: "তৈরির তারিখ",
  size: "সাইজ",
  errorGen: "রিপোর্ট তৈরি করার সময় একটি সমস্যা হয়েছে। প্রথমে আপনার ডিএনএ ফাইল আপলোড ও বিশ্লেষণ সম্পন্ন হয়েছে কিনা তা নিশ্চিত করুন।",
};

export default function ReportsPage() {
  const [lang, setLang] = useState("en");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/reports");
      const data = await res.json();
      
      if (res.ok && data.success) {
        setReports(data.reports || []);
      } else {
        throw new Error(data.error || "Failed to load reports");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const res = await fetch("/api/reports", {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Refresh the reports list
        await fetchReports();
      } else {
        throw new Error(data.error || d.errorGen);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || d.errorGen);
    } finally {
      setGenerating(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{d.title}</h1>
          <p className={styles.subtitle}>{d.loading}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(16, 185, 129, 0.1)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerTop}>
        <div className={styles.header}>
          <h1 className={styles.title}>{d.title}</h1>
          <p className={styles.subtitle}>
            {d.subtitle}
          </p>
        </div>
        
        {reports.length > 0 && (
          <button 
            className={styles.btnPrimary} 
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? d.generating : d.generateNew}
          </button>
        )}
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {reports.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <h2 className={styles.emptyTitle}>{d.emptyTitle}</h2>
          <p className={styles.emptyDesc}>
            {d.emptyDesc}
          </p>
          <button 
            className={styles.btnPrimary} 
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? d.generating : d.generateComp}
          </button>
        </div>
      ) : (
        <div className={styles.reportGrid}>
          {reports.map((report) => {
            // Translate report name if it's default
            let reportName = report.name;
            if (lang === "bn" && reportName.includes("Clinical Genomic Report")) {
              reportName = reportName.replace("Clinical Genomic Report", "ক্লিনিক্যাল জিনোমিক রিপোর্ট");
            }
            return (
              <Link key={report.id} href={`/user/reports/${report.id}`} className={styles.reportCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.reportIcon}>🧬</div>
                  <span className={styles.statusBadge}>
                    {report.status === "completed" && lang === "bn" ? "সম্পন্ন" : report.status}
                  </span>
                </div>
                <h3 className={styles.reportName}>{reportName}</h3>
                <div className={styles.reportMeta}>
                  <div className={styles.metaItem}>
                    <span>{d.patientId}</span>
                    <span className={styles.metaValue}>{report.patient_id}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span>{d.dateGen}</span>
                    <span className={styles.metaValue}>{formatDate(report.created_at)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span>{d.size}</span>
                    <span className={styles.metaValue}>{formatBytes(report.size_bytes)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
