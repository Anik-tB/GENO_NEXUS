"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export function DangerZone() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      alert("Please type DELETE to confirm.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
      });
      if (res.ok) {
        // Redirect to home/login which clears client state
        window.location.href = "/login";
      } else {
        alert("Failed to delete account");
        setLoading(false);
      }
    } catch (e) {
      alert("Error deleting account");
      setLoading(false);
    }
  }

  return (
    <section className={styles.dangerSection}>
      <h2 className={styles.sectionTitle} style={{ color: "var(--gn-danger)" }}>
        Danger Zone
      </h2>
      <div className={styles.dangerCard}>
        <div>
          <p className={styles.dangerTitle}>Delete All My Data</p>
          <p className={styles.dangerDesc}>
            Permanently delete all your uploaded DNA files, analysis results,
            and account data. This action cannot be undone.
          </p>
        </div>
        
        {!confirming ? (
          <button 
            className={styles.deleteBtn} 
            id="profile-delete-data"
            onClick={() => setConfirming(true)}
          >
            🗑️ Delete My Data
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            <input 
              type="text" 
              placeholder="Type DELETE" 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid rgba(244, 63, 94, 0.5)", background: "#05080d", color: "#fff", outline: "none", width: "160px" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={() => { setConfirming(false); setConfirmText(""); }}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", background: "transparent", border: "1px solid var(--gn-surface-border-strong)", color: "var(--gn-text-muted)", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className={styles.deleteBtn}
                disabled={loading || confirmText !== "DELETE"}
                style={{ padding: "0.4rem 0.8rem", opacity: (loading || confirmText !== "DELETE") ? 0.5 : 1 }}
              >
                {loading ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
