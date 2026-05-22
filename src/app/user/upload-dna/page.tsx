"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const ACCEPTED_FORMATS = [".fasta", ".fa", ".vcf", ".txt", ".zip"];
const MAX_SIZE_MB = 100;

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UploadDnaPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File) {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      return `Unsupported file type "${ext}". Please upload a FASTA, VCF, or TXT file.`;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large (${formatBytes(f.size)}). Maximum allowed size is ${MAX_SIZE_MB} MB.`;
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
  }, []);

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

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    // Simulate upload progress (will replace with real upload API)
    for (let i = 10; i <= 90; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress(i);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed. Please try again.");
      }

      setProgress(100);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setProgress(0);
    } finally {
      setUploading(false);
    }
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
          ← Back to Dashboard
        </Link>
        <h1 className={styles.title}>Upload Your DNA File</h1>
        <p className={styles.subtitle}>
          Upload your genetic data file to get started. We support files from
          23andMe, AncestryDNA, and standard FASTA / VCF formats.
        </p>
      </div>

      {done ? (
        /* ── Success State ─────────────────────────────────────────── */
        <div className={styles.successCard}>
          <span className={styles.successIcon}>✅</span>
          <h2 className={styles.successTitle}>Upload Complete!</h2>
          <p className={styles.successDesc}>
            Your DNA file <strong>{file?.name}</strong> has been securely
            uploaded. Our system is now analyzing your genetic data.
            This usually takes 2–5 minutes.
          </p>
          <div className={styles.successActions}>
            <Link href="/user/results" className={styles.btnPrimary} id="upload-view-results">
              📊 View My Results
            </Link>
            <button onClick={reset} className={styles.btnSecondary} id="upload-another">
              Upload Another File
            </button>
          </div>
        </div>
      ) : (
        <>
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
            aria-label="Drag and drop your DNA file here or click to browse"
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
                  {dragOver ? "Drop it here!" : "Drag & drop your DNA file"}
                </p>
                <p className={styles.dropHint}>
                  or <span className={styles.browseLink}>click to browse</span>
                </p>
                <div className={styles.formatBadges}>
                  {ACCEPTED_FORMATS.map((f) => (
                    <span key={f} className={styles.formatBadge}>
                      {f.toUpperCase()}
                    </span>
                  ))}
                </div>
                <p className={styles.sizeLimit}>Maximum file size: {MAX_SIZE_MB} MB</p>
              </div>
            )}
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
                <span>Uploading & encrypting your file…</span>
                <span>{progress}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={styles.progressHint}>
                Your data is being encrypted before leaving your device.
              </p>
            </div>
          )}

          {/* ── Upload Button ───────────────────────────────────────── */}
          {file && !uploading && (
            <button
              onClick={handleUpload}
              className={styles.uploadBtn}
              id="upload-submit-btn"
              disabled={uploading}
            >
              🔒 Securely Upload &amp; Analyze
            </button>
          )}
        </>
      )}

      {/* ── Format Guide ───────────────────────────────────────────── */}
      <section className={styles.formatGuide}>
        <h2 className={styles.guideTitle}>What file do I need?</h2>
        <div className={styles.guideGrid}>
          <div className={styles.guideCard}>
            <span className={styles.guideIcon}>🧪</span>
            <p className={styles.guideName}>23andMe</p>
            <p className={styles.guideDesc}>
              Go to <strong>Settings → 23andMe Data → Download</strong> and
              download your raw data as a TXT file.
            </p>
          </div>
          <div className={styles.guideCard}>
            <span className={styles.guideIcon}>🌳</span>
            <p className={styles.guideName}>AncestryDNA</p>
            <p className={styles.guideDesc}>
              Go to <strong>DNA → Settings → Download Raw DNA Data</strong> and
              download your TXT file.
            </p>
          </div>
          <div className={styles.guideCard}>
            <span className={styles.guideIcon}>🏥</span>
            <p className={styles.guideName}>Clinical / Lab</p>
            <p className={styles.guideDesc}>
              Upload standard FASTA (.fasta, .fa) or VCF (.vcf) files provided
              by your genetic testing laboratory.
            </p>
          </div>
        </div>
      </section>

      {/* ── Privacy Assurance ───────────────────────────────────────── */}
      <div className={styles.privacyNote}>
        <span>🔐</span>
        <p>
          Your DNA data is <strong>end-to-end encrypted</strong> and stored
          securely. GenoNexus never sells or shares your genetic data. You can
          delete your data at any time.
        </p>
      </div>
    </div>
  );
}
