"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type UserProps = {
  firstName: string;
  lastName: string;
  email: string;
  accountCategory: string;
  phone?: string | null;
  organization?: string | null;
};

export function ProfileInfoForm({ user }: { user: UserProps }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    organization: user.organization || "",
  });

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update profile");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (isEditing) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Edit Personal Information</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              onClick={() => {
                setIsEditing(false);
                setError(null);
                setFormData({
                  firstName: user.firstName || "",
                  lastName: user.lastName || "",
                  phone: user.phone || "",
                  organization: user.organization || "",
                });
              }}
              style={{ padding: "0.4rem 0.9rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600, color: "var(--gn-text-muted)", background: "transparent", border: "1px solid var(--gn-surface-border-strong)", cursor: "pointer" }}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className={styles.editBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
        
        {error && <div style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</div>}

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>First Name</span>
            <input 
              value={formData.firstName} 
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Last Name</span>
            <input 
              value={formData.lastName} 
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Phone (Optional)</span>
            <input 
              value={formData.phone} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
              style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Organization (Optional)</span>
            <input 
              value={formData.organization} 
              onChange={e => setFormData({ ...formData, organization: e.target.value })}
              placeholder="Hospital or Institution"
              style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e293b', background: '#05080d', color: 'var(--gn-white)', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
          ✏️ Edit
        </button>
      </div>
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>First Name</span>
          <span className={styles.infoValue}>{user.firstName || "—"}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Last Name</span>
          <span className={styles.infoValue}>{user.lastName || "—"}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Email Address</span>
          <span className={styles.infoValue}>{user.email || "—"}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Account Type</span>
          <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
            {user.accountCategory || "User"}
          </span>
        </div>
        {user.phone && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Phone</span>
            <span className={styles.infoValue}>{user.phone}</span>
          </div>
        )}
        {user.organization && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Organization</span>
            <span className={styles.infoValue}>{user.organization}</span>
          </div>
        )}
      </div>
    </section>
  );
}
