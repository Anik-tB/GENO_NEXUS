"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export function PrivacySettings({ initialResearchOptIn }: { initialResearchOptIn: boolean }) {
  const router = useRouter();
  const [researchOptIn, setResearchOptIn] = useState(initialResearchOptIn);
  const [loading, setLoading] = useState(false);

  async function toggleResearch() {
    setLoading(true);
    const newValue = !researchOptIn;
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchOptIn: newValue }),
      });
      if (res.ok) {
        setResearchOptIn(newValue);
        router.refresh();
      } else {
        alert("Failed to update preferences");
      }
    } catch (e) {
      alert("Error updating preferences");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Privacy &amp; Data</h2>
      <div className={styles.privacyList}>
        <div className={styles.privacyRow}>
          <div>
            <p className={styles.privacyName}>Data Encryption</p>
            <p className={styles.privacyDesc}>
              Your DNA data is encrypted at rest and in transit.
            </p>
          </div>
          <span className={styles.privacyBadge}>🔒 Active</span>
        </div>
        <div className={styles.privacyRow}>
          <div>
            <p className={styles.privacyName}>Data Sharing</p>
            <p className={styles.privacyDesc}>
              We do not share your genetic data with third parties without
              your consent.
            </p>
          </div>
          <span className={styles.privacyBadgeOff}>❌ Off</span>
        </div>
        <div className={styles.privacyRow}>
          <div>
            <p className={styles.privacyName}>Research Contribution</p>
            <p className={styles.privacyDesc}>
              Allow your anonymized data to contribute to medical research.
            </p>
          </div>
          <button 
            className={styles.toggleBtn} 
            id="profile-research-toggle"
            onClick={toggleResearch}
            disabled={loading}
            style={researchOptIn ? { borderColor: 'var(--gn-primary)', color: 'var(--gn-primary)', background: 'var(--gn-primary-glow)' } : {}}
          >
            {loading ? "Saving..." : researchOptIn ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
    </section>
  );
}
