export const ACCOUNT_CATEGORIES = [
  "patient",
  "caregiver",
  "clinician",
  "researcher",
  "lab_staff",
  "other"
] as const;

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

export const DEFAULT_ACCOUNT_CATEGORY: AccountCategory = "other";

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  patient: "Patient",
  caregiver: "Caregiver",
  clinician: "Clinician",
  researcher: "Researcher",
  lab_staff: "Lab staff",
  other: "Other"
};
