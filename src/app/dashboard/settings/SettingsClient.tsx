"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./page.module.css";

export interface Settings {
  emailNotifications: boolean;
  securityAlerts: boolean;
  autoAnalysis: boolean;
  dataSharing: boolean;
  theme: string;
}

interface Props {
  initialSettings: Settings;
  userName: string;
  userEmail: string;
}

export function SettingsClient({ initialSettings, userName, userEmail }: Props) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Sync theme to DOM
  useEffect(() => {
    if (settings.theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", settings.theme);
    window.dispatchEvent(new Event("themeChange"));
  }, [settings.theme]);

  function update<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(s => ({ ...s, [key]: val }));
    setDirty(true);
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function save() {
    startTransition(async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setDirty(false);
        showToast("Settings saved successfully!", "success");
      } else {
        showToast("Failed to save settings.", "error");
      }
    });
  }

  const toggles = [
    { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive email summaries for analysis completions and platform updates.", icon: "📧" },
    { key: "securityAlerts" as const, label: "Security Alerts", desc: "Get instant email alerts for suspicious login attempts or account changes.", icon: "🔔" },
    { key: "autoAnalysis" as const, label: "Auto-Analyze Uploads", desc: "Automatically process uploaded VCF/FASTA files with the AI Copilot.", icon: "🧬" },
    { key: "dataSharing" as const, label: "Anonymous Data Contribution", desc: "Share anonymized genomic markers to improve community AI models.", icon: "🌐" },
  ];

  return (
    <div className={styles.container}>
      {/* Toast */}
      {toast && <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>{toast.msg}</div>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            Platform Configuration
          </div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure your GenoNexus workspace preferences, security settings, and notification policies.</p>
        </div>
        <button className={styles.saveBtn} onClick={save} disabled={!dirty || isPending}>
          {isPending ? "Saving…" : dirty ? "💾 Save Changes" : "✓ Saved"}
        </button>
      </header>

      <div className={styles.grid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Preferences */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon} style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gn-primary)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div>
                <h2 className={styles.cardTitle}>Preferences</h2>
                <p className={styles.cardDesc}>Notifications and analysis automation settings.</p>
              </div>
            </div>

            <div className={styles.toggleList}>
              {toggles.map(t => (
                <div key={t.key} className={styles.toggleRow}>
                  <div className={styles.toggleLeft}>
                    <span className={styles.toggleIcon}>{t.icon}</span>
                    <div>
                      <div className={styles.toggleLabel}>{t.label}</div>
                      <div className={styles.toggleDesc}>{t.desc}</div>
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={settings[t.key] as boolean} onChange={e => update(t.key, e.target.checked)} />
                    <span className={styles.slider} />
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Danger Zone */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon} style={{ background: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h2 className={styles.cardTitle}>Danger Zone</h2>
                <p className={styles.cardDesc}>Irreversible actions. Proceed with caution.</p>
              </div>
            </div>
            <div className={styles.dangerActions}>
              <div className={styles.dangerRow}>
                <div>
                  <div className={styles.dangerActionTitle}>Export Audit Logs</div>
                  <div className={styles.dangerActionDesc}>Download a CSV of your full activity audit log.</div>
                </div>
                <button className={styles.dangerOutlineBtn}>Export</button>
              </div>
              <div className={styles.dangerRow}>
                <div>
                  <div className={styles.dangerActionTitle} style={{ color: "#f43f5e" }}>Delete Account</div>
                  <div className={styles.dangerActionDesc}>Permanently delete your account and all data. This cannot be undone.</div>
                </div>
                <button className={styles.dangerFillBtn} onClick={() => setShowDeleteModal(true)}>Delete</button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          {/* Account Overview */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon} style={{ background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h2 className={styles.cardTitle}>Account</h2>
                <p className={styles.cardDesc}>Signed in as</p>
              </div>
            </div>
            <div className={styles.accountInfo}>
              <div className={styles.accountAvatar}>{userName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0,2) || "GN"}</div>
              <div><div className={styles.accountName}>{userName || "—"}</div><div className={styles.accountEmail}>{userEmail}</div></div>
            </div>
          </section>

          {/* Theme */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon} style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              </div>
              <div>
                <h2 className={styles.cardTitle}>Appearance</h2>
                <p className={styles.cardDesc}>Choose your workspace theme.</p>
              </div>
            </div>
            <div className={styles.themeGrid}>
              {[
                { val: "dark",  label: "🌙 Dark",  sub: "Emerald Dark" },
                { val: "light", label: "☀️ Light", sub: "Professional Light" },
              ].map(t => (
                <button key={t.val} className={`${styles.themeTile} ${settings.theme === t.val ? styles.themeTileActive : ""}`} onClick={() => update("theme", t.val)}>
                  <div className={`${styles.themePreview} ${t.val === "dark" ? styles.previewDark : styles.previewLight}`}>
                    <div className={styles.previewBar} /><div className={styles.previewCard} /><div className={styles.previewCard} />
                  </div>
                  <div className={styles.themeLabel}>{t.label}</div>
                  <div className={styles.themeSub}>{t.sub}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Info */}
          <section className={styles.card}>
            <div className={styles.infoBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gn-primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p>All preference changes are <strong>saved to your account</strong> and will persist across devices and sessions.</p>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Account</h3>
            <p className={styles.modalDesc}>This will permanently delete your account, all uploaded files, and analysis results. This action <strong>cannot be undone</strong>.</p>
            <p className={styles.modalDesc}>Type <code className={styles.modalCode}>{userEmail}</code> to confirm:</p>
            <input className={styles.input} value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={userEmail} />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className={styles.dangerFillBtn} disabled={deleteConfirm !== userEmail}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
