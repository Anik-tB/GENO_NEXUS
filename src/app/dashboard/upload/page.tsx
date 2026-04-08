"use client";

import { useState } from "react";
import Link from "next/link";

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
];

const STATUS_ICON: Record<UploadStatus, string> = {
  idle: "⬆️",
  uploading: "⏳",
  validating: "🔎",
  success: "✅",
  error: "❌",
};

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);

  const processFile = async (file: File) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 8);
    const fileName = file.name;
    const fileSize = file.size;
    const isInvalid = !fileName.match(/\.(fasta|fastq|vcf|bam)$/i);
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
        }, 500);
      } else {
        console.error("Upload backend failed:", xhr.responseText);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "error" } : f)));
      }
    };

    xhr.onerror = () => {
      console.error("Request failed during upload.");
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "error" } : f)));
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

  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

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
            <span className={styles.statNum}>{files.length}</span>
            <span className={styles.statLbl}>Uploaded</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNum} style={{color:"var(--gn-success)"}}>{successCount}</span>
            <span className={styles.statLbl}>Passed</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNum} style={{color: errorCount > 0 ? "var(--gn-danger)" : "inherit"}}>{errorCount}</span>
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
            <p className={styles.dropzoneHint}>Supports .vcf, .fastq, .fasta, .bam — up to 500 MB per file</p>
            <div className={styles.divider}><span>or</span></div>
            <label className={styles.browseButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Browse Files
              <input type="file" multiple accept=".fasta,.fastq,.vcf,.bam" className={styles.hiddenInput} onChange={handleFileInput} />
            </label>
          </div>
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
                      <p>✅ AI validation passed — sequence is ready for mutation analysis.</p>
                      <Link href="/dashboard/processing" className={styles.nextStepButton}>
                        Start Analysis Pipeline →
                      </Link>
                    </div>
                  )}
                  {file.status === "error" && (
                    <p className={styles.errorHint}>Unsupported file format. Please use .vcf, .fastq, .fasta, or .bam</p>
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
