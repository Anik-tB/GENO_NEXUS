"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const EN = {
  title: "Danger Zone",
  deleteTitle: "Delete All My Data",
  deleteDesc: "Permanently delete all your uploaded DNA files, analysis results, and account data. This action cannot be undone.",
  deleteBtn: "🗑️ Delete My Data",
  typeDelete: "Please type DELETE to confirm.",
  deleteFail: "Failed to delete account",
  deleteError: "Error deleting account",
  placeholder: "Type DELETE",
  cancel: "Cancel",
  confirm: "Confirm",
  deleting: "Deleting...",
};

const BN = {
  title: "বিপদ অঞ্চল (Danger Zone)",
  deleteTitle: "আমার সমস্ত ডেটা মুছে ফেলুন",
  deleteDesc: "আপনার আপলোড করা সমস্ত ডিএনএ ফাইল, বিশ্লেষণের ফলাফল এবং অ্যাকাউন্ট ডেটা স্থায়ীভাবে মুছে ফেলুন। এই কাজটি আর পূর্বাবস্থায় ফেরানো যাবে না।",
  deleteBtn: "🗑️ আমার ডেটা মুছুন",
  typeDelete: "নিশ্চিত করতে অনুগ্রহ করে DELETE টাইপ করুন।",
  deleteFail: "অ্যাকাউন্ট মুছে ফেলতে ব্যর্থ হয়েছে",
  deleteError: "অ্যাকাউন্ট মুছে ফেলার সময় ত্রুটি হয়েছে",
  placeholder: "DELETE টাইপ করুন",
  cancel: "বাতিল করুন",
  confirm: "নিশ্চিত করুন",
  deleting: "মুছে ফেলা হচ্ছে...",
};

export function DangerZone() {
  const router = useRouter();
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

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

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      alert(d.typeDelete);
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
        alert(d.deleteFail);
        setLoading(false);
      }
    } catch (e) {
      alert(d.deleteError);
      setLoading(false);
    }
  }

  return (
    <section className={styles.dangerSection}>
      <h2 className={styles.sectionTitle} style={{ color: "var(--gn-danger)" }}>
        {d.title}
      </h2>
      <div className={styles.dangerCard}>
        <div>
          <p className={styles.dangerTitle}>{d.deleteTitle}</p>
          <p className={styles.dangerDesc}>
            {d.deleteDesc}
          </p>
        </div>
        
        {!confirming ? (
          <button 
            className={styles.deleteBtn} 
            id="profile-delete-data"
            onClick={() => setConfirming(true)}
          >
            {d.deleteBtn}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            <input 
              type="text" 
              placeholder={d.placeholder} 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid rgba(244, 63, 94, 0.5)", background: "#05080d", color: "#fff", outline: "none", width: "160px" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={() => { setConfirming(false); setConfirmText(""); }}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", background: "transparent", border: "1px solid var(--gn-surface-border-strong)", color: "var(--gn-text-muted)", cursor: "pointer", fontSize: "0.85rem" }}
              >
                {d.cancel}
              </button>
              <button 
                onClick={handleDelete}
                className={styles.deleteBtn}
                disabled={loading || confirmText !== "DELETE"}
                style={{ padding: "0.4rem 0.8rem", opacity: (loading || confirmText !== "DELETE") ? 0.5 : 1 }}
              >
                {loading ? d.deleting : d.confirm}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
