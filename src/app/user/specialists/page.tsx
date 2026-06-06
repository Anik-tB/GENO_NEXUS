import ClientSpecialists from "./ClientSpecialists";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";

export const metadata = {
  title: "Find Specialists | GenoNexus",
  description: "Find renowned specialists based on your genomic analysis.",
};

export default async function SpecialistsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  let userRole = "patient";
  
  if (token) {
    const user = await getUserFromSessionToken(token);
    if (user) {
      userRole = user.accountCategory;
    }
  }

  return <ClientSpecialists userRole={userRole} />;
}
