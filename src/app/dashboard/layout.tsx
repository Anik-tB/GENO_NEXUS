import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { ChatbotPanel } from "@/components/dashboard/ChatbotPanel";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;

  if (!sessionToken) {
    redirect("/login?status=session_required");
  }

  let user = null;

  try {
    user = await getUserFromSessionToken(sessionToken);
  } catch {
    redirect("/login?error=service_unavailable");
  }

  if (!user) {
    redirect("/login?status=session_required");
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const userInitials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "GN";

  return (
    <div className={styles.dashboardShell}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopNav userInitials={userInitials} userName={fullName || user.firstName} userEmail={user.email} userAvatarUrl={user.avatarUrl} />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
      <ChatbotPanel />
    </div>
  );
}
