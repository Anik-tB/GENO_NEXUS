"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface ClientDashboardProps {
  firstName: string;
  filesCount: number;
  analysesCount: number;
  markersChecked: string;
}

const EN = {
  welcome: "Welcome back 👋",
  hello: "Hello",
  sub: "Your personal genetic health dashboard. Upload your DNA file and discover what your genes say about your health — explained in simple language, no medical degree required.",
  uploadDnaBtn: "🧬 Upload DNA File",
  filesUploaded: "DNA Files Uploaded",
  analysesCompleted: "Analyses Completed",
  markersChecked: "Health Markers Checked",
  privacyStatus: "Privacy Status",
  protected: "Protected",
  uploadFirst: "Upload your first file to get started",
  readyForAnalysis: "Ready for analysis",
  resultsAppear: "Results will appear here",
  viewReports: "View your reports below",
  awaitingFirst: "Awaiting first analysis",
  acrossAnalyses: "Across your analyses",
  dataEncrypted: "Your data is encrypted",
  whatToDo: "What would you like to do?",
  uploadTitle: "Upload My DNA",
  uploadDesc: "Upload your DNA file from services like 23andMe, AncestryDNA, or raw FASTA/VCF files.",
  resultsTitle: "View My Results",
  resultsDesc: "See your health risk assessments, genetic markers, and ancestry information in plain language.",
  profileTitle: "My Profile",
  profileDesc: "Update your personal information, manage privacy settings, and view your upload history.",
  howTitle: "How GenoNexus Works",
  step1Title: "1. Upload Your DNA File",
  step1Desc: "Upload a file from 23andMe, AncestryDNA, or any standard FASTA / VCF format.",
  step2Title: "2. We Analyze Your Genes",
  step2Desc: "Our AI checks your genetic variants against thousands of known health markers.",
  step3Title: "3. Get Clear Results",
  step3Desc: "Results are shown in plain language — no medical jargon. We tell you exactly what it means.",
  step4Title: "4. Talk to a Doctor",
  step4Desc: "If anything needs attention, we'll recommend speaking with a healthcare professional.",
  privacyTitle: "Your privacy is our priority.",
  privacyDesc: "Your DNA data is encrypted at rest and in transit. We never sell your data or share it with third parties without your explicit consent. You can delete your data at any time from your profile settings."
};

const BN = {
  welcome: "স্বাগতম 👋",
  hello: "হ্যালো",
  sub: "আপনার ব্যক্তিগত জেনেটিক স্বাস্থ্য ড্যাশবোর্ড। আপনার ডিএনএ ফাইল আপলোড করুন এবং আপনার স্বাস্থ্য সম্পর্কে আপনার জিন কী বলে তা আবিষ্কার করুন — কোনো জটিল মেডিকেল শব্দ ছাড়াই সহজ ভাষায় ব্যাখ্যা করা হয়েছে।",
  uploadDnaBtn: "🧬 ডিএনএ ফাইল আপলোড করুন",
  filesUploaded: "ডিএনএ ফাইল আপলোড করা হয়েছে",
  analysesCompleted: "সম্পন্ন বিশ্লেষণ",
  markersChecked: "পরীক্ষিত হেলথ মার্কার",
  privacyStatus: "গোপনীয়তা স্থিতি",
  protected: "সুরক্ষিত",
  uploadFirst: "শুরু করতে আপনার প্রথম ফাইলটি আপলোড করুন",
  readyForAnalysis: "বিশ্লেষণের জন্য প্রস্তুত",
  resultsAppear: "ফলাফল এখানে প্রদর্শিত হবে",
  viewReports: "নিচে আপনার রিপোর্ট দেখুন",
  awaitingFirst: "প্রথম বিশ্লেষণের অপেক্ষায়",
  acrossAnalyses: "আপনার বিশ্লেষণের তথ্যে",
  dataEncrypted: "আপনার ডেটা সম্পূর্ণ এনক্রিপ্ট করা",
  whatToDo: "আপনি কী করতে চান?",
  uploadTitle: "আমার ডিএনএ আপলোড করুন",
  uploadDesc: "23andMe, AncestryDNA বা সাধারণ FASTA/VCF ফাইলের মতো পরিষেবা থেকে আপনার ডিএনএ ফাইল আপলোড করুন।",
  resultsTitle: "আমার ফলাফল দেখুন",
  resultsDesc: "আপনার স্বাস্থ্য ঝুঁকির মূল্যায়ন, জেনেটিক মার্কার এবং বংশবৃত্তান্তের তথ্য সহজ ভাষায় দেখুন।",
  profileTitle: "আমার প্রোফাইল",
  profileDesc: "আপনার ব্যক্তিগত তথ্য আপডেট করুন, গোপনীয়তা সেটিংস পরিচালনা করুন এবং আপলোড ইতিহাস দেখুন।",
  howTitle: "GenoNexus যেভাবে কাজ করে",
  step1Title: "১. আপনার ডিএনএ ফাইল আপলোড করুন",
  step1Desc: "23andMe, AncestryDNA বা অন্য কোনো স্ট্যান্ডার্ড FASTA / VCF ফরম্যাটের ফাইল আপলোড করুন।",
  step2Title: "২. আমরা আপনার জিন বিশ্লেষণ করি",
  step2Desc: "আমাদের এআই হাজার হাজার পরিচিত স্বাস্থ্য মার্কারের সাথে আপনার জেনেটিক ভ্যারিয়েন্টগুলো যাচাই করে।",
  step3Title: "৩. সহজ ভাষায় ফলাফল পান",
  step3Desc: "ফলাফলগুলো কোনো জটিল মেডিকেল শব্দ ছাড়া সাধারণ ভাষায় দেখানো হয়। আমরা আপনাকে স্পষ্টভাবে বুঝিয়ে বলি এর অর্থ কী।",
  step4Title: "৪. ডাক্তারের সাথে কথা বলুন",
  step4Desc: "যদি কোনো বিষয়ে সতর্কতার প্রয়োজন হয়, আমরা আপনাকে একজন বিশেষজ্ঞ চিকিৎসকের সাথে পরামর্শ করার পরামর্শ দেব।",
  privacyTitle: "আপনার গোপনীয়তা আমাদের সর্বোচ্চ অগ্রাধিকার।",
  privacyDesc: "আপনার ডিএনএ ডেটা সুরক্ষিতভাবে সংরক্ষিত এবং স্থানান্তরিত হয়। আপনার স্পষ্ট সম্মতি ছাড়া আমরা কখনই আপনার ডেটা বিক্রি বা অন্য কারও সাথে শেয়ার করি না। প্রোফাইল সেটিংস থেকে যেকোনো সময় ডেটা মুছে ফেলতে পারেন।"
};

