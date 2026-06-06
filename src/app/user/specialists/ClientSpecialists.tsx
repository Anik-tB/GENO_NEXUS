"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface SpecialistRec {
  name: string;
  nameBn: string;
  hospitalName: string;
  hospitalNameBn: string;
  specialistType: string;
  specialistTypeBn: string;
  hours: string;
  hoursBn: string;
  reasoning: string;
  reasoningBn: string;
}

const BD_DOCTORS = [
  {
    name: "Prof. Dr. ABM Abdullah",
    nameBn: "অধ্যাপক ড. এ বি এম আব্দুল্লাহ",
    specialistType: "Internal Medicine Specialist",
    specialistTypeBn: "ইন্টারনাল মেডিসিন বিশেষজ্ঞ",
    hospitalName: "BSMMU & Central Hospital, Dhaka",
    hospitalNameBn: "বিএসএমএমইউ ও সেন্ট্রাল হাসপাতাল, ঢাকা",
    hours: "4:00 PM - 8:00 PM (Closed on Fridays)",
    hoursBn: "বিকাল ৪:০০ - রাত ৮:০০ (শুক্রবার বন্ধ)",
    keywords: ["general", "medicine", "fever", "infection", "covid", "virus"],
    reasoning:
      "Renowned medicine specialist, highly recommended for overall disease management and complex internal medicine cases.",
    reasoningBn:
      "বিশিষ্ট মেডিসিন বিশেষজ্ঞ, সামগ্রিক রোগ ব্যবস্থাপনা এবং জটিল অভ্যন্তরীণ মেডিসিন কেসগুলোর জন্য অত্যন্ত সুপারিশকৃত।",
  },
  {
    name: "Dr. Tarik Alam",
    nameBn: "ড. তারিক আলম",
    specialistType: "Infectious Disease Specialist",
    specialistTypeBn: "ইনফেকশাস ডিজিজ (সংক্রামক রোগ) বিশেষজ্ঞ",
    hospitalName: "Evercare Hospital, Dhaka",
    hospitalNameBn: "এভারকেয়ার হাসপাতাল, ঢাকা",
    hours: "10:00 AM - 5:00 PM (Sat-Thu)",
    hoursBn: "সকাল ১০:০০ - বিকাল ৫:০০ (শনি-বৃহস্পতি)",
    keywords: ["covid", "hiv", "virus", "infection", "sars"],
    reasoning:
      "Expert in infectious diseases, ideal for managing viral loads and severe infectious respiratory or immune-related diseases.",
    reasoningBn:
      "সংক্রামক রোগ বিশেষজ্ঞ, ভাইরাল লোড ও ফুসফুসজনিত বা প্রতিরোধ ক্ষমতা সম্পর্কিত জটিল সংক্রামক ব্যাধি ব্যবস্থাপনায় অত্যন্ত দক্ষ।",
  },
  {
    name: "Prof. Dr. Syed Akram Hussain",
    nameBn: "অধ্যাপক ড. সৈয়দ আকরাম হোসেন",
    specialistType: "Clinical Oncologist",
    specialistTypeBn: "ক্লিনিক্যাল অনকোলজিস্ট",
    hospitalName: "Square Hospital, Dhaka",
    hospitalNameBn: "স্কয়ার হাসপাতাল, ঢাকা",
    hours: "10:00 AM - 6:00 PM",
    hoursBn: "সকাল ১০:০০ - সন্ধ্যা ৬:০০",
    keywords: [
      "brca",
      "cancer",
      "tumor",
      "oncology",
      "breast",
      "prostate",
      "ovarian",
      "pancreatic",
    ],
    reasoning:
      "Leading oncologist in BD, recommended for consulting on elevated cancer risks, BRCA mutations, and preventative oncology.",
    reasoningBn:
      "বাংলাদেশের শীর্ষস্থানীয় ক্যান্সার বিশেষজ্ঞ, ক্যান্সারের ঝুঁকি, BRCA মিউটেশন এবং প্রতিরোধমূলক অনকোলজি পরামর্শের জন্য অত্যন্ত সুপারিশকৃত।",
  },
  {
    name: "Dr. A. Q. M. Reza",
    nameBn: "ড. এ. কিউ. এম. রেজা",
    specialistType: "Senior Cardiologist",
    specialistTypeBn: "সিনিয়র কার্ডিওলজিস্ট",
    hospitalName: "Evercare Hospital, Dhaka",
    hospitalNameBn: "এভারকেয়ার হাসপাতাল, ঢাকা",
    hours: "11:00 AM - 4:00 PM",
    hoursBn: "সকাল ১১:০০ - বিকাল ৪:০০",
    keywords: [
      "heart",
      "cardio",
      "vascular",
      "cholesterol",
      "blood",
      "pressure",
      "coronary",
    ],
    reasoning:
      "Highly experienced cardiologist. Recommended for assessing cardiovascular risks and implementing preventative heart care.",
    reasoningBn:
      "দীর্ঘ অভিজ্ঞ কার্ডিওলজিস্ট। কার্ডিওভাসকুলার বা হৃদরোগের ঝুঁকি মূল্যায়ন এবং প্রতিরোধমূলক হার্ট কেয়ারের জন্য উপযুক্ত।",
  },
  {
    name: "Dr. Md. Ali Hossain",
    nameBn: "ড. মো. আলী হোসেন",
    specialistType: "Pulmonologist",
    specialistTypeBn: "পালমোনোলজিস্ট (বক্ষব্যাধি ও ফুসফুস বিশেষজ্ঞ)",
    hospitalName: "Square Hospital, Dhaka",
    hospitalNameBn: "স্কয়ার হাসপাতাল, ঢাকা",
    hours: "9:00 AM - 1:00 PM",
    hoursBn: "সকাল ৯:০০ - দুপুর ১:০০",
    keywords: ["lung", "pulmonary", "asthma", "respiratory", "covid"],
    reasoning:
      "Expert pulmonologist, crucial for managing potential lung complications and respiratory distress.",
    reasoningBn:
      "ফুসফুস ও বক্ষব্যাধি বিশেষজ্ঞ, শ্বাসকষ্টের সমস্যা এবং ভাইরাল সংক্রমণজনিত ফুসফুসের জটিলতা নিয়ন্ত্রণে দক্ষ।",
  },
  {
    name: "Prof. Dr. M. A. Hasanat",
    nameBn: "অধ্যাপক ড. এম. এ. হাসানাত",
    specialistType: "Endocrinologist",
    specialistTypeBn: "এন্ডোক্রিনোলজিস্ট (হরমোন ও ডায়াবেটিস বিশেষজ্ঞ)",
    hospitalName: "BSMMU & Labaid Specialized Hospital",
    hospitalNameBn: "বিএসএমএমইউ এবং ল্যাবএইড স্পেশালাইজড হাসপাতাল, ঢাকা",
    hours: "5:00 PM - 9:00 PM",
    hoursBn: "বিকাল ৫:০০ - রাত ৯:০০",
    keywords: ["diabetes", "thyroid", "endocrine", "metabolic"],
    reasoning:
      "Top endocrinologist, recommended for managing diabetes risks, metabolic syndromes, and hormonal imbalances.",
    reasoningBn:
      "বিশিষ্ট হরমোন বিশেষজ্ঞ, ডায়াবেটিসের ঝুঁকি, বিপাকীয় সমস্যা (Metabolic Syndrome) এবং হরমোনের ভারসাম্যহীনতা নিয়ন্ত্রণে অত্যন্ত সুপারিশকৃত।",
  },
];

