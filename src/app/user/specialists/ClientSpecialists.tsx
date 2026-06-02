"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface SpecialistRec {
  name: string;
  hospitalName: string;
  specialistType: string;
  hours: string;
  reasoning: string;
}

const BD_DOCTORS = [
  {
    name: "Prof. Dr. ABM Abdullah",
    specialistType: "Internal Medicine Specialist",
    hospitalName: "BSMMU & Central Hospital, Dhaka",
    hours: "4:00 PM - 8:00 PM (Closed on Fridays)",
    keywords: ["general", "medicine", "fever", "infection", "covid", "virus"],
    reasoning: "Renowned medicine specialist, highly recommended for overall disease management and complex internal medicine cases."
  },
  {
    name: "Dr. Tarik Alam",
    specialistType: "Infectious Disease Specialist",
    hospitalName: "Evercare Hospital, Dhaka",
    hours: "10:00 AM - 5:00 PM (Sat-Thu)",
    keywords: ["covid", "hiv", "virus", "infection", "sars"],
    reasoning: "Expert in infectious diseases, ideal for managing viral loads and severe infectious respiratory or immune-related diseases."
  },
  {
    name: "Prof. Dr. Syed Akram Hussain",
    specialistType: "Clinical Oncologist",
    hospitalName: "Square Hospital, Dhaka",
    hours: "10:00 AM - 6:00 PM",
    keywords: ["brca", "cancer", "tumor", "oncology", "breast", "prostate", "ovarian", "pancreatic"],
    reasoning: "Leading oncologist in BD, recommended for consulting on elevated cancer risks, BRCA mutations, and preventative oncology."
  },
  {
    name: "Dr. A. Q. M. Reza",
    specialistType: "Senior Cardiologist",
    hospitalName: "Evercare Hospital, Dhaka",
    hours: "11:00 AM - 4:00 PM",
    keywords: ["heart", "cardio", "vascular", "cholesterol", "blood", "pressure", "coronary"],
    reasoning: "Highly experienced cardiologist. Recommended for assessing cardiovascular risks and implementing preventative heart care."
  },
  {
    name: "Dr. Md. Ali Hossain",
    specialistType: "Pulmonologist",
    hospitalName: "Square Hospital, Dhaka",
    hours: "9:00 AM - 1:00 PM",
    keywords: ["lung", "pulmonary", "asthma", "respiratory", "covid"],
    reasoning: "Expert pulmonologist, crucial for managing potential lung complications and respiratory distress."
  },
  {
    name: "Prof. Dr. M. A. Hasanat",
    specialistType: "Endocrinologist",
    hospitalName: "BSMMU & Labaid Specialized Hospital",
    hours: "5:00 PM - 9:00 PM",
    keywords: ["diabetes", "thyroid", "endocrine", "metabolic"],
    reasoning: "Top endocrinologist, recommended for managing diabetes risks, metabolic syndromes, and hormonal imbalances."
  }
];

export default function ClientSpecialists() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SpecialistRec[]>([]);
  const [needsAnalysis, setNeedsAnalysis] = useState(false);

  useEffect(() => {
    async function fetchAndGenerate() {
      try {
        setLoading(true);
        // Step 1: Fetch predictions
        const predRes = await fetch("/api/predictions");
        const predData = await predRes.json();

        if (!predRes.ok || !predData.predictions || predData.predictions.length === 0) {
          if (predRes.status === 404 || predData.predictions?.length === 0) {
            setNeedsAnalysis(true);
          } else {
            setError("Failed to load genetic predictions.");
          }
          setLoading(false);
          return;
        }

        // Step 2: Map predictions to static doctors
        const diseaseStr = predData.predictions.map((p: any) => p.disease.toLowerCase()).join(" ");
        
        // Find matching doctors based on keywords
        let matched: SpecialistRec[] = [];
        
        for (const doc of BD_DOCTORS) {
          const isMatch = doc.keywords.some(kw => diseaseStr.includes(kw));
          if (isMatch) {
            matched.push(doc);
          }
        }
        
        // If no specific match, recommend general medicine and a pulmonologist as a safe default for genomics
        if (matched.length === 0) {
           matched = [BD_DOCTORS[0], BD_DOCTORS[4]];
        }
        
        // Limit to top 3
        setRecommendations(matched.slice(0, 3));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchAndGenerate();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Find Specialists</h1>
          <p className={styles.subtitle}>Connecting your DNA insights with top healthcare facilities in Bangladesh.</p>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Analyzing your DNA profile to find the best specialists in Bangladesh...</p>
        </div>
      </div>
    );
  }

  if (needsAnalysis) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Find Specialists</h1>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏥</span>
          <h2 className={styles.emptyTitle}>Analysis Required</h2>
          <p className={styles.emptyDesc}>We need to process your DNA results before we can recommend specific specialists and hospitals. Please upload or analyze a file first.</p>
          <Link href="/user/results" className={styles.btnPrimary}>
            Go to My Results
          </Link>
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Find Specialists</h1>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>⚠️</span>
          <h2 className={styles.emptyTitle}>Recommendation Failed</h2>
          <p className={styles.emptyDesc}>{error || "Could not generate recommendations."}</p>
          <button onClick={() => window.location.reload()} className={styles.btnPrimary}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Recommended Specialists</h1>
        <p className={styles.subtitle}>Based on your genomic analysis, we have matched you with leading medical experts in Bangladesh. Please call ahead to confirm their consultation schedules.</p>
      </div>

      <div className={styles.hospitalGrid}>
        {recommendations.map((rec, idx) => (
          <div key={idx} className={styles.hospitalCard}>
            <div className={styles.cardHeader}>
              <div className={styles.hospitalIcon}>🩺</div>
              <div className={styles.hospitalInfo}>
                <h3 className={styles.doctorName}>{rec.name}</h3>
                <p className={styles.specialistType}>{rec.specialistType}</p>
                <div className={styles.metaInfo}>
                  <p className={styles.metaItem}>🏥 {rec.hospitalName}</p>
                  <p className={styles.metaItem}>🕒 {rec.hours}</p>
                </div>
              </div>
            </div>
            <p className={styles.reasoning}>{rec.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
