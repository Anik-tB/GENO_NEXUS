"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../profile/page.module.css";

interface FileItem {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  created_at: string;
}

interface ClientHistoryProps {
  uploadedFiles: FileItem[];
}

const EN = {
  back: "← Back to Profile",
  title: "All Uploads",
  subtitle: "A complete history of your DNA file uploads and their processing status.",
  analyzed: "Analyzed",
  processing: "Processing",
  noFiles: "No DNA files uploaded yet.",
  uploadFirst: "Upload your first DNA file →",
};

const BN = {
  back: "← প্রোফাইলে ফিরে যান",
  title: "সমস্ত আপলোডসমূহ",
  subtitle: "আপনার ডিএনএ ফাইল আপলোড এবং তাদের প্রক্রিয়াকরণ অবস্থার একটি সম্পূর্ণ ইতিহাস।",
  analyzed: "বিশ্লেষিত",
  processing: "প্রক্রিয়াধীন",
  noFiles: "কোনো ডিএনএ ফাইল এখনও আপলোড করা হয়নি।",
  uploadFirst: "আপনার প্রথম ডিএনএ ফাইল আপলোড করুন →",
};

export function ClientHistory({ uploadedFiles }: ClientHistoryProps) {
  const [lang, setLang] = useState("en");

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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/user/profile" className={styles.back}>
          {d.back}
        </Link>
        <h1 className={styles.title}>{d.title}</h1>
        <p className={styles.subtitle}>
          {d.subtitle}
        </p>
      </div>

      <section className={styles.section} style={{ marginTop: "2rem" }}>
        {uploadedFiles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {uploadedFiles.map(file => (
              <div key={file.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", border: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>🧬</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", color: "var(--gn-white)" }}>{file.file_name}</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--gn-text-muted)" }}>
                      {(file.file_size / (1024 * 1024)).toFixed(2)} MB • {lang === "bn" ? "আপলোড করা হয়েছে" : "Uploaded on"} {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "600", background: file.status === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(234, 179, 8, 0.1)", color: file.status === "success" ? "#10b981" : "#eab308" }}>
                    {file.status === "success" ? d.analyzed : d.processing}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyHistory}>
            <span className={styles.emptyIcon}>🧬</span>
            <p className={styles.emptyText}>{d.noFiles}</p>
            <Link href="/user/upload-dna" className={styles.uploadLink}>
              {d.uploadFirst}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
