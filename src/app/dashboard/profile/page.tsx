import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const user = await getUserFromSessionToken(sessionToken);

  if (!user) {
    redirect("/login");
  }

  return <ProfileClient user={user} />;
}
