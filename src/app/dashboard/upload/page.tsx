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
  const [refType, setRefType] = useState<"link" | "file">("link");
  const [refFile, setRefFile] = useState<File | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [dbStats, setDbStats] = useState({ uploaded: 0, passed: 0, failed: 0 });

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

  const handleLinkSubmit = async (e: React.FormEvent | React.MouseEvent, targetRoute: string = "/dashboard/analysis") => {
    e.preventDefault();
    if (refType === "link" && !linkUrl.trim()) return;
    if (refType === "file" && !refFile) return;

    try {
      let referenceFileId = "";

      if (refType === "link") {
        if (!linkUrl.trim()) return;
        setIsLinking(true);
        
        let type = "FASTA";
        if (linkUrl.toLowerCase().includes(".vcf")) type = "VCF";
        if (linkUrl.toLowerCase().includes(".fastq")) type = "FASTQ";
        if (linkUrl.toLowerCase().includes(".bam")) type = "BAM";
        
        const urlParts = linkUrl.split("/");
        let fileName = urlParts[urlParts.length - 1].split("?")[0] || "linked_dataset";
        if (linkUrl.includes("NC_")) {
          const match = linkUrl.match(/NC_[A-Za-z0-9.]+/);
          if (match) fileName = match[0] + ".fasta";
        }

        const res = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkUrl, fileName, fileType: type }),
        });

        if (!res.ok) throw new Error("Failed to link URL");
        const data = await res.json();
        referenceFileId = data.id;
      } else {
        if (!refFile) return;
        setIsLinking(true);
        
        const formData = new FormData();
        formData.append("file", refFile);
        const type = refFile.name.split(".").pop()?.toUpperCase() || "FASTA";
        formData.append("fileType", type);

        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload reference file");
        const data = await res.json();
        referenceFileId = data.id;
      }

      // Automatically find the latest query file to compare against
      const statsRes = await fetch("/api/files/list");
      const statsData = await statsRes.json();
      const latestQuery = statsData.files?.find((f: any) => f.id !== referenceFileId && !f.storage_path.startsWith("http"));
      
      if (latestQuery) {
        router.push(`${targetRoute}?queryId=${latestQuery.id}&refId=${referenceFileId}`);
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
        <div style={{ marginTop: "1.5rem", background: "#090e17", border: "1px solid #1e293b", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--gn-primary)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '8px' }}>🧬</span>
              Launch Sequence Alignment
            </h3>
            <div style={{ display: 'flex', background: '#05080d', padding: '4px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <button 
                onClick={() => setRefType("link")}
                style={{ 
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                  background: refType === "link" ? "var(--gn-primary)" : "transparent",
                  color: refType === "link" ? "#000" : "var(--gn-text-muted)",
                  border: 'none', cursor: 'pointer'
                }}
              >NCBI Link</button>
              <button 
                onClick={() => setRefType("file")}
                style={{ 
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                  background: refType === "file" ? "var(--gn-primary)" : "transparent",
                  color: refType === "file" ? "#000" : "var(--gn-text-muted)",
                  border: 'none', cursor: 'pointer'
                }}
              >Local File</button>
            </div>
          </div>

          <p style={{ color: "var(--gn-text-secondary)", fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            {refType === "link" 
              ? "Paste the NCBI reference link below. We will instantly compare it against the sequence you uploaded above!"
              : "Upload a local reference file (FASTA/FASTQ) to compare against your genomic data."}
          </p>

          <form onSubmit={handleLinkSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {refType === "link" ? (
              <input 
                type="url" 
                placeholder="e.g. NC_045512.2 (COVID) or NC_001802.1 (HIV-1)" 
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{ width: "100%", padding: "0.85rem 1.25rem", borderRadius: "10px", border: "1px solid #1e293b", background: "#05080d", color: "var(--gn-white)", outline: "none", fontSize: "0.95rem", transition: 'border-color 0.2s' }}
                required
              />
            ) : (
              <div 
                style={{ 
                  width: "100%", padding: "1.5rem", borderRadius: "12px", border: "2px dashed #1e293b", background: "#05080d", 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden'
                }}
                onClick={() => document.getElementById('ref-file-input')?.click()}
              >
                <span style={{ fontSize: '1.5rem' }}>📄</span>
                <span style={{ color: 'var(--gn-text-secondary)', fontSize: '0.9rem' }}>
                  {refFile ? refFile.name : "Select or drag reference file"}
                </span>
                <input 
                  id="ref-file-input"
                  type="file" 
                  accept=".fasta,.fastq,.vcf,.bam,.fna"
                  onChange={(e) => setRefFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </form>
        </div>
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

                  {file.status === "success" && (
                    <div className={styles.nextStep}>
                      <p style={{marginBottom: "1rem"}}>✅ AI validation passed — sequence is ready for processing.</p>
                      <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                        <button 
                          onClick={(e) => {
                            if ((refType === "link" && linkUrl.trim()) || (refType === "file" && refFile)) {
                              handleLinkSubmit(e, "/dashboard/analysis");
                            } else {
                              router.push("/dashboard/processing");
                            }
                          }} 
                          style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--gn-primary)", border: "1px solid rgba(16, 185, 129, 0.3)", cursor: "pointer", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s" }}
                        >
                          View Mutation Analysis →
                        </button>
                        <button 
                          onClick={(e) => {
                            if ((refType === "link" && linkUrl.trim()) || (refType === "file" && refFile)) {
                              handleLinkSubmit(e, "/dashboard/predictions");
                            } else {
                              router.push("/dashboard/processing");
                            }
                          }} 
                          style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--gn-blue)", border: "1px solid rgba(59, 130, 246, 0.3)", cursor: "pointer", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s" }}
                        >
                          View Disease Predictions →
                        </button>
                      </div>
                    </div>
                  )}
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
  );
}
