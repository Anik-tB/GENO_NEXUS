"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface ClientDashboardProps {
  firstName: string;
  filesCount: number;
  analysesCount: number;
  markersChecked: string;
  userRole?: string;
}

const EN_PATIENT = {
  welcome: "Welcome back 👋",
  hello: "Hello",
  sub: "Your personal genetic health dashboard. View your approved genetic health insights, lifestyle recommendations, and referred specialists.",
  uploadDnaBtn: "📊 View My Insights",
  filesUploaded: "My DNA Samples",
  analysesCompleted: "Reports Completed",
  markersChecked: "Health Markers Checked",
  privacyStatus: "Privacy Status",
  protected: "Protected",
  uploadFirst: "Awaiting reports from your care team",
  readyForAnalysis: "Results verified",
  resultsAppear: "Results will appear here",
  viewReports: "View your reports below",
  awaitingFirst: "Awaiting first analysis",
  acrossAnalyses: "Across your analyses",
  dataEncrypted: "Your data is encrypted",
  whatToDo: "What would you like to do?",
  uploadTitle: "Upload DNA",
  uploadDesc: "Not applicable for patient profiles.",
  resultsTitle: "View My Insights",
  resultsDesc: "See your genetic health risk assessments and ancestry information in plain language.",
  profileTitle: "My Profile",
  profileDesc: "Update your personal information, manage privacy settings, and view your account history.",
  howTitle: "How GenoNexus Works",
  step1Title: "1. Sequencing Referral",
  step1Desc: "Your doctor or care coordinator submits a sequencing order for your DNA sample.",
  step2Title: "2. Clinical Ingestion & AI Call",
  step2Desc: "Our system aligns your sequence and identifies pathogenic risk markers.",
  step3Title: "3. Access Results & Care Plan",
  step3Desc: "Once signed off by your care team, your report and wellness plan are unlocked here.",
  step4Title: "4. Consult Referred Specialists",
  step4Desc: "We recommend scheduling appointments with the specialists suggested in your care plan.",
  privacyTitle: "Your privacy is our priority.",
  privacyDesc: "Your DNA data is encrypted at rest and in transit. We never sell your data or share it with third parties without your explicit consent. You can delete your data at any time from your profile settings."
};

const BN_PATIENT = {
  welcome: "স্বাগতম 👋",
  hello: "হ্যালো",
  sub: "আপনার ব্যক্তিগত জেনেটিক স্বাস্থ্য ড্যাশবোর্ড। আপনার অনুমোদিত জেনেটিক স্বাস্থ্য সংক্রান্ত তথ্য, জীবনযাত্রার সুপারিশ এবং রেফার করা স্পেশালিস্টদের তালিকা দেখুন।",
  uploadDnaBtn: "📊 আমার ফলাফল দেখুন",
  filesUploaded: "আমার ডিএনএ নমুনা",
  analysesCompleted: "রিপোর্ট সম্পন্ন হয়েছে",
  markersChecked: "পরীক্ষিত হেলথ মার্কার",
  privacyStatus: "গোপনীয়তা স্থিতি",
  protected: "সুরক্ষিত",
  uploadFirst: "কেয়ার টিম থেকে রিপোর্টের অপেক্ষায়",
  readyForAnalysis: "ফলাফল যাচাই করা হয়েছে",
  resultsAppear: "ফলাফল এখানে প্রদর্শিত হবে",
  viewReports: "নিচে আপনার রিপোর্ট দেখুন",
  awaitingFirst: "প্রথম বিশ্লেষণের অপেক্ষায়",
  acrossAnalyses: "আপনার বিশ্লেষণের তথ্যে",
  dataEncrypted: "আপনার ডেটা সম্পূর্ণ এনক্রিপ্ট করা",
  whatToDo: "আপনি কী করতে চান?",
  uploadTitle: "ডিএনএ আপলোড করুন",
  uploadDesc: "রোগী প্রোফাইলের জন্য প্রযোজ্য নয়।",
  resultsTitle: "আমার ফলাফল দেখুন",
  resultsDesc: "আপনার স্বাস্থ্য ঝুঁকির মূল্যায়ন এবং বংশবৃত্তান্তের তথ্য সহজ ভাষায় দেখুন।",
  profileTitle: "আমার প্রোফাইল",
  profileDesc: "আপনার ব্যক্তিগত তথ্য আপডেট করুন, গোপনীয়তা সেটিংস পরিচালনা করুন এবং লগইন ইতিহাস দেখুন।",
  howTitle: "GenoNexus যেভাবে কাজ করে",
  step1Title: "১. সিকোয়েন্সিং অর্ডার",
  step1Desc: "আপনার ডাক্তার বা কেয়ার কোঅর্ডিনেটর আপনার ডিএনএ নমুনার জন্য একটি সিকোয়েন্সিং অর্ডার দেন।",
  step2Title: "২. ক্লিনিক্যাল অ্যালাইনমেন্ট ও এআই কল",
  step2Desc: "আমাদের সিস্টেম সিকোয়েন্স ম্যাচ করে ক্ষতিকর ঝুঁকির মার্কারগুলো খুঁজে বের করে।",
  step3Title: "৩. ফলাফল ও যত্ন পরিকল্পনা দেখুন",
  step3Desc: "আপনার কেয়ার টিম অনুমোদন দিলে, আপনার রিপোর্ট এবং যত্ন পরিকল্পনা এখানে আনলক হবে।",
  step4Title: "৪. স্পেশালিস্টদের সাথে পরামর্শ করুন",
  step4Desc: "আপনার যত্ন পরিকল্পনায় সুপারিশকৃত বিশেষজ্ঞ চিকিৎসকদের সাথে অ্যাপয়েন্টমেন্ট নির্ধারণ করুন।",
  privacyTitle: "আপনার গোপনীয়তা আমাদের সর্বোচ্চ অগ্রাধিকার।",
  privacyDesc: "আপনার ডিএনএ ডেটা সুরক্ষিতভাবে সংরক্ষিত এবং স্থানান্তরিত হয়। আপনার স্পষ্ট সম্মতি ছাড়া আমরা কখনই আপনার ডেটা বিক্রি বা অন্য কারও সাথে শেয়ার করি না। প্রোফাইল সেটিংস থেকে যেকোনো সময় ডেটা মুছে ফেলতে পারেন।"
};