const EN = {
  title: "Recommended Specialists",
  subtitle:
    "Based on your genomic analysis, we have matched you with leading medical experts in Bangladesh. Please call ahead to confirm their consultation schedules.",
  loadingText:
    "Analyzing your DNA profile to find the best specialists in Bangladesh...",
  analysisRequired: "Analysis Required",
  analysisRequiredDesc:
    "We need to process your DNA results before we can recommend specific specialists and hospitals. Please upload or analyze a file first.",
  resultsBtn: "Go to My Results",
  failedTitle: "Recommendation Failed",
  retryBtn: "Retry Request",
};

const BN = {
  title: "সুপারিশকৃত বিশেষজ্ঞ চিকিৎসকমণ্ডলী",
  subtitle:
    "আপনার ডিএনএ বিশ্লেষণের উপর ভিত্তি করে, আমরা আপনাকে বাংলাদেশের শীর্ষস্থানীয় চিকিৎসা বিশেষজ্ঞদের সাথে মেল মিলিয়েছি। অনুগ্রহ করে তাদের অ্যাপয়েন্টমেন্ট সময় নিশ্চিত করতে আগে যোগাযোগ করুন।",
  loadingText:
    "আপনার জন্য সেরা বিশেষজ্ঞদের খুঁজে পেতে আপনার ডিএনএ প্রোফাইল বিশ্লেষণ করা হচ্ছে...",
  analysisRequired: "বিশ্লেষণ প্রয়োজন",
  analysisRequiredDesc:
    "আমরা আপনাকে নির্দিষ্ট বিশেষজ্ঞ ও হাসপাতালগুলোর সুপারিশ করার আগে আপনার ডিএনএ ফলাফল প্রক্রিয়া করা প্রয়োজন। অনুগ্রহ করে প্রথমে একটি ফাইল আপলোড বা বিশ্লেষণ করুন।",
  resultsBtn: "আমার ফলাফলে যান",
  failedTitle: "সুপারিশ লোড করতে ব্যর্থ",
  retryBtn: "পুনরায় চেষ্টা করুন",
};

