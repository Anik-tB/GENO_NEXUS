"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const ACCEPTED_FORMATS = [".fasta", ".fa", ".vcf", ".fna", ".zip"];
const MAX_SIZE_MB = 100;

const FORMAT_INFO = [
  { ext: "FASTA", desc: "Genetic Sequence", descBn: "জেনেটিক সিকোয়েন্স", color: "var(--gn-primary)" },
  { ext: "VCF", desc: "Variant Call Format", descBn: "ভ্যারিয়েন্ট কল ফরম্যাট", color: "var(--gn-blue)" },
  { ext: "FNA", desc: "FASTA Nucleic Acid", descBn: "নিউক্লিক অ্যাসিড সিকোয়েন্স", color: "#a78bfa" },
];

const EN = {
  back: "← Back to Dashboard",
  title: "Upload Your DNA File",
  subtitle: "Upload your genetic data file to get started. We support files from 23andMe, AncestryDNA, and standard FASTA / VCF formats.",
  successTitle: "Upload Complete!",
  successDesc: "Your DNA file has been securely uploaded. Our system is now analyzing your genetic data. This usually takes 2–5 minutes.",
  viewResults: "View Disease Predictions →",
  uploadAnother: "Upload Another File",
  maxSize: "Max Size",
  dragDrop: "Drag & drop your DNA file",
  or: "or",
  browse: "click to browse",
  limit: "Maximum file size:",
  selectRef: "Select Reference Genome",
  refDesc: "Select an NCBI reference genome below. Our system will analyze your uploaded DNA against this reference sequence.",
  profileTitle: "Patient Profile Required",
  profileRequired: "⚠ Required for BRCA Analysis",
  profileDesc: "Because you selected a BRCA reference genome, please fill in this profile. This is required by the CanRisk clinical model to calculate accurate cancer risk percentages.",
  age: "Age",
  sex: "Biological Sex",
  female: "♀ Female",
  male: "♂ Male",
  familyHistory: "Family History (First-Degree Relatives)",
  withBreast: "With Breast Cancer",
  withOvarian: "With Ovarian Cancer",
  uploadSubmit: "Upload and Analysis",
  uploadSelectRef: "Select Reference Genome",
  privacy: "Your DNA data is end-to-end encrypted and stored securely. GenoNexus never sells or shares your genetic data. You can delete your data at any time.",
  uploading: "Uploading & encrypting your file…",
  uploadingHint: "Your data is being encrypted before leaving your device.",
  errSize: "File is too large. Maximum allowed size is 100 MB.",
  errType: "Unsupported file type. Please upload a FASTA, FNA, or VCF file."
};

