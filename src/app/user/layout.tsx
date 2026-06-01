import { UserSidebar } from "@/components/user/UserSidebar";
import { UserTopNav } from "@/components/user/UserTopNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { isNormalUserCategory } from "@/lib/auth/portal";
import styles from "./layout.module.css";

export default async function UserPortalLayout({
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

  // If a researcher accidentally lands on /user/*, redirect them back to their portal
  if (!isNormalUserCategory(user.accountCategory)) {
    redirect("/dashboard");
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";
  const firstName = user.firstName || "User";

  return (
    <div className={styles.dashboardShell}>
      <UserSidebar />
      <div className={styles.mainWrapper}>
        <UserTopNav userInitials={initials} userName={fullName || firstName} userEmail={user.email} />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