export function ClientDashboard({ firstName, filesCount, analysesCount, markersChecked }: ClientDashboardProps) {
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
      {/* ── Welcome Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroGreeting}>{d.welcome}</p>
          <h1 className={styles.heroTitle}>{d.hello}, {firstName}!</h1>
          <p className={styles.heroSub}>
            {d.sub}
          </p>
        </div>
        <Link href="/user/upload-dna" className={styles.heroCta} id="hero-upload-cta">
          {d.uploadDnaBtn}
        </Link>
      </section>

      {/* ── Quick Stats ───────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🧬</span>
          <span className={styles.statLabel}>{d.filesUploaded}</span>
          <span className={styles.statValue}>{filesCount}</span>
          <span className={styles.statSub}>
            {filesCount === 0 ? d.uploadFirst : d.readyForAnalysis}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <span className={styles.statLabel}>{d.analysesCompleted}</span>
          <span className={styles.statValue}>{analysesCount}</span>
          <span className={styles.statSub}>
            {analysesCount === 0 ? d.resultsAppear : d.viewReports}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <span className={styles.statLabel}>{d.markersChecked}</span>
          <span className={styles.statValue}>{markersChecked}</span>
          <span className={styles.statSub}>
            {analysesCount === 0 ? d.awaitingFirst : d.acrossAnalyses}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔒</span>
          <span className={styles.statLabel}>{d.privacyStatus}</span>
          <span className={styles.statValue} style={{ fontSize: "1rem" }}>{d.protected}</span>
          <span className={styles.statSub}>{d.dataEncrypted}</span>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <section>
        <h2 className={styles.sectionTitle}>{d.whatToDo}</h2>
        <div className={styles.actionsGrid}>
          <Link href="/user/upload-dna" className={styles.actionCard} id="action-upload">
            <span className={styles.actionEmoji}>📤</span>
            <p className={styles.actionTitle}>{d.uploadTitle}</p>
            <p className={styles.actionDesc}>
              {d.uploadDesc}
            </p>
            <span className={styles.actionArrow}>→</span>
          </Link>

          <Link href="/user/results" className={styles.actionCard} id="action-results">
            <span className={styles.actionEmoji}>📋</span>
            <p className={styles.actionTitle}>{d.resultsTitle}</p>
            <p className={styles.actionDesc}>
              {d.resultsDesc}
            </p>
            <span className={styles.actionArrow}>→</span>
          </Link>

          <Link href="/user/profile" className={styles.actionCard} id="action-profile">
            <span className={styles.actionEmoji}>👤</span>
            <p className={styles.actionTitle}>{d.profileTitle}</p>
            <p className={styles.actionDesc}>
              {d.profileDesc}
            </p>
            <span className={styles.actionArrow}>→</span>
          </Link>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className={styles.howCard}>
        <h2 className={styles.sectionTitle}>{d.howTitle}</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <p className={styles.stepTitle}>{d.step1Title}</p>
            <p className={styles.stepDesc}>
              {d.step1Desc}
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <p className={styles.stepTitle}>{d.step2Title}</p>
            <p className={styles.stepDesc}>
              {d.step2Desc}
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <p className={styles.stepTitle}>{d.step3Title}</p>
            <p className={styles.stepDesc}>
              {d.step3Desc}
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>4</div>
            <p className={styles.stepTitle}>{d.step4Title}</p>
            <p className={styles.stepDesc}>
              {d.step4Desc}
            </p>
          </div>
        </div>
      </section>

      {/* ── Privacy Notice ────────────────────────────────────────────── */}
      <div className={styles.privacyBanner} role="note">
        <span className={styles.privacyIcon}>🔐</span>
        <p className={styles.privacyText}>
          <strong>{d.privacyTitle}</strong> {d.privacyDesc}
        </p>
      </div>
    </div>
  );
}
