"use client";

import { useState } from "react";
import styles from "./page.module.css";

const API_KEYS = [
  { name: "Primary Genomics API", key: "gn_sk_••••••••••••••••3f9a", created: "2026-01-15", lastUsed: "Today" },
  { name: "Outbreak Intel Feed", key: "gn_sk_••••••••••••••••b2c7", created: "2026-02-08", lastUsed: "3 days ago" },
];

export default function SettingsPage() {
  const [mfa,         setMfa]        = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [dataSharing, setDataSharing]  = useState(false);
  const [emailAlerts, setEmailAlerts]  = useState(true);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>⚙️ Platform Configuration</div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure security protocols, notification preferences, and API integrations for your GenoNexus workspace.</p>
        </div>
        <button className={styles.saveBtn}>💾 Save Changes</button>
      </header>

      <div className={styles.grid}>
        {/* Security & Access */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Security &amp; Access</h2>
              <p className={styles.sectionDesc}>Manage authentication methods and access control policies.</p>
            </div>
          </div>

          {[
            { label: "Multi-Factor Authentication", desc: "Require biometric or token verification on login.", value: mfa, set: setMfa },
            { label: "Automated Sequence Analysis", desc: "Immediately process uploaded VCFs with the AI Copilot.", value: autoAnalysis, set: setAutoAnalysis },
            { label: "Anonymous Data Contribution", desc: "Share anonymized genomic markers to improve AI models.", value: dataSharing, set: setDataSharing },
            { label: "Security Alert Emails", desc: "Receive email alerts on suspicious login attempts.", value: emailAlerts, set: setEmailAlerts },
          ].map((row) => (
            <div key={row.label} className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <strong className={styles.toggleLabel}>{row.label}</strong>
                <p className={styles.toggleDesc}>{row.desc}</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={row.value} onChange={() => row.set(!row.value)} />
                <span className={styles.slider} />
              </label>
            </div>
          ))}

          <div className={styles.dangerZone}>
            <p className={styles.dangerTitle}>Danger Zone</p>
            <button className={styles.dangerBtn}>Export Platform Audit Logs</button>
          </div>
        </section>

        <div className={styles.sideGrid}>
          {/* Theme */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Global Theme</h2>
                <p className={styles.sectionDesc}>Workspace appearance is controlled from the top navigation bar.</p>
              </div>
            </div>
            <div className={styles.infoBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gn-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p>Click the ☀️/🌙 icon in the top navigation to switch between <strong>Emerald Dark</strong> and <strong>Professional Light</strong> modes.</p>
            </div>
            <div className={styles.themePreview}>
              <div className={styles.themeSwatch + " " + styles.swatchDark}>Dark</div>
              <div className={styles.themeSwatch + " " + styles.swatchLight}>Light</div>
            </div>
          </section>

          {/* API Keys */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              </div>
              <div>
                <h2 className={styles.sectionTitle}>API Integrations</h2>
                <p className={styles.sectionDesc}>Manage active API keys for external bioinformatics pipelines.</p>
              </div>
            </div>
            <div className={styles.keyList}>
              {API_KEYS.map((k) => (
                <div key={k.name} className={styles.keyRow}>
                  <div className={styles.keyInfo}>
                    <strong className={styles.keyName}>{k.name}</strong>
                    <code className={styles.keyValue}>{k.key}</code>
                    <span className={styles.keyMeta}>Created {k.created} · Last used {k.lastUsed}</span>
                  </div>
                  <button className={styles.revokeBtn}>Revoke</button>
                </div>
              ))}
            </div>
            <button className={styles.generateBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Generate New Key
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