const EN_COORDINATOR = {
  welcome: "Welcome back 👋",
  hello: "Hello, Coordinator",
  sub: "Clinical Ingestion Portal. Ingest patient genomic files, run variant calling/alignment pipelines, and coordinate specialist referrals.",
  uploadDnaBtn: "🧬 Upload Patient DNA",
  filesUploaded: "Patient Samples Ingested",
  analysesCompleted: "Diagnostic Reports Ready",
  markersChecked: "Pathogenic Markers Checked",
  privacyStatus: "Privacy Status",
  protected: "Protected",
  uploadFirst: "Upload patient sequence to get started",
  readyForAnalysis: "Ready for clinical analysis",
  resultsAppear: "Results will appear here",
  viewReports: "View patient reports below",
  awaitingFirst: "Awaiting first analysis",
  acrossAnalyses: "Across patient analyses",
  dataEncrypted: "Data is end-to-end encrypted",
  whatToDo: "Clinical Actions",
  uploadTitle: "Upload Patient DNA",
  uploadDesc: "Ingest a new patient sequence (FASTA, VCF, or zipped DTC data) and match it to a reference genome.",
  resultsTitle: "View Patient Results",
  resultsDesc: "Access full mutation counts, pathogenicity scores, and drug resistance findings for patients.",
  profileTitle: "Clinic Settings",
  profileDesc: "Update clinic information, manage provider preferences, and view system logs.",
  howTitle: "How GenoNexus Ingestion Works",
  step1Title: "1. Ingest Patient Sequence",
  step1Desc: "Upload the patient's raw VCF, FASTA, or zipped sequence retrieved from the laboratory database.",
  step2Title: "2. Automated AI Call",
  step2Desc: "Our alignment engine matches the query sequence to a reference and the AI predicts mutation pathogenicity.",
  step3Title: "3. Clinical Report Generation",
  step3Desc: "Review interactive mutation heatmaps, drug resistance indicators, and plain-language insights.",
  step4Title: "4. Escalate to Specialist",
  step4Desc: "If high-severity variants are flagged, route the report directly to an oncologist or specialist for review.",
  privacyTitle: "Data security and HIPAA compliance.",
  privacyDesc: "Patient genomic data is encrypted at rest and in transit. GenoNexus does not share clinical files without consent. Audit logs track all access."
};

