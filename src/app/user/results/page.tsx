import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import ClientResults from "./ClientResults";

export const metadata: Metadata = {
  title: "My DNA Results — GenoNexus",
  description:
    "View your personal genetic health risk assessment results in plain, easy-to-understand language.",
};

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;
  let userRole = "patient";

  if (sessionToken) {
    try {
      const user = await getUserFromSessionToken(sessionToken);
      if (user) {
        userRole = user.accountCategory || "patient";
      }
    } catch {
      // silently continue
    }
  }

  return <ClientResults userRole={userRole} />;
}
