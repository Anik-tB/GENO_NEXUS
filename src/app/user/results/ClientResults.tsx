"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = "low" | "medium" | "high";

interface Prediction {
  id: string;
  disease: string;
  genes: string;
  severity: Severity;
  risk: number;
  confidence: number;
  trend: string;
  insight: string;
}

interface PredictionResponse {
  success: boolean;
  predictions: Prediction[];
  meta: { fileName: string; matchPct: number; mutationCount: number; organism?: string };
}

// ─── Dynamic Clinical Tests Generator ──────────────────────────────────────────
function getDynamicTests(organism: string, lang: "en" | "bn") {
  const orgLow = organism.toLowerCase();
  
  if (orgLow.includes("sars") || orgLow.includes("covid") || orgLow.includes("corona")) {
    return [
      {
        icon: "🔬",
        name: lang === "bn" ? "আরটি-পিসিআর (RT-PCR)" : "RT-PCR Test",
        desc: lang === "bn" ? "শরীরে সক্রিয় ভাইরাসের উপস্থিতি নিশ্চিত করতে ব্যবহৃত প্রধান পরীক্ষা।" : "Gold standard test to confirm active viral infection.",
        price: "৳১,৫০০",
      },
      {
        icon: "🫁",
        name: lang === "bn" ? "বুকের এক্স-রে (Chest X-Ray)" : "Chest X-Ray",
        desc: lang === "bn" ? "ফুসফুসের সংক্রমণ এবং নিউমোনিয়ার লক্ষণ যাচাই করার জন্য।" : "Check for signs of lung infection and pneumonia.",
        price: "৳৬০০",
      },
      {
        icon: "🩸",
        name: lang === "bn" ? "সিবিসি (CBC)" : "Complete Blood Count (CBC)",
        desc: lang === "bn" ? "রক্তের শ্বেত রক্তকণিকা এবং অন্যান্য উপাদানের মাত্রা চেক করতে।" : "Check white blood cell counts and overall blood health.",
        price: "৳৪০০",
      }
    ];
  } else if (orgLow.includes("hiv")) {
    return [
      {
        icon: "🩸",
        name: lang === "bn" ? "সিডি৪ কাউন্ট (CD4 Count)" : "CD4 Count",
        desc: lang === "bn" ? "রোগ প্রতিরোধ ক্ষমতার বর্তমান অবস্থা পরিমাপ করতে।" : "Measure the current state of the immune system.",
        price: "৳১,৮০০",
      },
      {
        icon: "🦠",
        name: lang === "bn" ? "ভাইরাল লোড (Viral Load)" : "Viral Load",
        desc: lang === "bn" ? "রক্তে ভাইরাসের পরিমাণ পরিমাপ করার পরীক্ষা।" : "Measure the amount of virus present in the blood.",
        price: "৳৩,৫০০",
      },
      {
        icon: "🧪",
        name: lang === "bn" ? "সিবিসি (CBC)" : "Complete Blood Count (CBC)",
        desc: lang === "bn" ? "সাধারণ শারীরিক অবস্থা ও রক্তের উপাদান পরিমাপ করতে।" : "General physical condition and blood component measurement.",
        price: "৳৪০০",
      }
    ];
  } else if (orgLow.includes("homo sapiens") || orgLow.includes("brca")) {
    return [
      {
        icon: "🧬",
        name: lang === "bn" ? "ম্যামোগ্রাম (Mammogram)" : "Mammogram",
        desc: lang === "bn" ? "স্তন ক্যানসারের প্রাথমিক লক্ষণ শনাক্ত করার জন্য।" : "Early detection screening for breast cancer.",
        price: "৳২,৫০০",
      },
      {
        icon: "🔬",
        name: lang === "bn" ? "ব্রেস্ট আল্ট্রাসাউন্ড" : "Breast Ultrasound",
        desc: lang === "bn" ? "স্তনের টিস্যুর বিস্তারিত ছবি প্রদান করে।" : "Provides detailed imaging of breast tissues.",
        price: "৳১,৫০০",
      },
      {
        icon: "🩸",
        name: lang === "bn" ? "CA 15-3 টিউমার মার্কার" : "CA 15-3 Tumor Marker",
        desc: lang === "bn" ? "রক্তে ক্যানসার মার্কারের মাত্রা পরিমাপ করতে।" : "Measures levels of cancer markers in the blood.",
        price: "৳১,২০০",
      }
    ];
  }

  // Default General Tests
  return [
    {
      icon: "🩸",
      name: lang === "bn" ? "সিবিসি (CBC)" : "Complete Blood Count (CBC)",
      desc: lang === "bn" ? "রক্তের সাধারণ স্বাস্থ্য এবং সংক্রমণ শনাক্ত করার পরীক্ষা।" : "General blood health and infection detection.",
      price: "৳৪০০",
    },
    {
      icon: "🧪",
      name: lang === "bn" ? "লিপিড প্রোফাইল (Lipid Profile)" : "Lipid Profile",
      desc: lang === "bn" ? "রক্তে কোলেস্টেরল এবং ট্রাইগ্লিসারাইডের মাত্রা পরিমাপ করতে।" : "Measures cholesterol and triglyceride levels.",
      price: "৳৮০০",
    },
    {
      icon: "🩺",
      name: lang === "bn" ? "ফাস্টিং ব্লাড সুগার (FBS)" : "Fasting Blood Sugar (FBS)",
      desc: lang === "bn" ? "রক্তে শর্করার মাত্রা পরীক্ষা করতে।" : "Checks blood sugar levels after fasting.",
      price: "৳২৫০",
    }
  ];
}