const BN_COORDINATOR = {
  welcome: "স্বাগতম 👋",
  hello: "হ্যালো, কোঅর্ডিনেটর",
  sub: "ক্লিনিক্যাল ইনটেক পোর্টাল। রোগীর জিনোমিক ফাইল আপলোড করুন, ভ্যারিয়েন্ট কলিং/অ্যালাইনমেন্ট পাইপলাইন চালান এবং স্পেশালিস্ট রেফারেল পরিচালনা করুন।",
  uploadDnaBtn: "🧬 রোগীর ডিএনএ আপলোড করুন",
  filesUploaded: "রোগীর নমুনা আপলোড করা হয়েছে",
  analysesCompleted: "ডায়াগনস্টিক রিপোর্ট প্রস্তুত",
  markersChecked: "পরীক্ষিত প্যাথোজেনিক মার্কার",
  privacyStatus: "গোপনীয়তা স্থিতি",
  protected: "সুরক্ষিত",
  uploadFirst: "শুরু করতে রোগীর প্রথম ফাইলটি আপলোড করুন",
  readyForAnalysis: "বিশ্লেষণের জন্য প্রস্তুত",
  resultsAppear: "ফলাফল এখানে প্রদর্শিত হবে",
  viewReports: "নিচে রোগীর রিপোর্ট দেখুন",
  awaitingFirst: "প্রথম বিশ্লেষণের অপেক্ষায়",
  acrossAnalyses: "আপনার বিশ্লেষণের তথ্যে",
  dataEncrypted: "ডেটা সম্পূর্ণ এনক্রিপ্ট করা",
  whatToDo: "ক্লিনিক্যাল অ্যাকশন",
  uploadTitle: "রোগীর ডিএনএ আপলোড করুন",
  uploadDesc: "রোগীর নতুন সিকোয়েন্স (FASTA, VCF বা জিপ করা DTC ফাইল) আপলোড করুন এবং রেফারেন্স জিনোমের সাথে ম্যাচ করান।",
  resultsTitle: "রোগীর ফলাফল দেখুন",
  resultsDesc: "রোগীদের সম্পূর্ণ মিউটেশন কাউন্ট, প্যাথোজেনিসিটি স্কোর এবং ড্রাগ রেজিস্ট্যান্স ফলাফল দেখুন।",
  profileTitle: "ক্লিনিক সেটিংস",
  profileDesc: "ক্লিনিকের তথ্য আপডেট করুন, প্রোভাইডার সেটিংস পরিচালনা করুন এবং সিস্টেম লগ দেখুন।",
  howTitle: "GenoNexus যেভাবে কাজ করে",
  step1Title: "১. রোগীর সিকোয়েন্স আপলোড",
  step1Desc: "ল্যাবরেটরি ডাটাবেস থেকে রোগীর সংগৃহীত র VCF, FASTA বা জিপ ফাইল আপলোড করুন।",
  step2Title: "২. স্বয়ংক্রিয় এআই কলিং",
  step2Desc: "আমাদের অ্যালাইনমেন্ট ইঞ্জিন সিকোয়েন্স ম্যাচ করে এবং এআই মিউটেশনের ক্ষতিকর মাত্রা নির্ধারণ করে।",
  step3Title: "৩. ক্লিনিক্যাল রিপোর্ট তৈরি",
  step3Desc: "মিউটেশন হিটম্যাপ, ড্রাগ রেজিস্ট্যান্স নির্দেশক এবং সহজ ভাষায় তৈরি রিপোর্ট পর্যালোচনা করুন।",
  step4Title: "৪. স্পেশালিস্টের কাছে রেফার করুন",
  step4Desc: "উচ্চ ঝুঁকিপূর্ণ মিউটেশন পাওয়া গেলে সরাসরি অনকোলজিস্ট বা বিশেষজ্ঞ চিকিৎসকের কাছে রেফারেল পাঠিয়ে দিন।",
  privacyTitle: "ডেটা নিরাপত্তা এবং হেপা (HIPAA) কমপ্লায়েন্স।",
  privacyDesc: "রোগীর জিনোমিক ডেটা সম্পূর্ণ এনক্রিপ্ট করে সংরক্ষণ করা হয়। সম্মতি ছাড়া ক্লিনিক্যাল ফাইল শেয়ার করা হয় না। অডিট লগের মাধ্যমে এক্সেস ট্র্যাক করা হয়।"
};

export function ClientDashboard({ firstName, filesCount, analysesCount, markersChecked, userRole = "patient" }: ClientDashboardProps) {
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

  const isCoordinator = userRole === "caregiver";
  const d = lang === "bn"
    ? (isCoordinator ? BN_COORDINATOR : BN_PATIENT)
    : (isCoordinator ? EN_COORDINATOR : EN_PATIENT);

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
        <Link 
          href={isCoordinator ? "/user/upload-dna" : "/user/results"} 
          className={styles.heroCta} 
          id="hero-upload-cta"
        >
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
          {isCoordinator && (
            <Link href="/user/upload-dna" className={styles.actionCard} id="action-upload">
              <span className={styles.actionEmoji}>📤</span>
              <p className={styles.actionTitle}>{d.uploadTitle}</p>
              <p className={styles.actionDesc}>
                {d.uploadDesc}
              </p>
              <span className={styles.actionArrow}>→</span>
            </Link>
          )}

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
