"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const EN = {
  title: "Privacy & Data",
  encryption: "Data Encryption",
  encryptionDesc: "Your DNA data is encrypted at rest and in transit.",
  encryptionActive: "🔒 Active",
  sharing: "Data Sharing",
  sharingDesc: "We do not share your genetic data with third parties without your consent.",
  sharingOff: "❌ Off",
  research: "Research Contribution",
  researchDesc: "Allow your anonymized data to contribute to medical research.",
  saving: "Saving...",
  disable: "Disable",
  enable: "Enable",
  error: "Failed to update preferences",
  errorNetwork: "Error updating preferences",
};

const BN = {
  title: "গোপনীয়তা ও ডেটা",
  encryption: "ডেটা এনক্রিপশন",
  encryptionDesc: "আপনার ডিএনএ ডেটা সম্পূর্ণভাবে এনক্রিপ্ট করা হয়।",
  encryptionActive: "🔒 সক্রিয়",
  sharing: "ডেটা শেয়ারিং",
  sharingDesc: "আপনার সম্মতি ছাড়া আমরা কখনই আপনার জেনেটিক ডেটা কোনো তৃতীয় পক্ষের সাথে শেয়ার করি না।",
  sharingOff: "❌ বন্ধ",
  research: "চিকিৎসা গবেষণায় অবদান",
  researchDesc: "আপনার নামবিহীন তথ্য চিকিৎসা বিজ্ঞানের গবেষণায় অবদান রাখার জন্য অনুমতি দিন।",
  saving: "সংরক্ষণ হচ্ছে...",
  disable: "বন্ধ করুন",
  enable: "চালু করুন",
  error: "সেটিংস আপডেট করতে ব্যর্থ হয়েছে",
  errorNetwork: "সেটিংস আপডেট করার সময় ত্রুটি হয়েছে",
};

export function PrivacySettings({ initialResearchOptIn }: { initialResearchOptIn: boolean }) {
  const router = useRouter();
  const [lang, setLang] = useState("en");
  const [researchOptIn, setResearchOptIn] = useState(initialResearchOptIn);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    setLang(savedLang);

    const handleLangEvent = () => {
      const updated = localStorage.getItem("language") || "en";
      setLang(updated);
    };
    window.addEventListener("languageChange", handleLangEvent);
    return () => window.removeEventListener("languageChange", handleLangEvent);
  }, []);

  const d = lang === "bn" ? BN : EN;

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
        alert(d.error);
      }
    } catch (e) {
      alert(d.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{d.title}</h2>
      <div className={styles.privacyList}>
        <div className={styles.privacyRow}>
          <div>
            <p className={styles.privacyName}>{d.encryption}</p>
            <p className={styles.privacyDesc}>
              {d.encryptionDesc}
            </p>
          </div>
          <span className={styles.privacyBadge}>{d.encryptionActive}</span>
        </div>
        <div className={styles.privacyRow}>
          <div>
            <p className={styles.privacyName}>{d.sharing}</p>
            <p className={styles.privacyDesc}>
              {d.sharingDesc}
            </p>
          </div>
          <span className={styles.privacyBadgeOff}>{d.sharingOff}</span>
        </div>
        <div className={styles.privacyRow}>
          <div>
            <p className={styles.privacyName}>{d.research}</p>
            <p className={styles.privacyDesc}>
              {d.researchDesc}
            </p>
          </div>
          <button 
            className={styles.toggleBtn} 
            id="profile-research-toggle"
            onClick={toggleResearch}
            disabled={loading}
            style={researchOptIn ? { borderColor: 'var(--gn-primary)', color: 'var(--gn-primary)', background: 'var(--gn-primary-glow)' } : {}}
          >
            {loading ? d.saving : researchOptIn ? d.disable : d.enable}
          </button>
        </div>
      </div>
    </section>
  );
}
