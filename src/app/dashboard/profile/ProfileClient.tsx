"use client";

import { useState, useTransition } from "react";
import styles from "./page.module.css";

const ACCOUNT_CATEGORIES = [
  { value: "patient", label: "Patient" },
  { value: "caregiver", label: "Caregiver" },
  { value: "clinician", label: "Clinician" },
  { value: "researcher", label: "Researcher" },
  { value: "lab_staff", label: "Lab Staff" },
  { value: "other", label: "Other" },
];

interface Profile {
  id: string; firstName: string; lastName: string; email: string;
  accountCategory: string; bio: string; jobTitle: string;
  phone: string; organization: string; avatarUrl: string | null;
  githubId: string | null; googleId: string | null; firebaseUid: string | null;
  emailVerified: string | null; createdAt: string | null; lastLoginAt: string | null;
  dnaFilesCount: number; analysesCount: number;
}

export default function ProfileClient({ profile: initial }: { profile: Profile }) {
  const [profile, setProfile] = useState(initial);
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: initial.firstName, lastName: initial.lastName,
    bio: initial.bio, jobTitle: initial.jobTitle,
    phone: initial.phone, organization: initial.organization,
    accountCategory: initial.accountCategory,
  });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase() || "GN";
  const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—";
  const accountAge = profile.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function saveProfile() {
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, ...form }));
        setEditing(false);
        showToast("Profile updated successfully!", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update profile.", "error");
      }
    });
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) return showToast("Passwords do not match.", "error");
    if (pwForm.next.length < 8) return showToast("Password must be at least 8 characters.", "error");
    startTransition(async () => {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwForm({ current: "", next: "", confirm: "" });
        showToast("Password changed successfully!", "success");
      } else {
        showToast(data.error || "Failed to change password.", "error");
      }
    });
  }

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>{toast.msg}</div>}

      {/* Hero Header */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.avatar}>
            <span>{initials}</span>
            <div className={styles.avatarRing} />
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.heroName}>{profile.firstName} {profile.lastName}</div>
            <div className={styles.heroMeta}>
              <span className={styles.badge}>{profile.accountCategory.replace("_", " ")}</span>
              {profile.jobTitle && <span className={styles.heroJob}>{profile.jobTitle}</span>}
              {profile.organization && <span className={styles.heroOrg}>@ {profile.organization}</span>}
            </div>
            <div className={styles.heroEmail}>{profile.email}</div>
            {profile.bio && <p className={styles.heroBio}>{profile.bio}</p>}
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statCard}><span className={styles.statVal}>{profile.dnaFilesCount}</span><span className={styles.statLbl}>DNA Files</span></div>
            <div className={styles.statCard}><span className={styles.statVal}>{profile.analysesCount}</span><span className={styles.statLbl}>Analyses</span></div>
            <div className={styles.statCard}><span className={styles.statVal}>{accountAge}</span><span className={styles.statLbl}>Days Active</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["info", "security"] as const).map(tab => (
          <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "info" ? "👤 Profile Info" : "🔐 Security"}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {/* ── Profile Info Tab ── */}
        {activeTab === "info" && (
          <div className={styles.fadeIn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Personal Information</h2>
                {!editing
                  ? <button className={styles.editBtn} onClick={() => setEditing(true)}>✏️ Edit</button>
                  : <div className={styles.btnRow}>
                      <button className={styles.cancelBtn} onClick={() => { setEditing(false); setForm({ firstName: profile.firstName, lastName: profile.lastName, bio: profile.bio, jobTitle: profile.jobTitle, phone: profile.phone, organization: profile.organization, accountCategory: profile.accountCategory }); }}>Cancel</button>
                      <button className={styles.saveBtn} onClick={saveProfile} disabled={isPending}>{isPending ? "Saving…" : "💾 Save"}</button>
                    </div>
                }
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>First Name</label>
                  {editing ? <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={styles.input} /> : <div className={styles.value}>{profile.firstName || "—"}</div>}
                </div>
                <div className={styles.field}>
                  <label>Last Name</label>
                  {editing ? <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={styles.input} /> : <div className={styles.value}>{profile.lastName || "—"}</div>}
                </div>
                <div className={styles.field}>
                  <label>Email Address</label>
                  <div className={styles.value}>{profile.email} {profile.emailVerified && <span className={styles.verified}>✓ Verified</span>}</div>
                </div>
                <div className={styles.field}>
                  <label>Account Category</label>
                  {editing
                    ? <select value={form.accountCategory} onChange={e => setForm(f => ({ ...f, accountCategory: e.target.value }))} className={styles.input}>
                        {ACCOUNT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    : <div className={styles.value}>{profile.accountCategory.replace("_", " ")}</div>
                  }
                </div>
                <div className={styles.field}>
                  <label>Job Title</label>
                  {editing ? <input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} className={styles.input} placeholder="e.g. Lead Bioinformatician" /> : <div className={styles.value}>{profile.jobTitle || "—"}</div>}
                </div>
                <div className={styles.field}>
                  <label>Organization</label>
                  {editing ? <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} className={styles.input} placeholder="e.g. MIT Genomics Lab" /> : <div className={styles.value}>{profile.organization || "—"}</div>}
                </div>
                <div className={styles.field}>
                  <label>Phone</label>
                  {editing ? <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={styles.input} placeholder="+1 (555) 000-0000" /> : <div className={styles.value}>{profile.phone || "—"}</div>}
                </div>
                <div className={styles.field}>
                  <label>Member Since</label>
                  <div className={styles.value}>{joinDate}</div>
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label>Bio</label>
                  {editing
                    ? <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className={styles.textarea} rows={3} placeholder="Tell your team about yourself…" />
                    : <div className={styles.value}>{profile.bio || "—"}</div>
                  }
                </div>
              </div>
            </div>

            {/* Linked Accounts */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Linked Accounts</h2>
              <div className={styles.linkedList}>
                <div className={`${styles.linkedRow} ${profile.githubId ? styles.linkedActive : ""}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7C6.73 19.91 6.14 18 6.14 18c-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"/></svg>
                  <div><strong>GitHub</strong><span>{profile.githubId ? "Connected" : "Not connected"}</span></div>
                  <span className={profile.githubId ? styles.linkedBadge : styles.unlinkedBadge}>{profile.githubId ? "✓ Active" : "—"}</span>
                </div>
                <div className={`${styles.linkedRow} ${profile.googleId || profile.firebaseUid ? styles.linkedActive : ""}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <div><strong>Google</strong><span>{(profile.googleId || profile.firebaseUid) ? "Connected" : "Not connected"}</span></div>
                  <span className={(profile.googleId || profile.firebaseUid) ? styles.linkedBadge : styles.unlinkedBadge}>{(profile.googleId || profile.firebaseUid) ? "✓ Active" : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === "security" && (
          <div className={styles.fadeIn}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Change Password</h2>
              <p className={styles.cardDesc}>
                {!initial.githubId && !initial.googleId && !initial.firebaseUid
                  ? "Update your account password. You'll need to verify your current password first."
                  : "Set a password for direct login. You currently sign in via OAuth."}
              </p>
              <div className={styles.pwGrid}>
                {initial.githubId || initial.googleId || initial.firebaseUid
                  ? null
                  : <div className={styles.field}>
                      <label>Current Password</label>
                      <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} className={styles.input} placeholder="••••••••" />
                    </div>
                }
                <div className={styles.field}>
                  <label>New Password</label>
                  <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} className={styles.input} placeholder="Min. 8 characters" />
                </div>
                <div className={styles.field}>
                  <label>Confirm New Password</label>
                  <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} className={styles.input} placeholder="Repeat new password" />
                </div>
              </div>
              {pwForm.next && (
                <div className={styles.pwStrength}>
                  <div className={styles.pwBar}>
                    <div className={styles.pwFill} style={{ width: `${Math.min(100, (pwForm.next.length / 16) * 100)}%`, background: pwForm.next.length < 8 ? "#f43f5e" : pwForm.next.length < 12 ? "#f59e0b" : "#10b981" }} />
                  </div>
                  <span style={{ color: pwForm.next.length < 8 ? "#f43f5e" : pwForm.next.length < 12 ? "#f59e0b" : "#10b981", fontSize: "0.75rem" }}>
                    {pwForm.next.length < 8 ? "Weak" : pwForm.next.length < 12 ? "Good" : "Strong"}
                  </span>
                </div>
              )}
              <button className={styles.saveBtn} onClick={changePassword} disabled={isPending || !pwForm.next}>
                {isPending ? "Updating…" : "🔐 Update Password"}
              </button>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Account Details</h2>
              <div className={styles.detailList}>
                <div className={styles.detailRow}><span>Account ID</span><code className={styles.code}>{profile.id.substring(0, 8)}…</code></div>
                <div className={styles.detailRow}><span>Email Verified</span><span>{profile.emailVerified ? <span className={styles.verified}>✓ Verified</span> : <span className={styles.unverified}>✗ Not verified</span>}</span></div>
                <div className={styles.detailRow}><span>Member Since</span><span>{joinDate}</span></div>
                <div className={styles.detailRow}><span>OAuth Providers</span><span>{[profile.githubId && "GitHub", (profile.googleId || profile.firebaseUid) && "Google"].filter(Boolean).join(", ") || "None"}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