export default function ClientSpecialists({
  userRole = "patient",
}: {
  userRole?: string;
}) {
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SpecialistRec[]>([]);
  const [needsAnalysis, setNeedsAnalysis] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referring, setReferring] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [bookingDoctor, setBookingDoctor] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [bookingLoading, setBookingLoading] = useState(false);

  const isCoordinator = userRole === "caregiver";

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

  useEffect(() => {
    async function fetchAndGenerate() {
      try {
        setLoading(true);
        // Step 1: Fetch predictions
        const predRes = await fetch("/api/predictions");
        const predData = await predRes.json();

        if (
          !predRes.ok ||
          !predData.predictions ||
          predData.predictions.length === 0
        ) {
          if (predRes.status === 404 || predData.predictions?.length === 0) {
            setNeedsAnalysis(true);
          } else {
            setError("Failed to load genetic predictions.");
          }
          setLoading(false);
          return;
        }

        if (predData.meta?.patientId) {
          setPatientId(predData.meta.patientId);
        }

        // Step 2: Map predictions to static doctors
        const diseaseStr = predData.predictions
          .map((p: any) => p.disease.toLowerCase())
          .join(" ");

        // Find matching doctors based on keywords
        let matched: SpecialistRec[] = [];

        for (const doc of BD_DOCTORS) {
          const isMatch = doc.keywords.some((kw) => diseaseStr.includes(kw));
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

  useEffect(() => {
    if (isCoordinator && !patientId) return;

    async function fetchReferrals() {
      try {
        const url = isCoordinator
          ? `/api/specialist-referrals?patientId=${patientId}`
          : "/api/specialist-referrals";
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.referrals) {
          setReferrals(data.referrals);
        }
      } catch (e) {}
    }
    fetchReferrals();
  }, [patientId, isCoordinator]);

  useEffect(() => {
    if (!isCoordinator) {
      async function fetchAppointments() {
        try {
          const res = await fetch("/api/appointments");
          const data = await res.json();
          if (data.success && data.appointments) {
            setAppointments(data.appointments);
          }
        } catch (e) {}
      }
      fetchAppointments();
    }
  }, [isCoordinator]);

  const openBookingModal = (doctor: {
    name: string;
    specialistType: string;
    hospitalName: string;
  }) => {
    setBookingDoctor(doctor);
    setBookingDate("");
    setBookingTime("10:00 AM");
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor || !bookingDate || !bookingTime) return;

    setBookingLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: bookingDoctor.name,
          specialistType: bookingDoctor.specialistType,
          hospitalName: bookingDoctor.hospitalName,
          date: bookingDate,
          time: bookingTime,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) => [...prev, data.appointment]);
        alert(
          lang === "bn"
            ? "অ্যাপয়েন্টমেন্ট সফলভাবে বুক করা হয়েছে!"
            : "Appointment successfully booked!",
        );
        setBookingDoctor(null);
      } else {
        alert(data.error || "Failed to book appointment");
      }
    } catch (e) {
      console.error(e);
      alert("Error booking appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRefer = async (rec: SpecialistRec) => {
    if (!patientId && isCoordinator) return;
    setReferring(rec.name);
    try {
      const res = await fetch("/api/specialist-referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          specialistName: rec.name,
          specialistType: rec.specialistType,
          hospitalName: rec.hospitalName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReferrals((prev) => [data.referral, ...prev]);
        alert(
          lang === "bn"
            ? "রেফারেল সফলভাবে তৈরি হয়েছে!"
            : "Referral successfully created!",
        );
      } else {
        alert(data.error || "Failed to refer");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReferring(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{d.title}</h1>
          <p className={styles.subtitle}>{d.subtitle}</p>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>{d.loadingText}</p>
        </div>
      </div>
    );
  }

  if (needsAnalysis) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{d.title}</h1>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏥</span>
          <h2 className={styles.emptyTitle}>{d.analysisRequired}</h2>
          <p className={styles.emptyDesc}>{d.analysisRequiredDesc}</p>
          <Link href="/user/results" className={styles.btnPrimary}>
            {d.resultsBtn}
          </Link>
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{d.title}</h1>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>⚠️</span>
          <h2 className={styles.emptyTitle}>{d.failedTitle}</h2>
          <p className={styles.emptyDesc}>
            {error || "Could not generate recommendations."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className={styles.btnPrimary}
          >
            {d.retryBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{d.title}</h1>
        <p className={styles.subtitle}>{d.subtitle}</p>
      </div>

      {!isCoordinator && referrals.length > 0 && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#10b981",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>📋</span>{" "}
            {lang === "bn"
              ? "আপনার কেয়ার কোঅর্ডিনেটরের রেফারেল"
              : "Referrals from your Care Coordinator"}
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {referrals.map((ref, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem 0",
                      color: "#fff",
                      fontSize: "1rem",
                    }}
                  >
                    {ref.specialist_name}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--gn-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {ref.specialist_type} • {ref.hospital_name}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      background: "#10b981",
                      color: "#000",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                    }}
                  >
                    {lang === "bn" ? "রেফার করা হয়েছে" : "Referred"}
                  </span>
                  <button
                    onClick={() =>
                      openBookingModal({
                        name: ref.specialist_name,
                        specialistType: ref.specialist_type,
                        hospitalName: ref.hospital_name,
                      })
                    }
                    disabled={appointments.some(
                      (a) => a.doctor_name === ref.specialist_name,
                    )}
                    style={{
                      background: appointments.some(
                        (a) => a.doctor_name === ref.specialist_name,
                      )
                        ? "rgba(14, 165, 233, 0.2)"
                        : "var(--gn-blue)",
                      color: appointments.some(
                        (a) => a.doctor_name === ref.specialist_name,
                      )
                        ? "#0ea5e9"
                        : "#fff",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: appointments.some(
                        (a) => a.doctor_name === ref.specialist_name,
                      )
                        ? "default"
                        : "pointer",
                    }}
                  >
                    {appointments.some(
                      (a) => a.doctor_name === ref.specialist_name,
                    )
                      ? lang === "bn"
                        ? "বুকড"
                        : "Booked"
                      : lang === "bn"
                        ? "অ্যাপয়েন্টমেন্ট বুক করুন"
                        : "Book Appointment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isCoordinator && appointments.length > 0 && (
        <div
          style={{
            background: "rgba(14, 165, 233, 0.1)",
            border: "1px solid rgba(14, 165, 233, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#0ea5e9",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>📅</span>{" "}
            {lang === "bn"
              ? "আপনার বুক করা অ্যাপয়েন্টমেন্টসমূহ"
              : "Your Scheduled Appointments"}
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {appointments.map((appt, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem 0",
                      color: "#fff",
                      fontSize: "1rem",
                    }}
                  >
                    {appt.doctor_name}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--gn-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {appt.specialist_type} • {appt.hospital_name}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      background: "#0ea5e9",
                      color: "#000",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      display: "inline-block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {lang === "bn" ? "বুকড" : "Scheduled"}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--gn-text-secondary)",
                    }}
                  >
                    {new Date(appt.appointment_date).toLocaleDateString(
                      lang === "bn" ? "bn-BD" : "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}{" "}
                    at {appt.appointment_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.hospitalGrid}>
        {recommendations.map((rec, idx) => (
          <div key={idx} className={styles.hospitalCard}>
            <div className={styles.cardHeader}>
              <div className={styles.hospitalIcon}>🩺</div>
              <div className={styles.hospitalInfo}>
                <h3 className={styles.doctorName}>
                  {lang === "bn" ? rec.nameBn : rec.name}
                </h3>
                <p className={styles.specialistType}>
                  {lang === "bn" ? rec.specialistTypeBn : rec.specialistType}
                </p>
                <div className={styles.metaInfo}>
                  <p className={styles.metaItem}>
                    🏥 {lang === "bn" ? rec.hospitalNameBn : rec.hospitalName}
                  </p>
                  <p className={styles.metaItem}>
                    🕒 {lang === "bn" ? rec.hoursBn : rec.hours}
                  </p>
                </div>
              </div>
              {isCoordinator && (
                <div style={{ marginLeft: "auto", alignSelf: "flex-start" }}>
                  <button
                    onClick={() => handleRefer(rec)}
                    disabled={
                      referring === rec.name ||
                      referrals.some((r) => r.specialist_name === rec.name)
                    }
                    style={{
                      background: referrals.some(
                        (r) => r.specialist_name === rec.name,
                      )
                        ? "rgba(16, 185, 129, 0.2)"
                        : "var(--gn-primary)",
                      color: referrals.some(
                        (r) => r.specialist_name === rec.name,
                      )
                        ? "#10b981"
                        : "#000",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: referrals.some(
                        (r) => r.specialist_name === rec.name,
                      )
                        ? "default"
                        : "pointer",
                      opacity: referring === rec.name ? 0.7 : 1,
                    }}
                  >
                    {referrals.some((r) => r.specialist_name === rec.name)
                      ? lang === "bn"
                        ? "রেফার করা হয়েছে"
                        : "Referred"
                      : referring === rec.name
                        ? lang === "bn"
                          ? "অপেক্ষা করুন..."
                          : "Referring..."
                        : lang === "bn"
                          ? "রোগীকে রেফার করুন"
                          : "Refer Patient"}
                  </button>
                </div>
              )}
              {!isCoordinator && (
                <div style={{ marginLeft: "auto", alignSelf: "flex-start" }}>
                  <button
                    onClick={() =>
                      openBookingModal({
                        name: lang === "bn" ? rec.nameBn : rec.name,
                        specialistType:
                          lang === "bn"
                            ? rec.specialistTypeBn
                            : rec.specialistType,
                        hospitalName:
                          lang === "bn" ? rec.hospitalNameBn : rec.hospitalName,
                      })
                    }
                    disabled={appointments.some(
                      (a) =>
                        a.doctor_name ===
                        (lang === "bn" ? rec.nameBn : rec.name),
                    )}
                    style={{
                      background: appointments.some(
                        (a) =>
                          a.doctor_name ===
                          (lang === "bn" ? rec.nameBn : rec.name),
                      )
                        ? "rgba(14, 165, 233, 0.2)"
                        : "var(--gn-blue)",
                      color: appointments.some(
                        (a) =>
                          a.doctor_name ===
                          (lang === "bn" ? rec.nameBn : rec.name),
                      )
                        ? "#0ea5e9"
                        : "#fff",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: appointments.some(
                        (a) =>
                          a.doctor_name ===
                          (lang === "bn" ? rec.nameBn : rec.name),
                      )
                        ? "default"
                        : "pointer",
                    }}
                  >
                    {appointments.some(
                      (a) =>
                        a.doctor_name ===
                        (lang === "bn" ? rec.nameBn : rec.name),
                    )
                      ? lang === "bn"
                        ? "বুকড"
                        : "Booked"
                      : lang === "bn"
                        ? "অ্যাপয়েন্টমেন্ট বুক করুন"
                        : "Book Appointment"}
                  </button>
                </div>
              )}
            </div>
            <p className={styles.reasoning}>
              {lang === "bn" ? rec.reasoningBn : rec.reasoning}
            </p>
          </div>
        ))}
      </div>

      {bookingDoctor && (
        <div
          onClick={() => setBookingDoctor(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--gn-surface)",
              border: "1px solid var(--gn-surface-border)",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "450px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                margin: "0 0 0.5rem 0",
                color: "#fff",
                fontSize: "1.25rem",
                fontWeight: "800",
              }}
            >
              {lang === "bn"
                ? "অ্যাপয়েন্টমেন্ট নির্ধারণ করুন"
                : "Schedule Appointment"}
            </h3>
            <p
              style={{
                margin: "0 0 1.5rem 0",
                color: "var(--gn-text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              {lang === "bn"
                ? `${bookingDoctor.name} (${bookingDoctor.specialistType}) এর সাথে অ্যাপয়েন্টমেন্ট বুক করুন।`
                : `Book an appointment with ${bookingDoctor.name} (${bookingDoctor.specialistType}).`}
            </p>

            <form
              onSubmit={handleBookAppointment}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--gn-text-muted)",
                    fontWeight: "600",
                  }}
                >
                  {lang === "bn" ? "তারিখ নির্বাচন করুন" : "Select Date"}
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--gn-surface-border-strong)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--gn-text-muted)",
                    fontWeight: "600",
                  }}
                >
                  {lang === "bn" ? "সময় নির্বাচন করুন" : "Select Time Slot"}
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--gn-surface-border-strong)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option style={{ background: "#111" }} value="10:00 AM">
                    10:00 AM
                  </option>
                  <option style={{ background: "#111" }} value="11:00 AM">
                    11:00 AM
                  </option>
                  <option style={{ background: "#111" }} value="12:00 PM">
                    12:00 PM
                  </option>
                  <option style={{ background: "#111" }} value="02:00 PM">
                    02:00 PM
                  </option>
                  <option style={{ background: "#111" }} value="03:00 PM">
                    03:00 PM
                  </option>
                  <option style={{ background: "#111" }} value="04:00 PM">
                    04:00 PM
                  </option>
                  <option style={{ background: "#111" }} value="05:00 PM">
                    05:00 PM
                  </option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setBookingDoctor(null)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid var(--gn-surface-border-strong)",
                    color: "var(--gn-text-primary)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {lang === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  style={{
                    flex: 1,
                    background: "var(--gn-blue)",
                    border: "none",
                    color: "#fff",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                    opacity: bookingLoading ? 0.7 : 1,
                  }}
                >
                  {bookingLoading
                    ? lang === "bn"
                      ? "অপেক্ষা করুন..."
                      : "Booking..."
                    : lang === "bn"
                      ? "বুক করুন"
                      : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
