"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function SettingsPage() {
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Platform Settings</h1>
        <p className={styles.subtitle}>Configure global application preferences and security protocols.</p>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.icon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h2 className={styles.cardTitle}>Security & Access</h2>
          </div>
          
          <div className={styles.toggleRow}>
            <div>
              <strong className={styles.toggleLabel}>Multi-Factor Authentication</strong>
              <p className={styles.settingDesc}>Require biometric or token verification for login.</p>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" checked={mfaEnabled} onChange={() => setMfaEnabled(!mfaEnabled)} />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.divider} />

          <div className={styles.toggleRow}>
            <div>
              <strong className={styles.toggleLabel}>Automated Sequence Analysis</strong>
              <p className={styles.settingDesc}>Immediately process uploaded VCFs with AI Copilot.</p>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" checked={autoAnalysis} onChange={() => setAutoAnalysis(!autoAnalysis)} />
              <span className={styles.slider}></span>
            </label>
          </div>
          
          <div className={styles.divider} />
          
          <div className={styles.toggleRow}>
            <div>
              <strong className={styles.toggleLabel}>Anonymous Data Contribution</strong>
              <p className={styles.settingDesc}>Share anonymized genomic markers to improve the AI model.</p>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" checked={dataSharing} onChange={() => setDataSharing(!dataSharing)} />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.divider} />

          <button className={styles.dangerBtn}>Export Platform Audit Logs</button>
        </section>

        <div className={styles.sideGrid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.icon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              </div>
              <h2 className={styles.cardTitle}>Global Theme</h2>
            </div>
            <p className={styles.settingDesc}>
              Workspace visual themes are linked globally via your profile top-bar. 
            </p>
            <div className={styles.infoBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gn-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <p>Click the Sun/Moon icon in your top navigation menu to switch between our custom Emerald Dark and Professional Light modes automatically.</p>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.icon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </div>
              <h2 className={styles.cardTitle}>API Integrations</h2>
            </div>
            <p className={styles.settingDesc}>Manage active API keys for external bioinformatics pipelines.</p>
            <button className={styles.primaryBtn} style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
              Generate New Key
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
