"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

type UploadStatus = "idle" | "uploading" | "validating" | "success" | "error";

interface FileEntry {
  id: string;
  name: string;
  size: string;
  type: string;
  status: UploadStatus;
  progress: number;
}

const FORMAT_INFO = [
  { ext: "VCF", desc: "Variant Call Format", color: "var(--gn-primary)" },
  { ext: "FASTQ", desc: "Raw Sequencing Reads", color: "var(--gn-blue)" },
  { ext: "FASTA", desc: "Reference Sequences", color: "var(--gn-accent)" },
  { ext: "FNA", desc: "FASTA Nucleic Acid", color: "#a78bfa" },
];

const STATUS_ICON: Record<UploadStatus, string> = {
  idle: "⬆️",
  uploading: "⏳",
  validating: "🔎",
  success: "✅",
  error: "❌",
};

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [dbStats, setDbStats] = useState({ uploaded: 0, passed: 0, failed: 0 });
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  // Patient profile for clinical oncology risk calculations (CanRisk/BOADICEA)
  const [patientAge, setPatientAge] = useState<string>("40");
  const [patientSex, setPatientSex] = useState<"female" | "male">("female");
  const [fhBreast, setFhBreast] = useState<string>("0");
  const [fhOvarian, setFhOvarian] = useState<string>("0");
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientFormSubmitted, setPatientFormSubmitted] = useState(false);
  const [uploadedDbFileIds, setUploadedDbFileIds] = useState<string[]>([]); // DB IDs of successfully uploaded files
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysingStatus, setAnalysingStatus] = useState("Running genomic alignment...");

  // Detect if any uploaded file looks like BRCA/human oncology data
  const hasOncologyFile = files.some(f =>
    f.name.toLowerCase().includes("brca") ||
    f.name.toLowerCase().includes("homo_sapiens") ||
    f.name.toLowerCase().includes("human")
  );

  const buildPatientMetadata = () => ({
    age: parseInt(patientAge) || 40,
    biological_sex: patientSex,
    family_history: {
      first_degree_relatives_with_breast_cancer: parseInt(fhBreast) || 0,
      first_degree_relatives_with_ovarian_cancer: parseInt(fhOvarian) || 0,
    }
  });

  /**
   * Runs the full analysis pipeline (compare → poll → navigate).
   * This ensures the DB has a fresh completed comparison_result
   * before the predictions page reads from it.
   */
  const runAnalysisAndNavigate = async (e: React.MouseEvent, queryId: string, refId: string, targetRoute: string) => {
    e.preventDefault();
    setIsAnalysing(true);
    setAnalysingStatus("Starting genomic alignment engine...");
    try {
      // 1. Trigger the comparison
      const compRes = await fetch("/api/analysis/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryFileId: queryId, referenceFileId: refId }),
      });
      const compData = await compRes.json();
      if (!compData.success) throw new Error(compData.error || "Failed to start analysis.");

      const comparisonId = compData.comparisonId;
      setAnalysingStatus("Aligning sequences and scoring variants...");

      // 2. Poll until completed
      await new Promise<void>((resolve, reject) => {
        const pollId = setInterval(async () => {
          try {
            const sRes = await fetch(`/api/analysis/compare/${comparisonId}`);
            const sData = await sRes.json();
            if (sData.success) {
              if (sData.result.status === "completed") {
                clearInterval(pollId);
                setAnalysingStatus("Analysis complete! Loading predictions...");
                resolve();
              } else if (sData.result.status === "failed") {
                clearInterval(pollId);
                reject(new Error("Analysis engine failed."));
              }
            }
          } catch (err) {
            clearInterval(pollId);
            reject(err);
          }
        }, 1500);
      });

      // 3. Navigate to target
      router.push(targetRoute);
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
    } finally {
      setIsAnalysing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/files/list");
      const data = await res.json();
      if (data.success && data.files) {
        const uploaded = data.files.length;
        const passed = data.files.filter((f: any) => f.status === "success" || f.status === "processing").length;
        const failed = data.files.filter((f: any) => f.status === "error").length;
        setDbStats({ uploaded, passed, failed });
      }
    } catch (err) {
      console.error("Failed to fetch global stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const resolveRefAndQueryIds = async (): Promise<{ queryId: string; refId: string } | null> => {
    if (!linkUrl.trim()) return null;

    let referenceFileId = "";

    let type = "FASTA";
    if (linkUrl.toLowerCase().includes(".vcf")) type = "VCF";
    if (linkUrl.toLowerCase().includes(".fastq")) type = "FASTQ";
    if (linkUrl.toLowerCase().includes(".bam")) type = "BAM";

    const urlParts = linkUrl.split("/");
    let fileName = urlParts[urlParts.length - 1].split("?")[0] || "linked_dataset";
    if (linkUrl.includes("NC_") || linkUrl.includes("NM_")) {
      const match = linkUrl.match(/(NC|NM)_[A-Za-z0-9.]+/);
      if (match) fileName = match[0] + ".fasta";
    }

    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: linkUrl, fileName, fileType: type, visibility }),
    });
    if (!res.ok) throw new Error("Failed to link URL");
    const data = await res.json();
    referenceFileId = data.id;

    const statsRes = await fetch("/api/files/list");
    const statsData = await statsRes.json();
    const latestQuery = statsData.files?.find((f: any) => f.id !== referenceFileId && !f.storage_path.startsWith("http"));

    if (!latestQuery) return null;
    return { queryId: latestQuery.id, refId: referenceFileId };
  };

  const handleLinkSubmit = async (e: React.FormEvent | React.MouseEvent, targetRoute: string = "/dashboard/analysis") => {
    e.preventDefault();
    try {
      setIsLinking(true);
      const ids = await resolveRefAndQueryIds();
      if (ids) {
        router.push(`${targetRoute}?queryId=${ids.queryId}&refId=${ids.refId}`);
      } else {
        router.push(targetRoute);
      }
    } catch (error) {
      console.error(error);
      fetchStats();
    } finally {
      setIsLinking(false);
    }
  };


  const processFile = async (file: File) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 8);
    const fileName = file.name;
    const fileSize = file.size;
    const isInvalid = !fileName.match(/\.(fasta|fastq|vcf|bam|fna)$/i);
    const sizeStr = fileSize > 0 ? (fileSize / (1024 * 1024)).toFixed(2) + " MB" : "—";
    const type = fileName.split(".").pop()?.toUpperCase() || "UNKNOWN";

    const newFile: FileEntry = { id, name: fileName, size: sizeStr, type, status: "uploading", progress: 0 };
    setFiles((prev) => [newFile, ...prev]);

    if (isInvalid) {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "error", progress: 100 } : f)));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", type);
    formData.append("visibility", visibility);
    // Note: patientMetadata is NOT sent here — it is saved later when user confirms the patient profile form

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files", true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const currentProgress = Math.round((event.loaded / event.total) * 100);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: currentProgress } : f)));
      }
    };

    // Handle completed upload
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Capture the DB file ID returned by the backend
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.id) setUploadedDbFileIds(prev => [...prev, res.id]);
        } catch {}
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "validating", progress: 100 } : f)));
        // Simulate validation phase locally since backend saves file automatically
        setTimeout(() => {
          setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "success" } : f)));
          fetchStats(); // Update global stats
        }, 500);
      } else {
        console.error("Upload backend failed:", xhr.responseText);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "error" } : f)));
        fetchStats();
      }
    };

    xhr.onerror = () => {
      console.error("Request failed during upload.");
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "error" } : f)));
      fetchStats();
    };

    // Send the actual file payload
    xhr.send(formData);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) Array.from(e.dataTransfer.files).forEach((f) => processFile(f));
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) Array.from(e.target.files).forEach((f) => processFile(f));
  };

  // We combine the real database truth with local session errors/ongoing states
  const localErrorCount = files.filter((f) => f.status === "error").length;
  const localOngoingCount = files.filter((f) => f.status === "uploading" || f.status === "validating").length;

  const displayUploaded = dbStats.uploaded + localOngoingCount;
  const displayPassed = dbStats.passed;
  const displayFailed = dbStats.failed + localErrorCount;

  return (
    <>
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            Secure Ingest Pipeline
          </div>
          <h1 className={styles.title}>Upload Genomic Data</h1>
          <p className={styles.subtitle}>
            Securely ingest FASTA, FASTQ, VCF, or BAM files into the AI analysis pipeline. All data is encrypted in transit and at rest.
          </p>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statPill}>
            <span className={styles.statNum}>{displayUploaded}</span>
            <span className={styles.statLbl}>Uploaded</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNum} style={{color:"var(--gn-success)"}}>{displayPassed}</span>
            <span className={styles.statLbl}>Passed</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNum} style={{color: displayFailed > 0 ? "var(--gn-danger)" : "inherit"}}>{displayFailed}</span>
            <span className={styles.statLbl}>Failed</span>
          </div>
        </div>
      </header>

      {/* ── Format Info Cards ── */}
      <div className={styles.formatRow}>
        {FORMAT_INFO.map((f) => (
          <div key={f.ext} className={styles.formatCard}>
            <span className={styles.formatExt} style={{ color: f.color }}>
              .{f.ext.toLowerCase()}
            </span>
            <span className={styles.formatDesc}>{f.desc}</span>
          </div>
        ))}
        <div className={styles.formatCard}>
          <span className={styles.formatExt} style={{ color: "var(--gn-warning)" }}>.bam</span>
          <span className={styles.formatDesc}>Binary Alignment Map</span>
        </div>
        <div className={`${styles.formatCard} ${styles.maxSizeCard}`}>
          <span className={styles.maxSizeLabel}>Max Size</span>
          <span className={styles.maxSizeValue}>500 MB</span>
        </div>
      </div>

      {/* ── Visibility Toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: '12px', padding: '4px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setVisibility("private")}
            style={{ 
              padding: '0.6rem 1.25rem', 
              borderRadius: '8px', 
              border: 'none', 
              background: visibility === "private" ? '#17253d' : 'transparent', 
              color: visibility === "private" ? '#3b82f6' : '#64748b', 
              fontWeight: 600, 
              fontSize: '0.95rem',
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🔒</span> Private Dataset
          </button>
          <button
            onClick={() => setVisibility("public")}
            style={{ 
              padding: '0.6rem 1.25rem', 
              borderRadius: '8px', 
              border: 'none', 
              background: visibility === "public" ? '#17253d' : 'transparent', 
              color: visibility === "public" ? '#3b82f6' : '#64748b', 
              fontWeight: 600, 
              fontSize: '0.95rem',
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Public (Collab Nexus)
          </button>
        </div>
      </div>

      {/* ── Dropzone ── */}
      <div className={styles.uploadSection}>
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={styles.dropzoneContent}>
            <div className={styles.uploadIconBox}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <h3 className={styles.dropzoneTitle}>
              {isDragging ? "Release to upload" : "Drag & drop sequence files here"}
            </h3>
            <p className={styles.dropzoneHint}>Supports .vcf, .fastq, .fasta, .fna, .bam — up to 500 MB per file</p>
            <div className={styles.divider}><span>or</span></div>
            <label className={styles.browseButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Browse Files
              <input type="file" multiple accept=".fasta,.fastq,.vcf,.bam,.fna" className={styles.hiddenInput} onChange={handleFileInput} />
            </label>
          </div>
        </div>

        {/* ── Link Remote Dataset Component (Acts as Analysis Trigger) ── */}
        <div style={{ marginTop: "1.5rem", background: "#090e17", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#10b981", display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧬</span>
              Launch Sequence Alignment
            </h3>
          </div>

          <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
            Select an NCBI reference genome below. We will instantly compare it against the sequence you uploaded above!
          </p>

          <form onSubmit={handleLinkSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                    borderRadius: '8px',
                    border: `1px solid ${linkUrl === opt.url ? '#10b981' : '#1e293b'}`,
                    background: linkUrl === opt.url ? 'rgba(16, 185, 129, 0.05)' : '#05080d',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: linkUrl === opt.url ? '#10b981' : '#f8fafc', fontWeight: '600', fontSize: '0.95rem' }}>
                      {opt.name}
                    </span>
                    <span style={{ color: '#475569', fontSize: '0.8rem' }}>
                      {opt.desc}
                    </span>
                  </div>
                  {linkUrl === opt.url && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* ── Patient Profile Form — only shown after a BRCA file is detected ── */}
        {hasOncologyFile && (
          <div style={{ marginTop: "1.5rem", background: "#090e17", border: patientFormSubmitted ? '1px solid rgba(129, 140, 248, 0.5)' : '1px solid rgba(248, 113, 113, 0.5)', borderRadius: "16px", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)", animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#818cf8", display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span style={{ background: 'rgba(129, 140, 248, 0.15)', padding: '6px', borderRadius: '8px' }}>🧬</span>
                Patient Profile Required
                {!patientFormSubmitted && <span style={{ fontSize: '0.7rem', background: 'rgba(248,113,113,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(248,113,113,0.3)', marginLeft: '0.4rem' }}>⚠ Required for BRCA Analysis</span>}
                {patientFormSubmitted && <span style={{ fontSize: '0.7rem', background: 'rgba(129,140,248,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(129,140,248,0.3)', marginLeft: '0.4rem' }}>✓ Submitted</span>}
              </h3>
            </div>

            {!patientFormSubmitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: 'var(--gn-text-muted)', fontSize: '0.82rem', margin: 0 }}>A BRCA1 file was detected. Please fill in your patient profile below. This is required by the CanRisk/BOADICEA clinical model to calculate accurate lifetime cancer risk percentages.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>Age</label>
                    <input
                      type="number" min="18" max="90" value={patientAge}
                      onChange={e => setPatientAge(e.target.value)}
                      style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem', width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>Biological Sex</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(['female', 'male'] as const).map(s => (
                        <button key={s} onClick={() => setPatientSex(s)}
                          style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: `1px solid ${patientSex === s ? '#818cf8' : '#1e293b'}`, background: patientSex === s ? 'rgba(129,140,248,0.15)' : '#05080d', color: patientSex === s ? '#818cf8' : 'var(--gn-text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                          {s === 'female' ? '♀ Female' : '♂ Male'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(129,140,248,0.04)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: '10px', padding: '1rem' }}>
                  <p style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>Family History (First-Degree Relatives)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.8rem' }}>With Breast Cancer</label>
                      <input type="number" min="0" max="10" value={fhBreast} onChange={e => setFhBreast(e.target.value)}
                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem', width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: 'var(--gn-text-secondary)', fontSize: '0.8rem' }}>With Ovarian Cancer</label>
                      <input type="number" min="0" max="10" value={fhOvarian} onChange={e => setFhOvarian(e.target.value)}
                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const metadata = buildPatientMetadata();
                    // PATCH all uploaded BRCA file records with the actual patient data
                    await Promise.all(uploadedDbFileIds.map(fileId =>
                      fetch("/api/files", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileId, patientMetadata: metadata }),
                      })
                    ));
                    setPatientFormSubmitted(true);
                  }}
                  disabled={!patientAge || parseInt(patientAge) < 18}
                  style={{ padding: '0.8rem 1.5rem', background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s', opacity: (!patientAge || parseInt(patientAge) < 18) ? 0.5 : 1 }}
                >
                  ✓ Confirm Patient Profile
                </button>
                <p style={{ color: 'var(--gn-text-muted)', fontSize: '0.75rem', margin: 0 }}>🔒 Stored only for clinical risk modelling. Required before proceeding to predictions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#818cf8' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>Profile saved: Age {patientAge}, {patientSex === 'female' ? '♀ Female' : '♂ Male'}, {fhBreast} breast / {fhOvarian} ovarian relatives</p>
                  <button onClick={() => setPatientFormSubmitted(false)} style={{ marginTop: '0.3rem', background: 'transparent', border: 'none', color: 'var(--gn-text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>Edit profile</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Queue ── */}
      <div className={styles.queueSection}>
        <div className={styles.queueHeader}>
          <h2 className={styles.queueTitle}>Upload Queue</h2>
          {files.length > 0 && (
            <button className={styles.clearBtn} onClick={() => setFiles([])}>Clear All</button>
          )}
        </div>

        {files.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🧬</div>
            <p>No files uploaded yet. Drag a genomic file above to get started.</p>
          </div>
        ) : (
          <div className={styles.fileList}>
            {files.map((file) => (
              <div key={file.id} className={`${styles.fileCard} ${styles[`status_${file.status}`]}`}>
                <div className={styles.fileIconCol}>
                  <div className={styles.fileTypeIcon}>{STATUS_ICON[file.status]}</div>
                </div>
                <div className={styles.fileMain}>
                  <div className={styles.fileHeader}>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileType}>.{file.type.toLowerCase()}</span>
                      <strong className={styles.fileName}>{file.name}</strong>
                      <span className={styles.fileSize}>{file.size}</span>
                    </div>
                    <div className={styles.fileStatus}>
                      {file.status === "uploading" && <span className={styles.statusText}>Uploading {file.progress}%</span>}
                      {file.status === "validating" && <span className={styles.statusValidating}>Validating sequence…</span>}
                      {file.status === "success" && <span className={styles.statusSuccess}>Validation Passed</span>}
                      {file.status === "error" && <span className={styles.statusError}>Invalid Format</span>}
                    </div>
                  </div>

                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressBar} ${styles[`bar_${file.status}`]}`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>

                  {file.status === "success" && (() => {
                    const hasRef = !!linkUrl.trim();
                    const brcaBlocked = hasOncologyFile && !patientFormSubmitted;
                    return (
                      <div className={styles.nextStep}>
                        <p style={{marginBottom: "1rem"}}>✅ AI validation passed — sequence is ready for processing.</p>

                        {!hasRef && (
                          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
                            ⚠ A reference genome is required. Please select an <strong>NCBI link</strong> in the "Launch Sequence Alignment" section above before proceeding.
                          </div>
                        )}

                        {hasRef && brcaBlocked && (
                          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
                            ⚠ Please complete and confirm the <strong>Patient Profile</strong> above before proceeding to predictions.
                          </div>
                        )}

                        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                          <button
                            onClick={(e) => {
                              if (!hasRef) { alert("Please provide a reference genome link first."); return; }
                              handleLinkSubmit(e, "/dashboard/analysis");
                            }}
                            style={{ background: hasRef ? "rgba(16, 185, 129, 0.15)" : 'rgba(100,116,139,0.1)', color: hasRef ? "var(--gn-primary)" : 'var(--gn-text-muted)', border: `1px solid ${hasRef ? 'rgba(16, 185, 129, 0.3)' : '#1e293b'}`, cursor: hasRef ? "pointer" : "not-allowed", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s" }}
                          >
                            View Mutation Analysis →
                          </button>
                          <button
                            onClick={async (e) => {
                              if (!hasRef) { alert("Please provide a reference genome link first."); return; }
                              if (brcaBlocked) { alert("Please complete the Patient Profile form first. This is required for accurate BRCA cancer risk predictions."); return; }
                              const ids = await resolveRefAndQueryIds();
                              if (ids) {
                                runAnalysisAndNavigate(e, ids.queryId, ids.refId, "/dashboard/predictions");
                              } else {
                                alert("Could not resolve file IDs. Please try again.");
                              }
                            }}
                            style={{ background: (!hasRef || brcaBlocked) ? 'rgba(100,116,139,0.1)' : "rgba(59, 130, 246, 0.15)", color: (!hasRef || brcaBlocked) ? 'var(--gn-text-muted)' : "var(--gn-blue)", border: `1px solid ${(!hasRef || brcaBlocked) ? '#1e293b' : 'rgba(59, 130, 246, 0.3)'}`, cursor: (!hasRef || brcaBlocked) ? 'not-allowed' : "pointer", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s" }}
                          >
                            View Disease Predictions →
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                  {file.status === "error" && (
                    <p className={styles.errorHint}>Unsupported file format. Please use .vcf, .fastq, .fasta, .fna, or .bam</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* ── Analysis Loading Overlay ── */}
      {isAnalysing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 13, 0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ width: 64, height: 64, border: '4px solid rgba(59,130,246,0.15)', borderLeftColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#3b82f6', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Running Genomic Analysis</h2>
            <p style={{ color: 'var(--gn-text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{analysingStatus}</p>
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  );
}