const BN = {
  back: "← ড্যাশবোর্ডে ফিরে যান",
  title: "আপনার ডিএনএ ফাইল আপলোড করুন",
  subtitle: "শুরু করতে আপনার জেনেটিক ডেটা ফাইলটি আপলোড করুন। আমরা 23andMe, AncestryDNA এবং সাধারণ FASTA / VCF ফাইল সমর্থন করি।",
  successTitle: "আপলোড সম্পন্ন হয়েছে!",
  successDesc: "আপনার ডিএনএ ফাইলটি সফলভাবে আপলোড করা হয়েছে। আমাদের সিস্টেম এখন আপনার জেনেটিক ডেটা বিশ্লেষণ করছে। এটি সাধারণত ২–৫ মিনিট সময় নেয়।",
  viewResults: "ফলাফল দেখুন →",
  uploadAnother: "আরেকটি ফাইল আপলোড করুন",
  maxSize: "সর্বোচ্চ সাইজ",
  dragDrop: "আপনার ডিএনএ ফাইলটি এখানে ড্র্যাগ অ্যান্ড ড্রপ করুন",
  or: "অথবা",
  browse: "ব্রাউজ করতে ক্লিক করুন",
  limit: "সর্বোচ্চ ফাইল সাইজ:",
  selectRef: "রেফারেন্স জিনোম নির্বাচন করুন",
  refDesc: "নিচে একটি এনসিবিআই (NCBI) রেফারেন্স জিনোম নির্বাচন করুন। আমাদের সিস্টেম এই রেফারেন্স সিকোয়েন্সের বিপরীতে আপনার আপলোড করা ডিএনএ বিশ্লেষণ করবে।",
  profileTitle: "রোগীর প্রোফাইল তথ্য আবশ্যক",
  profileRequired: "⚠ BRCA বিশ্লেষণের জন্য আবশ্যক",
  profileDesc: "যেহেতু আপনি একটি BRCA রেফারেন্স জিনোম নির্বাচন করেছেন, অনুগ্রহ করে এই প্রোফাইলটি পূরণ করুন। সঠিক ক্যান্সারের ঝুঁকির হার গণনা করতে CanRisk ক্লিনিক্যাল মডেলের জন্য এটি প্রয়োজনীয়।",
  age: "বয়স",
  sex: "শারীরবৃত্তীয় লিঙ্গ",
  female: "♀ নারী",
  male: "♂ পুরুষ",
  familyHistory: "পারিবারিক ইতিহাস (প্রথম-ডিগ্রী আত্মীয়স্বজন)",
  withBreast: "স্তন ক্যান্সারে আক্রান্ত",
  withOvarian: "ডিম্বাশয় ক্যান্সারে আক্রান্ত",
  uploadSubmit: "আপলোড এবং বিশ্লেষণ করুন",
  uploadSelectRef: "রেফারেন্স জিনোম নির্বাচন করুন",
  privacy: "আপনার ডিএনএ ডেটা অ্যান্ড-টু-অ্যান্ড এনক্রিপ্ট করা এবং নিরাপদে সংরক্ষিত। GenoNexus কখনই আপনার জেনেটিক ডেটা বিক্রি বা শেয়ার করে না। আপনি যেকোনো সময় আপনার প্রোফাইল সেটিংস থেকে ডেটা মুছে ফেলতে পারেন।",
  uploading: "আপনার ফাইল আপলোড ও এনক্রিপ্ট করা হচ্ছে…",
  uploadingHint: "আপনার ডিভাইস থেকে ফাইলটি পাঠানোর আগে সম্পূর্ণ এনক্রিপ্ট করা হচ্ছে।",
  errSize: "ফাইলটি অনেক বড়। সর্বোচ্চ অনুমোদিত সাইজ ১০০ এমবি (100 MB)।",
  errType: "অসমর্থিত ফাইলের ধরণ। অনুগ্রহ করে FASTA, FNA, বা VCF ফাইল আপলোড করুন।"
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UploadDnaPage() {
  const [lang, setLang] = useState("en");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Patient Profile fields (required for BRCA)
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState<"female" | "male" | "">("");
  const [fhBreast, setFhBreast] = useState("0");
  const [fhOvarian, setFhOvarian] = useState("0");

  const [patients, setPatients] = useState<any[]>([]);
  const [dnaAppointments, setDnaAppointments] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedDnaAppointmentId, setSelectedDnaAppointmentId] = useState<string>("");
  const [isCoordinator, setIsCoordinator] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const getRefUrlFromAnalysisType = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes("covid") || t.includes("sars")) return "https://www.ncbi.nlm.nih.gov/nuccore/NC_045512.2?report=fasta";
    if (t.includes("hiv")) return "https://www.ncbi.nlm.nih.gov/nuccore/NC_001802.1?report=fasta";
    if (t.includes("brca") || t.includes("breast") || t.includes("ovarian") || t.includes("cancer")) return "https://www.ncbi.nlm.nih.gov/nuccore/NM_007294.4?report=fasta";
    if (t.includes("ebola")) return "https://www.ncbi.nlm.nih.gov/nuccore/NC_002549.1?report=fasta";
    return "";
  };

  useEffect(() => {
    fetch("/api/patients")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.patients) {
          setIsCoordinator(true);
          setPatients(data.patients);
        }
      })
      .catch(console.error);

    fetch("/api/dna-appointments")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.appointments) {
          setDnaAppointments(data.appointments);
        }
      })
      .catch(console.error);
  }, []);

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

  function validateFile(f: File) {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      return d.errType;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return d.errSize;
    }
    return null;
  }

  function pickFile(f: File) {
    setError(null);
    setDone(false);
    setProgress(0);
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setFile(f);
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }, [lang]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) pickFile(selected);
  }

  function handleUpload() {
    if (!file) return;
    if (isCoordinator && !selectedPatientId) {
      setError(lang === "bn" ? "অনুগ্রহ করে একজন রোগী নির্বাচন করুন।" : "Please select a patient.");
      return;
    }

    // Validate filename against selected reference genome to prevent mismatches
    const filenameLower = file.name.toLowerCase();

    const references = [
      { id: 'covid', urlKey: 'NC_045512', name: 'COVID-19', keywords: ['covid', 'sars', 'nc_045512'] },
      { id: 'hiv', urlKey: 'NC_001802', name: 'HIV-1', keywords: ['hiv', 'nc_001802'] },
      { id: 'brca', urlKey: 'NM_007294', name: 'BRCA1', keywords: ['brca', 'nm_007294'] },
      { id: 'ebola', urlKey: 'NC_002549', name: 'Ebola virus', keywords: ['ebola', 'ebov', 'nc_002549'] }
    ];

    const selectedRef = references.find(ref => linkUrl.includes(ref.urlKey));

    if (selectedRef) {
      for (const ref of references) {
        if (ref.id !== selectedRef.id && ref.keywords.some(kw => filenameLower.includes(kw))) {
          setError(
            lang === "bn"
              ? `আপনি ${selectedRef.name} রেফারেন্স জিনোম নির্বাচন করেছেন, কিন্তু ${ref.name} এর জন্য ফাইল আপলোড করেছেন। আপনি ভুল ফাইল সাবমিট করেছেন।`
              : `You selected the ${selectedRef.name} reference genome, but uploaded a file for ${ref.name}. You have submitted the wrong file.`
          );
          return;
        }
      }
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (linkUrl) formData.append("referenceUrl", linkUrl);
    if (selectedPatientId) formData.append("patientId", selectedPatientId);
    if (selectedDnaAppointmentId) formData.append("dnaAppointmentId", selectedDnaAppointmentId);

    const isBrca = linkUrl === "https://www.ncbi.nlm.nih.gov/nuccore/NM_007294.4?report=fasta";
    if (isBrca) {
      formData.append("patientMetadata", JSON.stringify({
        age: parseInt(patientAge) || 40,
        sex: patientSex || "female",
        familyHistory: {
          breastCancer: parseInt(fhBreast) || 0,
          ovarianCancer: parseInt(fhOvarian) || 0
        }
      }));
    }

    const xhr = new XMLHttpRequest();

    // Track actual upload progress
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        // Cap at 95% until server finishes processing comparison check
        setProgress(Math.min(95, pct));
      }
    });

    // Handle complete
    xhr.addEventListener("load", () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setDone(true);
      } else {
        let errMsg = lang === "bn" ? "আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" : "Upload failed. Please try again.";
        try {
          const res = JSON.parse(xhr.responseText);
          errMsg = res.error || errMsg;
        } catch { }
        setError(errMsg);
        setProgress(0);
      }
    });

    // Handle error
    xhr.addEventListener("error", () => {
      setUploading(false);
      setError(
        lang === "bn"
          ? "আপলোড করার সময় একটি নেটওয়ার্ক সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।"
          : "Network error occurred during upload. Please check your connection."
      );
      setProgress(0);
    });

    xhr.open("POST", "/api/user/upload");
    xhr.send(formData);
  }

  function reset() {
    setFile(null);
    setError(null);
    setProgress(0);
    setDone(false);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/user/dashboard" className={styles.back} id="upload-back">
          {d.back}
        </Link>
        <h1 className={styles.title}>{d.title}</h1>
        <p className={styles.subtitle}>
          {d.subtitle}
        </p>
      </div>

      {done ? (
        /* ── Success State ─────────────────────────────────────────── */
        <div className={styles.successCard}>
          <span className={styles.successIcon}>✅</span>
          <h2 className={styles.successTitle}>{d.successTitle}</h2>
          <p className={styles.successDesc}>
            {lang === "bn" ? (
              <>আপনার ডিএনএ ফাইল <strong>{file?.name}</strong> নিরাপদে আপলোড করা হয়েছে। আমাদের সিস্টেম এখন আপনার ডেটা বিশ্লেষণ করছে। এটি সাধারণত ২–৫ মিনিট সময় নেয়।</>
            ) : (
              <>Your DNA file <strong>{file?.name}</strong> has been securely uploaded. Our system is now analyzing your genetic data. This usually takes 2–5 minutes.</>
            )}
          </p>
          <div className={styles.successActions}>
            <Link href="/user/results" style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--gn-blue)", border: '1px solid rgba(59, 130, 246, 0.3)', padding: "0.85rem 1.6rem", borderRadius: "999px", fontWeight: "700", fontSize: "0.95rem", textDecoration: "none", transition: "all 0.2s" }}>
              {d.viewResults}
            </Link>
            <button onClick={reset} className={styles.btnSecondary} id="upload-another">
              {d.uploadAnother}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Patient Selection (Care Coordinator Only) ── */}
          {isCoordinator && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: "#090e17", border: "1px solid #1e293b", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}>
              
              {/* Pending DNA Ingestion Requests */}
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--gn-primary)", display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '8px' }}>📋</span>
                  {lang === "bn" ? "বুক করা ডিএনএ বিশ্লেষণ অনুরোধসমূহ" : "Booked DNA Ingestion Requests"}
                </h3>
                {dnaAppointments.length === 0 ? (
                  <p style={{ color: "var(--gn-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    {lang === "bn" ? "কোনো বুক করা ডিএনএ অনুরোধ নেই।" : "No pending DNA analysis bookings."}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {dnaAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => {
                          setSelectedDnaAppointmentId(appt.id);
                          setSelectedPatientId(appt.patient_id);
                          const refUrl = getRefUrlFromAnalysisType(appt.analysis_type);
                          setLinkUrl(refUrl);
                        }}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: `1px solid ${selectedDnaAppointmentId === appt.id ? 'var(--gn-primary)' : 'rgba(255, 255, 255, 0.05)'}`,
                          background: selectedDnaAppointmentId === appt.id ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>{appt.patient_name}</span>
                          <span style={{ color: 'var(--gn-text-muted)', fontSize: '0.8rem', marginLeft: '0.75rem' }}>({appt.analysis_type})</span>
                        </div>
                        {selectedDnaAppointmentId === appt.id && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--gn-primary)', fontWeight: 'bold' }}>✓ Selected</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── Format Info Cards ── */}
          <div className={styles.formatRow}>
            {FORMAT_INFO.map((f) => (
              <div key={f.ext} className={styles.formatCard}>
                <span className={styles.formatExt} style={{ color: f.color }}>
                  .{f.ext.toLowerCase()}
                </span>
                <span className={styles.formatDesc}>{lang === "bn" ? f.descBn : f.desc}</span>
              </div>
            ))}
            <div className={`${styles.formatCard} ${styles.maxSizeCard}`}>
              <span className={styles.maxSizeLabel}>{d.maxSize}</span>
              <span className={styles.maxSizeValue}>{MAX_SIZE_MB} MB</span>
            </div>
          </div>

          {/* ── Drop Zone ──────────────────────────────────────────── */}
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""} ${file ? styles.dropZoneHasFile : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !file && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            id="upload-dropzone"
            aria-label={d.dragDrop}
            onKeyDown={(e) => e.key === "Enter" && !file && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FORMATS.join(",")}
              className={styles.hiddenInput}
              onChange={handleInputChange}
              id="upload-file-input"
              aria-label="Select DNA file"
            />

            {file ? (
              <div className={styles.filePreview}>
                <span className={styles.fileIcon}>🧬</span>
                <div className={styles.fileInfo}>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className={styles.removeBtn}
                  id="upload-remove-file"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className={styles.dropContent}>
                <span className={styles.dropIcon}>📂</span>
                <p className={styles.dropTitle}>
                  {dragOver ? (lang === "bn" ? "এখানে ফাইলটি ছেড়ে দিন!" : "Drop it here!") : d.dragDrop}
                </p>
                <p className={styles.dropHint}>
                  {d.or} <span className={styles.browseLink}>{d.browse}</span>
                </p>
                <div className={styles.formatBadges}>
                  {ACCEPTED_FORMATS.map((f) => (
                    <span key={f} className={styles.formatBadge}>
                      {f.toUpperCase()}
                    </span>
                  ))}
                </div>
                <p className={styles.sizeLimit}>{d.limit} {MAX_SIZE_MB} MB</p>
              </div>
            )}
          </div>

          {/* ── Reference Genome Selection ───────────────────────────────────────────── */}
          <div style={{ background: "#090e17", border: "1px solid #1e293b", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)", marginTop: "1.5rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--gn-primary)", display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '8px' }}>🧬</span>
                {d.selectRef}
              </h3>
            </div>

            <p style={{ color: "var(--gn-text-secondary)", fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              {d.refDesc}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { id: 'covid', name: 'SARS-CoV-2 (COVID-19)', url: 'https://www.ncbi.nlm.nih.gov/nuccore/NC_045512.2?report=fasta', desc: 'NC_045512.2' },
                { id: 'hiv', name: 'HIV-1', url: 'https://www.ncbi.nlm.nih.gov/nuccore/NC_001802.1?report=fasta', desc: 'NC_001802.1' },
                { id: 'brca', name: 'Homo sapiens BRCA1', url: 'https://www.ncbi.nlm.nih.gov/nuccore/NM_007294.4?report=fasta', desc: 'NM_007294.4' },
                { id: 'ebola', name: 'Ebola virus', url: 'https://www.ncbi.nlm.nih.gov/nuccore/NC_002549.1?report=fasta', desc: 'NC_002549.1' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setLinkUrl(opt.url)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    border: `2px solid ${linkUrl === opt.url ? 'var(--gn-primary)' : '#1e293b'}`,
                    background: linkUrl === opt.url ? 'rgba(16, 185, 129, 0.05)' : '#05080d',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: linkUrl === opt.url ? 'var(--gn-primary)' : 'var(--gn-white)', fontWeight: '600', fontSize: '0.95rem' }}>
                      {opt.name}
                    </span>
                    <span style={{ color: 'var(--gn-text-muted)', fontSize: '0.8rem' }}>
                      {opt.desc}
                    </span>
                  </div>
                  {linkUrl === opt.url && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gn-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Error ──────────────────────────────────────────────── */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              ⚠️ {error}
            </div>
          )}

          {/* ── Upload Progress ─────────────────────────────────────── */}
          {uploading && (
            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <span>{d.uploading}</span>
                <span>{progress}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={styles.progressHint}>
                {d.uploadingHint}
              </p>
            </div>
          )}

          {/* ── Patient Profile Form (For BRCA only) ──────────────────────── */}
          {linkUrl === "https://www.ncbi.nlm.nih.gov/nuccore/NM_007294.4?report=fasta" && (
            <div style={{ marginTop: "1.5rem", background: "#090e17", border: (patientAge && patientSex) ? '1px solid rgba(129, 140, 248, 0.5)' : '1px solid rgba(248, 113, 113, 0.5)', borderRadius: "16px", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#818cf8", display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <span style={{ background: 'rgba(129, 140, 248, 0.15)', padding: '6px', borderRadius: '8px' }}>🧬</span>
                  {d.profileTitle}
                  {(!patientAge || !patientSex) && <span style={{ fontSize: '0.7rem', background: 'rgba(248,113,113,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(248,113,113,0.3)', marginLeft: '0.4rem' }}>{d.profileRequired}</span>}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: 'var(--gn-text-muted)', fontSize: '0.82rem', margin: 0 }}>{d.profileDesc}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>{d.age}</label>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={patientAge}
                      onChange={e => setPatientAge(e.target.value.replace(/\D/g, ''))}
                      style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem', width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>{d.sex}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(['female', 'male'] as const).map(s => (
                        <button key={s} onClick={() => setPatientSex(s)}
                          style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: `1px solid ${patientSex === s ? '#818cf8' : '#1e293b'}`, background: patientSex === s ? 'rgba(129,140,248,0.15)' : '#05080d', color: patientSex === s ? '#818cf8' : 'var(--gn-text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                          {s === 'female' ? d.female : d.male}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(129,140,248,0.04)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: '10px', padding: '1rem' }}>
                  <p style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>{d.familyHistory}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.8rem' }}>{d.withBreast}</label>
                      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={fhBreast} onChange={e => setFhBreast(e.target.value.replace(/\D/g, ''))}
                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem', width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.8rem' }}>{d.withOvarian}</label>
                      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={fhOvarian} onChange={e => setFhOvarian(e.target.value.replace(/\D/g, ''))}
                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Upload Button ───────────────────────────────────────── */}
          {file && !uploading && (() => {
            const isBrca = linkUrl === "https://www.ncbi.nlm.nih.gov/nuccore/NM_007294.4?report=fasta";
            const brcaValid = patientAge && patientSex;
            const disabled = uploading || !linkUrl || (isBrca && !brcaValid);
            return (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={handleUpload}
                  className={styles.uploadBtn}
                  id="upload-submit-btn"
                  disabled={disabled}
                  style={
                    !disabled
                      ? { width: "auto", padding: "1rem 2.5rem" }
                      : { width: "auto", padding: "1rem 2.5rem", background: "rgba(100,116,139,0.1)", color: "var(--gn-text-muted)", boxShadow: "none", border: "1px solid #1e293b", cursor: "not-allowed" }
                  }
                >
                  {linkUrl ? d.uploadSubmit : d.uploadSelectRef}
                </button>
              </div>
            );
          })()}
        </>
      )}

      {/* ── Privacy Assurance ───────────────────────────────────────── */}
      <div className={styles.privacyNote}>
        <span>🔐</span>
        <p>
          {d.privacy}
        </p>
      </div>
    </div>
  );
}