// ─── Risk level normalizer (backend uses "medium", UI uses "moderate") ─────────
function normalizeLevel(sev: Severity): "low" | "moderate" | "high" {
  return sev === "medium" ? "moderate" : sev;
}

// ─── Generate a simple next-step message based on severity ────────────────────
function getNextStep(sev: Severity, lang: "en" | "bn"): string {
  if (lang === "en") {
    if (sev === "high") return "Please consult a healthcare professional for a detailed evaluation.";
    if (sev === "medium") return "Mention this at your next doctor's appointment to keep an eye on it.";
    return "Keep up with your regular routine and healthy habits.";
  } else {
    if (sev === "high") return "বিস্তারিত মূল্যায়নের জন্য অনুগ্রহ করে একজন স্বাস্থ্যসেবা পেশাদারের পরামর্শ নিন।";
    if (sev === "medium") return "নজরে রাখতে আপনার পরবর্তী ডাক্তারের অ্যাপয়েন্টমেন্টে এটি উল্লেখ করুন।";
    return "আপনার নিয়মিত রুটিন এবং সুস্থ অভ্যাস চালিয়ে যান।";
  }
}

// ─── Compute overall status from predictions ──────────────────────────────────
function computeOverallStatus(predictions: Prediction[]): "low" | "moderate" | "high" {
  if (predictions.some(p => p.severity === "high")) return "high";
  if (predictions.some(p => p.severity === "medium")) return "moderate";
  return "low";
}

// ─── Config Maps ──────────────────────────────────────────────────────────────
const EN_RISK_CONFIG = {
  low:      { label: "Typical Risk",      emoji: "✅", color: "#10b981" },
  moderate: { label: "Slightly Elevated", emoji: "⚠️", color: "#eab308" },
  high:     { label: "Pay Attention",     emoji: "🔴", color: "#f43f5e" },
};

const BN_RISK_CONFIG = {
  low:      { label: "স্বাভাবিক ঝুঁকি", emoji: "✅", color: "#10b981" },
  moderate: { label: "একটু বেশি",        emoji: "⚠️", color: "#eab308" },
  high:     { label: "মনোযোগ দিন",       emoji: "🔴", color: "#f43f5e" },
};

const EN_OVERALL_CONFIG_PATIENT = {
  low:      { label: "All Clear — No Major Findings",              emoji: "✅", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.25)" },
  moderate: { label: "Some Findings — Worth Discussing",           emoji: "⚠️", bg: "rgba(234, 179, 8, 0.08)",  border: "rgba(234, 179, 8, 0.25)"  },
  high:     { label: "Action Needed — Please Consult a Doctor",    emoji: "🔴", bg: "rgba(244, 63, 94, 0.08)",  border: "rgba(244, 63, 94, 0.25)"  },
};

const BN_OVERALL_CONFIG_PATIENT = {
  low:      { label: "সব ঠিক আছে — কোনো বড় ঝুঁকি নেই",                       emoji: "✅", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.25)" },
  moderate: { label: "কিছু তথ্য পাওয়া গেছে — আলোচনা করা উচিত",               emoji: "⚠️", bg: "rgba(234, 179, 8, 0.08)",  border: "rgba(234, 179, 8, 0.25)"  },
  high:     { label: "পদক্ষেপ নিন — অনুগ্রহ করে ডাক্তারের পরামর্শ নিন",      emoji: "🔴", bg: "rgba(244, 63, 94, 0.08)",  border: "rgba(244, 63, 94, 0.25)"  },
};

