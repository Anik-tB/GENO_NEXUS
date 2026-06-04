"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { PrivacySettings } from "./PrivacySettings";
import { DangerZone } from "./DangerZone";
import styles from "./page.module.css";

interface FileItem {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  created_at: string;
}

interface ClientProfileProps {
  user: any;
  uploadedFiles: FileItem[];
  researchOptIn: boolean;
  initials: string;
  fullName: string;
  memberSinceDate: string;
}

const EN = {
  back: "← Back to Dashboard",
  title: "My Profile",
  subtitle: "Manage your personal information and privacy settings.",
  memberSince: "Member since",
  uploadHistory: "Upload History",
  viewAll: "View All →",
  analyzed: "Analyzed",
  processing: "Processing",
  noFiles: "No DNA files uploaded yet.",
  uploadFirst: "Upload your first DNA file →",
};

const BN = {
  back: "← ড্যাশবোর্ডে ফিরে যান",
  title: "আমার প্রোফাইল",
  subtitle: "আপনার ব্যক্তিগত তথ্য এবং গোপনীয়তা সেটিংস পরিচালনা করুন।",
  memberSince: "সদস্য হয়েছেন",
  uploadHistory: "আপলোড ইতিহাস",
  viewAll: "সব দেখুন →",
  analyzed: "বিশ্লেষিত",
  processing: "প্রক্রিয়াধীন",
  noFiles: "কোনো ডিএনএ ফাইল এখনও আপলোড করা হয়নি।",
  uploadFirst: "আপনার প্রথম ডিএনএ ফাইল আপলোড করুন →",
};

export function ClientProfile({ user, uploadedFiles, researchOptIn, initials, fullName, memberSinceDate }: ClientProfileProps) {
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
        <Link href="/user/dashboard" className={styles.back} id="profile-back">
          {d.back}
        </Link>
        <h1 className={styles.title}>{d.title}</h1>
        <p className={styles.subtitle}>
          {d.subtitle}
        </p>
      </div>

      {/* ── Identity Card ──────────────────────────────────────────── */}
      <div className={styles.identityCard}>
        <div className={styles.avatarLarge}>{initials}</div>
        <div>
          <p className={styles.identityName}>{fullName}</p>
          <p className={styles.identityEmail}>{user?.email || "—"}</p>
          <p className={styles.identityMeta}>{d.memberSince} {memberSinceDate}</p>
        </div>
      </div>

      {/* ── Personal Information ───────────────────────────────────── */}
      {user && (
        <ProfileInfoForm user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountCategory: user.accountCategory,
          phone: user.phone,
          organization: user.organization
        }} />
      )}

      {/* ── Upload History ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>{d.uploadHistory}</h2>
          {uploadedFiles.length > 3 && (
            <Link href="/user/history" style={{ color: "var(--gn-primary)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500 }}>
              {d.viewAll}
            </Link>
          )}
        </div>
        {uploadedFiles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {uploadedFiles.slice(0, 3).map(file => (
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
            <Link href="/user/upload-dna" className={styles.uploadLink} id="profile-upload-link">
              {d.uploadFirst}
            </Link>
          </div>
        )}
      </section>

      {/* ── Privacy Settings ───────────────────────────────────────── */}
      <PrivacySettings initialResearchOptIn={researchOptIn} />

      {/* ── Danger Zone ────────────────────────────────────────────── */}
      <DangerZone />
    </div>
  );
}
