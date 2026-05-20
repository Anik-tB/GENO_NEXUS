"use client";

import { useCollabStats } from "@/hooks/useCollabStats";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const { streams, loading } = useCollabStats();
  const router = useRouter();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22v-4m-8.5-8.5 2.5-2.5m14.5 2.5-2.5-2.5M12 2v4M4.93 19.07l2.83-2.83M19.07 19.07l-2.83-2.83" />
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>Analysis History</h1>
            <p className={styles.subtitle}>Loading your activity trail...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <div>
          <h1 className={styles.title}>Analysis History</h1>
          <p className={styles.subtitle}>A complete record of your uploads, analyses, and system activity.</p>
        </div>
      </div>

      <div className={styles.historyList}>
        {streams.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.3, marginBottom: '1rem'}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No history found. Upload a sequence to begin your audit trail.</p>
          </div>
        ) : (
          streams.map((stream, idx) => {
            const isUpload = stream.desc.toLowerCase().includes("upload");
            const isAlert = stream.type === 'alert' || stream.desc.toLowerCase().includes("high-severity");
            
            let actionText = 'Activity';
            let iconClass = styles.iconNote;
            let iconSvg = '📝';
            let badgeClass = '';
            let badgeText = '';

            if (isUpload) {
              actionText = "Sequence Uploaded";
              iconClass = styles.iconUpload;
              iconSvg = '📤';
              badgeClass = styles.badgeUpload;
              badgeText = 'DATA';
            } else if (isAlert) {
              actionText = "Urgent Alert";
              iconClass = styles.iconAlert;
              iconSvg = '⚠️';
              badgeClass = styles.badgeAlert;
              badgeText = 'URGENT';
            } else if (stream.type === 'data') {
              actionText = "Data Operation";
              iconClass = styles.iconAnalysis;
              iconSvg = '🧬';
              badgeClass = styles.badgeAnalysis;
              badgeText = 'GENOMICS';
            } else if (stream.type === 'pipeline') {
              actionText = "Pipeline Executed";
              iconClass = styles.iconPipeline;
              iconSvg = '⚡';
            } else if (stream.desc.includes('Detected')) {
               actionText = "Sequence Analysis";
               iconClass = styles.iconAnalysis;
               iconSvg = '🧬';
               badgeClass = styles.badgeAnalysis;
               badgeText = 'GENOMICS';
            }

            return (
              <div 
                key={stream.id || idx} 
                className={styles.historyCard} 
                onClick={() => router.push(`/dashboard/collaboration/activity/${stream.id}`)} 
                title="View Full Details"
              >
                <div className={`${styles.iconWrapper} ${iconClass}`}>
                  {iconSvg}
                </div>
                <div className={styles.content}>
                  <div className={styles.action}>
                    {actionText}
                    {badgeText && <span className={`${styles.badge} ${badgeClass}`}>{badgeText}</span>}
                  </div>
                  <div className={styles.desc}>{stream.desc}</div>
                </div>
                <div className={styles.meta}>
                  <span className={styles.time}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {stream.time}
                  </span>
                  <span className={styles.statusComplete}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Logged
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
