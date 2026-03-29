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

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFileMock = (fileName: string, fileSize: number) => {
    const id = Date.now().toString() + Math.random().toString();
    const isInvalid = !fileName.match(/\.(fasta|fastq|vcf)$/i);
    const sizeStr = (fileSize / (1024 * 1024)).toFixed(2) + " MB";
    const type = fileName.split('.').pop()?.toUpperCase() || "UNKNOWN";

    const newFile: FileEntry = {
      id,
      name: fileName,
      size: sizeStr,
      type,
      status: "uploading",
      progress: 0
    };

    setFiles(prev => [newFile, ...prev]);

    // Mock upload progress
    let iters = 0;
    const interval = setInterval(() => {
      iters += 1;
      setFiles(prev => prev.map(f => {
        if (f.id === id) {
          if (iters >= 10) {
            clearInterval(interval);
            return { ...f, progress: 100, status: isInvalid ? "error" : "success" };
          }
          return { ...f, progress: f.progress + 10, status: iters > 7 ? "validating" : "uploading" };
        }
        return f;
      }));
    }, 400);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        processFileMock(file.name, file.size);
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        processFileMock(file.name, file.size);
      });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Upload Genomic Data</h1>
        <p className={styles.subtitle}>Securely ingest FASTA, FASTQ, or VCF files into the AI processing pipeline.</p>
      </header>

      <div className={styles.uploadSection}>
        <div 
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={styles.dropzoneContent}>
            <div className={styles.uploadIcon}>📥</div>
            <h3>Drag & Drop DNA sequences here</h3>
            <p>Supported formats: .fasta, .fastq, .vcf (Max 500MB)</p>
            <div className={styles.divider}>
              <span>OR</span>
            </div>
            <label className={styles.browseButton}>
              Browse Files
              <input 
                type="file" 
                multiple 
                accept=".fasta,.fastq,.vcf" 
                className={styles.hiddenInput}
                onChange={handleFileInput}
              />
            </label>
          </div>
        </div>
      </div>

      <div className={styles.queueSection}>
        <h2 className={styles.queueTitle}>Upload Queue</h2>
        
        {files.length === 0 ? (
          <div className={styles.emptyState}>
            ✨ Upload a DNA file to begin analysis
          </div>
        ) : (
          <div className={styles.fileList}>
            {files.map(file => (
              <div key={file.id} className={`${styles.fileCard} ${styles[`status_${file.status}`]}`}>
                <div className={styles.fileHeader}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileType}>{file.type}</span>
                    <strong className={styles.fileName}>{file.name}</strong>
                    <span className={styles.fileSize}>{file.size}</span>
                  </div>
                  <div className={styles.fileStatus}>
                    {file.status === "uploading" && <span className={styles.statusText}>Uploading {file.progress}%</span>}
                    {file.status === "validating" && <span className={styles.statusText}>Validating sequence...</span>}
                    {file.status === "success" && <span className={styles.statusSuccess}>Success ✔</span>}
                    {file.status === "error" && <span className={styles.statusError}>Error ❌ Invalid format</span>}
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
                    <p>AI validation passed. Sequence is ready for mutation analysis.</p>
                    <Link href="/dashboard/processing" className={styles.nextStepButton}>
                      Start Analysis Pipeline &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
