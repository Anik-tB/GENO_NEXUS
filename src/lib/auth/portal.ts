import type { AccountCategory } from "@/lib/auth/account-category";

/**
 * Determines which portal a user belongs to based on their account category.
 *
 * Normal User Portal  → /user/dashboard   (patient, caregiver)
 * Researcher Portal   → /dashboard        (clinician, researcher, lab_staff, other)
 */

export const NORMAL_USER_CATEGORIES: AccountCategory[] = ["patient", "caregiver"];
export const RESEARCHER_CATEGORIES: AccountCategory[] = ["researcher"];

export function getPortalForCategory(category: AccountCategory): "user" | "researcher" {
  if ((NORMAL_USER_CATEGORIES as string[]).includes(category)) {
    return "user";
  }
  return "researcher";
}

export function getRedirectPathForCategory(category: AccountCategory): string {
  return getPortalForCategory(category) === "user" ? "/user/dashboard" : "/dashboard";
}

export function isNormalUserCategory(category: AccountCategory): boolean {
  return getPortalForCategory(category) === "user";
}

export function isResearcherCategory(category: AccountCategory): boolean {
  return getPortalForCategory(category) === "researcher";
}
