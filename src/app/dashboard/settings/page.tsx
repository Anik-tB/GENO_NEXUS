"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark-neon");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>System Settings</h1>
        <p className={styles.subtitle}>Configure profile, security protocols, and application preferences.</p>
      </header>

      <div className={styles.grid}>
        {/* Profile Settings */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.icon}>👤</div>
            <h2 className={styles.cardTitle}>Profile Information</h2>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input type="text" className={styles.input} defaultValue="Dr. John Doe" />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Clinical Role</label>
            <input type="text" className={styles.input} defaultValue="Lead Geneticist" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input type="email" className={styles.input} defaultValue="john.doe@genomedical.org" />
          </div>

          <button className={styles.primaryBtn}>Save Profile</button>
        </section>

        <div className={styles.sideGrid}>
          {/* Theme Settings */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.icon}>🎨</div>
              <h2 className={styles.cardTitle}>Appearance</h2>
            </div>
            
            <p className={styles.settingDesc}>Select your preferred workspace theme.</p>
            
            <div className={styles.themeSelector}>
              <label className={`${styles.themeOption} ${theme === 'dark-neon' ? styles.themeActive : ''}`}>
                <input 
                  type="radio" 
                  name="theme" 
                  value="dark-neon" 
                  checked={theme === 'dark-neon'} 
                  onChange={() => setTheme('dark-neon')}
                  className={styles.hiddenRadio}
                />
                <div className={`${styles.themePreview} ${styles.previewDarkNeon}`}></div>
                <span>Dark Neon</span>
              </label>

              <label className={`${styles.themeOption} ${theme === 'light-clinical' ? styles.themeActive : ''}`}>
                <input 
                  type="radio" 
                  name="theme" 
                  value="light-clinical" 
                  checked={theme === 'light-clinical'} 
                  onChange={() => setTheme('light-clinical')}
                  className={styles.hiddenRadio}
                />
                <div className={`${styles.themePreview} ${styles.previewLight}`}></div>
                <span>Light Clinical</span>
              </label>
            </div>
          </section>

          {/* Security Settings */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.icon}>🔒</div>
              <h2 className={styles.cardTitle}>Security & Privacy</h2>
            </div>
            
            <div className={styles.toggleRow}>
              <div>
                <strong className={styles.toggleLabel}>Multi-Factor Authentication</strong>
                <p className={styles.settingDesc}>Require biometric or token verification for login.</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={mfaEnabled} 
                  onChange={() => setMfaEnabled(!mfaEnabled)} 
                />
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
                <input 
                  type="checkbox" 
                  checked={autoAnalysis} 
                  onChange={() => setAutoAnalysis(!autoAnalysis)} 
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            
            <div className={styles.divider} />

            <button className={styles.dangerBtn}>Export Platform Audit Logs</button>
          </section>
        </div>
      </div>
    </div>
  );
}
