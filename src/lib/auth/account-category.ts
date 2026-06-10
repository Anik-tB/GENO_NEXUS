export const ACCOUNT_CATEGORIES = [
  "patient",
  "caregiver",
  "researcher"
] as const;

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

export const DEFAULT_ACCOUNT_CATEGORY: AccountCategory = "patient";

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  patient: "Patient (Personal Health Insights)",
  caregiver: "Care Coordinator (Clinical Ingestion & Referrals)",
  researcher: "Researcher (Command Center & AI Analysis)"
};
