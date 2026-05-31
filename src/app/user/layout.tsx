import Link from "next/link";
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
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/user/dashboard" className={styles.navBrand}>
          <span className={styles.navLogo}>GN</span>
          <span>GenoNexus</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/user/dashboard" className={styles.navLink} id="nav-home">
            🏠 Home
          </Link>
          <Link href="/user/upload-dna" className={styles.navLink} id="nav-upload">
            🧬 Upload DNA
          </Link>
          <Link href="/user/results" className={styles.navLink} id="nav-results">
            📊 My Results
          </Link>
          <Link href="/user/profile" className={styles.navLink} id="nav-profile">
            👤 Profile
          </Link>
        </div>

        <div className={styles.navRight}>
          <div className={styles.navAvatar} title={fullName || firstName}>
            {initials}
          </div>
          <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
            <button type="submit" className={styles.logoutBtn} id="nav-logout">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