const EN_OVERALL_CONFIG_COORDINATOR = {
  low:      { label: "Typical Risk — Standard Monitoring",          emoji: "✅", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.25)" },
  moderate: { label: "Elevated Risk — Specialist Referral Recommended", emoji: "⚠️", bg: "rgba(234, 179, 8, 0.08)",  border: "rgba(234, 179, 8, 0.25)"  },
  high:     { label: "Critical Risk Found — Action Recommended",    emoji: "🔴", bg: "rgba(244, 63, 94, 0.08)",  border: "rgba(244, 63, 94, 0.25)"  },
};

const BN_OVERALL_CONFIG_COORDINATOR = {
  low:      { label: "স্বাভাবিক ঝুঁকি — নিয়মিত পর্যবেক্ষণ",                     emoji: "✅", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.25)" },
  moderate: { label: "উচ্চতর ঝুঁকি — বিশেষজ্ঞের কাছে রেফারেল সুপারিশকৃত",         emoji: "⚠️", bg: "rgba(234, 179, 8, 0.08)",  border: "rgba(234, 179, 8, 0.25)"  },
  high:     { label: "গুরুতর ঝুঁকি পাওয়া গেছে — পদক্ষেপ নেওয়া জরুরি",           emoji: "🔴", bg: "rgba(244, 63, 94, 0.08)",  border: "rgba(244, 63, 94, 0.25)"  },
};

const EN_UI_PATIENT = {
  back: "← Back to Dashboard",
  title: "My Health Insights",
  loading: "Analyzing your DNA…",
  loadingHint: "Please wait while we process your genetic data.",
  errorTitle: "Could Not Load Results",
  noResultsTitle: "No Results Yet",
  noResultsDesc: "Your genetic analysis is not available yet. Please contact your care coordinator or doctor for details.",
  uploadBtn: "📤 Upload DNA File",
  analyzedLabel: "Analyzed file:",
  matchLabel: "Match:",
  mutationsLabel: "Variants found:",
  healthInsightsTitle: "Your Health Insights",
  healthInsightsHint: "These insights are based on your genetic file and approved by your healthcare provider.",
  nextStep: "Next Step:",
  downloadBtn: "📄 Download PDF Report",
  uploadNewBtn: "🧬 Upload New DNA File",
  disclaimer: "Important: These results are based on genetic markers only and are not a medical diagnosis. Always consult a qualified healthcare professional before making any health decisions.",
  translateBtn: "বাংলা অনুবাদ",
  confidence: "Confidence",
  trend: "Trend",
};

const BN_UI_PATIENT = {
  back: "← ড্যাশবোর্ডে ফিরে যান",
  title: "আমার স্বাস্থ্য সম্পর্কিত তথ্য",
  loading: "আপনার ডিএনএ বিশ্লেষণ করা হচ্ছে…",
  loadingHint: "আমরা আপনার জেনেটিক ডেটা প্রসেস করার সময় অনুগ্রহ করে অপেক্ষা করুন।",
  errorTitle: "ফলাফল লোড করা যায়নি",
  noResultsTitle: "এখনও কোন ফলাফল নেই",
  noResultsDesc: "আপনার জেনেটিক বিশ্লেষণ এখনও প্রস্তুত নয়। বিস্তারিত জানার জন্য আপনার কেয়ার কোঅর্ডিনেটর বা ডাক্তারের সাথে যোগাযোগ করুন।",
  uploadBtn: "📤 ডিএনএ ফাইল আপলোড করুন",
  analyzedLabel: "বিশ্লেষিত ফাইল:",
  matchLabel: "মিল:",
  mutationsLabel: "ভ্যারিয়েন্ট পাওয়া গেছে:",
  healthInsightsTitle: "আপনার স্বাস্থ্য সম্পর্কিত তথ্য",
  healthInsightsHint: "এই তথ্যগুলি আপনার আপলোড করা ডিএনএ ফাইলের উপর ভিত্তি করে এবং আপনার স্বাস্থ্যসেবা প্রদানকারী দ্বারা অনুমোদিত।",
  nextStep: "পরবর্তী পদক্ষেপ:",
  downloadBtn: "📄 পিডিএফ রিপোর্ট ডাউনলোড করুন",
  uploadNewBtn: "🧬 নতুন ডিএনএ ফাইল আপলোড করুন",
  disclaimer: "গুরুত্বপূর্ণ: এই ফলাফলগুলি শুধুমাত্র জেনেটিক তথ্যের উপর ভিত্তি করে এবং এটি কোনো মেডিকেল ডায়াগনোসিস নয়। স্বাস্থ্য সংক্রান্ত কোনো সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।",
  translateBtn: "English",
  confidence: "আত্মবিশ্বাস",
  trend: "প্রবণতা",
};

const EN_UI_COORDINATOR = {
  back: "← Back to Dashboard",
  title: "Patient Genomic Analysis",
  loading: "Analyzing patient DNA…",
  loadingHint: "Please wait while we process the genomic sequence data.",
  errorTitle: "Could Not Load Analysis",
  noResultsTitle: "No Ingested Samples Yet",
  noResultsDesc: "No patient DNA file has been uploaded yet, or the analysis is still in progress. Upload a patient DNA file to generate the clinical risk report.",
  uploadBtn: "📤 Upload Patient DNA",
  analyzedLabel: "Analyzed sample:",
  matchLabel: "Match:",
  mutationsLabel: "Pathogenic variants:",
  healthInsightsTitle: "Clinical Insights",
  healthInsightsHint: "These diagnostic risk assessments are generated from the query sequence aligned against reference databases.",
  nextStep: "Recommended Action:",
  downloadBtn: "📄 Export Clinical Report (PDF)",
  uploadNewBtn: "🧬 Upload New Patient DNA",
  disclaimer: "Important: This is a decision-support report designed for clinical users. It must be interpreted in conjunction with other clinical signs and confirmatory testing.",
  translateBtn: "বাংলা অনুবাদ",
  confidence: "Confidence",
  trend: "Trend",
};

const BN_UI_COORDINATOR = {
  back: "← ড্যাশবোর্ডে ফিরে যান",
  title: "রোগীর জিনোমিক বিশ্লেষণ",
  loading: "রোগীর ডিএনএ বিশ্লেষণ করা হচ্ছে…",
  loadingHint: "আমরা জিনোমিক সিকোয়েন্স ডেটা প্রসেস করার সময় অনুগ্রহ করে অপেক্ষা করুন।",
  errorTitle: "বিশ্লেষণ লোড করা যায়নি",
  noResultsTitle: "এখনও কোনো নমুনা নেই",
  noResultsDesc: "কোনো রোগীর ডিএনএ ফাইল এখনও আপলোড করা হয়নি, অথবা বিশ্লেষণ চলছে। ক্লিনিক্যাল ঝুঁকি রিপোর্ট তৈরি করতে রোগীর ডিএনএ ফাইল আপলোড করুন।",
  uploadBtn: "📤 রোগীর ডিএনএ আপলোড করুন",
  analyzedLabel: "বিশ্লেষিত নমুনা:",
  matchLabel: "মিল:",
  mutationsLabel: "প্যাথোজেনিক ভ্যারিয়েন্ট:",
  healthInsightsTitle: "ক্লিনিক্যাল ইনসাইটস",
  healthInsightsHint: "এই ডায়াগনস্টিক ঝুঁকি মূল্যায়নগুলি রেফারেন্স ডেটাবেসের সাথে সিকোয়েন্স ম্যাচ করে তৈরি করা হয়েছে।",
  nextStep: "সুপারিশকৃত পদক্ষেপ:",
  downloadBtn: "📄 ক্লিনিক্যাল রিপোর্ট এক্সপোর্ট (পিডিএফ)",
  uploadNewBtn: "🧬 রোগীর নতুন ডিএনএ আপলোড করুন",
  disclaimer: "গুরুত্বপূর্ণ: এটি ক্লিনিক্যাল ব্যবহারকারীদের জন্য ডিজাইন করা একটি সিদ্ধান্ত-সহায়তা রিপোর্ট। এটি অন্যান্য ক্লিনিক্যাল লক্ষণ এবং নিশ্চিতকরণ পরীক্ষার সাথে মিলিয়ে ব্যাখ্যা করতে হবে।",
  translateBtn: "English",
  confidence: "আত্মবিশ্বাস",
  trend: "প্রবণতা",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientResults({ userRole = "patient" }: { userRole?: string }) {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [meta, setMeta] = useState<PredictionResponse["meta"] | null>(null);

  const [showPreventionPlan, setShowPreventionPlan] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [customPlan, setCustomPlan] = useState<{title: string, content: string}[] | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = (localStorage.getItem("language") || "en") as "en" | "bn";
    setLang(savedLang);

    const handleLangEvent = () => {
      const updated = (localStorage.getItem("language") || "en") as "en" | "bn";
      setLang(updated);
    };
    window.addEventListener("languageChange", handleLangEvent);
    return () => window.removeEventListener("languageChange", handleLangEvent);
  }, []);

  const isBn = lang === "bn";
  const isCoordinator = userRole === "caregiver";
  const RISK_CONF = isBn ? BN_RISK_CONFIG : EN_RISK_CONFIG;
  const OVERALL_CONF = isBn 
    ? (isCoordinator ? BN_OVERALL_CONFIG_COORDINATOR : BN_OVERALL_CONFIG_PATIENT)
    : (isCoordinator ? EN_OVERALL_CONFIG_COORDINATOR : EN_OVERALL_CONFIG_PATIENT);
  const UI = isBn 
    ? (isCoordinator ? BN_UI_COORDINATOR : BN_UI_PATIENT)
    : (isCoordinator ? EN_UI_COORDINATOR : EN_UI_PATIENT);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreventionPlan(false);
      }
    };
    if (showPreventionPlan) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreventionPlan]);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setTimeout>;

    async function triggerAndPoll() {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Try to fetch existing predictions
        const res = await fetch("/api/predictions");
        const data = await res.json();

        if (res.status === 200) {
          // Results are ready
          setPredictions(data.predictions || []);
          setMeta(data.meta || null);
          setLoading(false);
          return;
        }

        if (res.status === 202) {
          // Analysis still running — keep polling
          setAnalysing(true);
          pollTimer = setTimeout(triggerAndPoll, 4000);
          return;
        }

        if (res.status === 404 && data.status === "pending") {
          // No analysis for this file yet — trigger patient-specific analysis
          // (auto-detects organism from FASTA header and compares against NCBI reference)
          setAnalysing(true);
          await fetch("/api/user/analyze", { method: "POST" });
          // Then poll
          pollTimer = setTimeout(triggerAndPoll, 5000);
          return;
        }

        // Hard error (e.g. no file uploaded)
        setError(data.error || "Failed to load results.");
        setLoading(false);

      } catch {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    }

    triggerAndPoll();
    return () => clearTimeout(pollTimer);
  }, []);

  const handleGeneratePreventionPlan = async () => {
    setShowPreventionPlan(true);
    if (customPlan) return; // already loaded

    setLoadingPlan(true);
    setPlanError(null);
    setCustomPlan(null);

    try {
      const isBn = lang === "bn";
      const prompt = isCoordinator
        ? `Analyze the patient's genomic results and suggest specific confirmatory diagnostic tests and reliable laboratories or medical facilities where these tests can be performed. Focus on practical clinical next steps for a Care Coordinator.
You MUST provide exactly 2 sections in raw JSON format: one for 'Recommended Tests' and one for 'Suggested Laboratories'.
CRITICAL: For every section, the 'title' and 'content' MUST contain BOTH the English text AND the Bengali (Bangla) translation. Do not omit the Bengali translation.
Format example:
[
  {
    "title": "Recommended Tests / প্রস্তাবিত পরীক্ষা",
    "content": "English text here.\\n\\nবাংলা অনুবাদ এখানে।"
  },
  {
    "title": "Suggested Laboratories / প্রস্তাবিত ল্যাবরেটরি",
    "content": "English text here.\\n\\nবাংলা অনুবাদ এখানে।"
  }
]`
        : `Generate a concise personal prevention plan, lifestyle adjustments, and general wellness recommendations based on the patient's overall genomic analysis. Keep it simple, encouraging, and easy to understand for a layperson.
You MUST provide exactly 2 actionable sections in raw JSON format.
CRITICAL: For every section, the 'title' and 'content' MUST contain BOTH the English text AND the Bengali (Bangla) translation. Do not omit the Bengali translation.
Format example:
[
  {
    "title": "Lifestyle Advice / জীবনধারা পরামর্শ",
    "content": "English text here.\\n\\nবাংলা অনুবাদ এখানে।"
  }
]`;
      
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          mode: "prevention_plan",
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate prevention plan: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.success || !data.reply) {
        throw new Error(data.error || "Failed to generate prevention plan.");
      }

      let cleaned = data.reply.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(json)?\n/, "").replace(/\n```$/, "").trim();
      }

      let parsedSections: any[] = [];
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          parsedSections = parsed;
        } else if (parsed && typeof parsed === "object") {
          const arrayKey = Object.keys(parsed).find(key => Array.isArray((parsed as any)[key]));
          if (arrayKey) {
            parsedSections = (parsed as any)[arrayKey];
          } else if (parsed.title && parsed.content) {
            parsedSections = [parsed];
          }
        }
        if (parsedSections.length === 0) {
          throw new Error("Parsed JSON did not contain any valid section list");
        }
      } catch (err) {
        console.warn("Failed to parse reply as JSON. Attempting repair...", err);
        
        let success = false;
        const endings = ['', '"]}]', '"}]', '}]', ']', '"}', '}'];
        
        for (let end of endings) {
          try {
            const parsed = JSON.parse(cleaned + end);
            if (Array.isArray(parsed)) {
              parsedSections = parsed;
              success = true;
              break;
            } else if (parsed && parsed.sections) {
              parsedSections = parsed.sections;
              success = true;
              break;
            }
          } catch (e) {}
        }
        
        if (!success) {
          // If appending closures doesn't work, fallback to basic regex
          const titles = [...cleaned.matchAll(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/g)];
          const contents = [...cleaned.matchAll(/"content"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/g)];
          
          for (let i = 0; i < Math.max(titles.length, contents.length); i++) {
            parsedSections.push({
              title: titles[i]?.[1] ? titles[i][1].replace(/\\n/g, ' ').replace(/\\"/g, '"') : "Section",
              content: contents[i]?.[1] ? contents[i][1].replace(/\\n/g, ' ').replace(/\\"/g, '"') : "..."
            });
          }
          
          if (parsedSections.length === 0) {
             let plainText = cleaned.replace(/[{}\[\]"]/g, "").replace(/title:/g, "\n\n").replace(/content:/g, "\n");
             parsedSections = [{ title: "Partial Plan", content: plainText }];
          }
        }
      }

      setCustomPlan(parsedSections);
    } catch (err: any) {
      console.warn("Copilot prevention plan error:", err);
      setPlanError(err.message || "Failed to connect to the clinical genomics copilot API. Please try again.");
    } finally {
      setLoadingPlan(false);
    }
  };

  // ── Computed State ──────────────────────────────────────────────────────────
  const overallStatus = computeOverallStatus(predictions);
  const overall = OVERALL_CONF[overallStatus];

  const overallSummary = isBn
    ? overallStatus === "high"
      ? "আপনার ডিএনএ বিশ্লেষণ সম্পন্ন হয়েছে। কিছু গুরুত্বপূর্ণ তথ্য পাওয়া গেছে যা আপনার ডাক্তারকে জানানো উচিত।"
      : overallStatus === "moderate"
      ? "আপনার ডিএনএ বিশ্লেষণ সম্পন্ন হয়েছে। কিছু মাঝারি তথ্য পাওয়া গেছে যা আপনার পরবর্তী চেক-আপে আলোচনা করুন।"
      : "আপনার ডিএনএ বিশ্লেষণ সম্পন্ন হয়েছে। সুখবর — কোনো বড় স্বাস্থ্য ঝুঁকি পাওয়া যায়নি।"
    : overallStatus === "high"
    ? "Your DNA analysis is complete. Some important findings were detected — please consult your doctor."
    : overallStatus === "moderate"
    ? "Your DNA analysis is complete. Some moderate findings were detected — discuss them at your next check-up."
    : "Your DNA analysis is complete. Good news — no major health warnings were found.";

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    const loadTitle = analysing
      ? (isBn ? "🔬 আপনার ডিএনএ বিশ্লেষণ চলছে…" : "🔬 Analysing your DNA file…")
      : UI.loading;
    const loadHint = analysing
      ? (isBn ? "আমাদের AI ইঞ্জিন আপনার ফাইল প্রক্রিয়া করছে। এটি সাধারণত ১৫-৩০ সেকেন্ড সময় নেয়। এই পেজটি স্বয়ংক্রিয়ভাবে আপডেট হবে।"
              : "Our AI engine is processing your file. This usually takes 15–30 seconds. This page will update automatically.")
      : UI.loadingHint;

    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/user/dashboard" className={styles.back} id="results-back">{UI.back}</Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h1 className={styles.title}>{UI.title}</h1>
          </div>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} style={{ animation: "spin 2s linear infinite", display: "inline-block" }}>🧬</span>
          <h2 className={styles.emptyTitle}>{loadTitle}</h2>
          <p className={styles.emptyDesc}>{loadHint}</p>
        </div>
      </div>
    );
  }


  // ── No Results / Error State ────────────────────────────────────────────────
  if (error || !meta) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/user/dashboard" className={styles.back} id="results-back">{UI.back}</Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 className={styles.title}>{UI.title}</h1>
          </div>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🧬</span>
          <h2 className={styles.emptyTitle}>{error ? UI.errorTitle : UI.noResultsTitle}</h2>
          <p className={styles.emptyDesc}>{error ?? UI.noResultsDesc}</p>
          <Link href="/user/upload-dna" className={styles.btnPrimary} id="results-upload-cta">
            {UI.uploadBtn}
          </Link>
        </div>
      </div>
    );
  }

  // ── Results View ────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/user/dashboard" className={styles.back} id="results-back">{UI.back}</Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className={styles.title}>{UI.title}</h1>
            {meta && (
              <p className={styles.subtitle}>
                <span>{UI.analyzedLabel} <strong>{meta.fileName}</strong></span>
                <span className={styles.separator}>•</span>
                <span>{UI.matchLabel} <strong>{meta.matchPct}%</strong></span>
                <span className={styles.separator}>•</span>
                <span>{UI.mutationsLabel} <strong>{meta.mutationCount}</strong></span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Overall Summary ────────────────────────────────────────── */}
      <div
        className={styles.overallCard}
        style={{ background: overall.bg, borderColor: overall.border }}
      >
        <span className={styles.overallEmoji}>{overall.emoji}</span>
        <div>
          <p className={styles.overallLabel}>{overall.label}</p>
          <p className={styles.overallSummary}>{overallSummary}</p>
        </div>
      </div>

      {/* ── Health Risk Cards ──────────────────────────────────────── */}
      <section>
        <h2 className={styles.sectionTitle}>{UI.healthInsightsTitle}</h2>
        <p className={styles.sectionHint}>{UI.healthInsightsHint}</p>
        <div className={styles.riskGrid}>
          {predictions.map((pred) => {
            const level = normalizeLevel(pred.severity);
            const cfg = RISK_CONF[level];
            const nextStep = getNextStep(pred.severity, lang);
            return (
              <div key={pred.id} className={`${styles.riskCard} ${styles[`riskCard_${level}`]}`}>
                <div className={styles.riskHeader}>
                  <span className={styles.riskEmoji}>{cfg.emoji}</span>
                  <div>
                    <p className={styles.riskName}>{pred.disease}</p>
                    <span className={styles.riskBadge} style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className={styles.riskPercent} style={{ color: cfg.color }}>
                    {pred.risk}%
                  </div>
                </div>

                <div className={styles.riskBar}>
                  <div
                    className={styles.riskBarFill}
                    style={{ width: `${pred.risk}%`, background: cfg.color }}
                  />
                </div>

                <p className={styles.riskDesc}>{pred.insight}</p>

                {/* Confidence + Trend badges */}
                <div style={{ display: "flex", gap: "0.5rem", margin: "0.4rem 0" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: "rgba(255,255,255,0.06)", color: "var(--gn-text-secondary)" }}>
                    🎯 {UI.confidence}: {pred.confidence}%
                  </span>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: "rgba(255,255,255,0.06)", color: "var(--gn-text-secondary)" }}>
                    {pred.trend === "increasing" ? "📈" : pred.trend === "stable" ? "➡️" : "📉"} {pred.trend}
                  </span>
                </div>

                <div className={styles.riskAction}>
                  <span className={styles.riskActionLabel}>{UI.nextStep}</span>{" "}
                  {nextStep}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Related Clinical Tests ──────────────────────────────────── */}
      {!isCoordinator && meta?.organism && (
        <section style={{ marginTop: '1rem' }}>
          <h2 className={styles.sectionTitle}>
            {lang === 'bn' ? 'প্রস্তাবিত ক্লিনিক্যাল টেস্ট ও খরচ' : 'Recommended Clinical Tests & Costs'}
          </h2>
          <p className={styles.sectionHint}>
            {lang === 'bn' 
              ? `আপনার ${meta.organism} বিশ্লেষণের উপর ভিত্তি করে নিচের রুটিন টেস্টগুলো প্রস্তাব করা হলো:` 
              : `Based on your ${meta.organism} analysis, the following standard clinical tests are recommended:`}
          </p>
          <div className={styles.testsGrid}>
            {getDynamicTests(meta.organism, lang).map((test, idx) => (
              <div key={idx} className={styles.testCard}>
                <div className={styles.testHeader}>
                  <span className={styles.testIcon}>{test.icon}</span>
                  <h3 className={styles.testName}>{test.name}</h3>
                </div>
                <p className={styles.testDesc}>{test.desc}</p>
                <div className={styles.testFooter}>
                  <span className={styles.testPrice}>{test.price}</span>
                  <button className={styles.testBtn}>{lang === 'bn' ? 'বুক করুন' : 'Book Now'}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Download Report ────────────────────────────────────────── */}
      <div className={styles.reportActions}>
        <button 
          className={styles.btnDownload} 
          id="results-download-pdf"
          onClick={() => window.print()}
        >
          {UI.downloadBtn}
        </button>
        {isCoordinator && (
          <Link href="/user/upload-dna" className={styles.btnSecondary} id="results-upload-new">
            {UI.uploadNewBtn}
          </Link>
        )}
      </div>

      {/* ── Medical Disclaimer ─────────────────────────────────────── */}
      <div className={styles.disclaimer}>
        <span>⚕️</span>
        <p>{UI.disclaimer}</p>
      </div>

      {/* ── Floating Prevention Plan Button ─────────────────────────── */}
      <button 
        className={styles.fabPrevention} 
        onClick={handleGeneratePreventionPlan}
        title={isCoordinator ? (isBn ? "পরীক্ষা ও ল্যাব সাজেশন দেখুন" : "View Tests & Labs Suggestion") : (isBn ? "প্রতিরোধ ও সুস্থতা পরিকল্পনা দেখুন" : "View Prevention & Wellness Plan")}
      >
        <span>🔬</span>
        {isCoordinator 
          ? (isBn ? "টেস্ট ও ল্যাব সাজেশন" : "Tests & Labs Suggestion") 
          : (isBn ? "প্রতিরোধ ও সুস্থতা পরিকল্পনা" : "Prevention & Wellness Plan")}
      </button>

      {/* ── Prevention Plan Modal ───────────────────────────────────── */}
      {showPreventionPlan && (
        <div className={styles.modalOverlay} onClick={() => setShowPreventionPlan(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isCoordinator 
                  ? (isBn ? "প্রস্তাবিত পরীক্ষা এবং ল্যাবরেটরি" : "Recommended Tests & Laboratories") 
                  : (isBn ? "ব্যক্তিগত প্রতিরোধ ও সুস্থতা পরিকল্পনা" : "Personal Prevention & Wellness Plan")}
              </h3>
              <button className={styles.closeButton} onClick={() => setShowPreventionPlan(false)}>×</button>
            </div>
            
            <div className={styles.planContent}>
              {loadingPlan && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
                  <div style={{ width: 40, height: 40, border: '3px solid rgba(16, 185, 129, 0.1)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: "var(--gn-text-secondary)", marginTop: "1rem", fontSize: "0.9rem", textAlign: "center" }}>
                    {isCoordinator 
                      ? (isBn ? "পরীক্ষা ও ল্যাব সাজেশন তৈরি করা হচ্ছে..." : "Generating tests & labs suggestions...") 
                      : (isBn ? "সুস্থতা পরিকল্পনা তৈরি করা হচ্ছে..." : "Generating wellness plan...")}
                  </p>
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {planError && (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <p style={{ color: "var(--gn-danger)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    {planError}
                  </p>
                  <button
                    onClick={() => {
                      setPlanError(null);
                      setLoadingPlan(true);
                      handleGeneratePreventionPlan();
                    }}
                    style={{ background: "transparent", border: "1px solid var(--gn-border-light-strong)", color: "var(--gn-text-primary)", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    {isBn ? "পুনরায় চেষ্টা করুন" : "Retry"}
                  </button>
                </div>
              )}

              {customPlan && customPlan.map((section: any, idx: number) => (
                <div key={idx} className={styles.planSection}>
                  <h4>{section.title}</h4>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
              <button 
                onClick={() => setShowPreventionPlan(false)}
                style={{ background: "var(--gn-primary)", color: "#000", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "transform 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isBn ? "বন্ধ করুন" : "Acknowledge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
