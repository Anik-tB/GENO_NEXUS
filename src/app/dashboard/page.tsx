import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import styles from "./page.module.css";

export default async function DashboardPage() {
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

  return (
    <main className={styles.page}>
      <div className="pageShell">
        <div className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>GN</span>
            <span>GenoNexus</span>
          </Link>

          <form action="/api/auth/logout" method="post">
            <button className={`buttonGhost ${styles.logout}`} type="submit">
              Sign out
            </button>
          </form>
        </div>

        <section className={`cardSurface ${styles.hero}`}>
          <p className="eyebrow" style={{ background: "var(--gn-blue-pale)", color: "var(--gn-blue)" }}>
            Account ready
          </p>
          <h1>Welcome back, {user.firstName}.</h1>
          <p>
            Your landing page, login flow, registration flow, and PostgreSQL-backed auth foundation
            are now in place. The next step is wiring the upload, parser, results, and reporting
            experience onto this authenticated shell.
          </p>
        </section>

        <section className={styles.grid}>
          <article className={`cardSurface ${styles.card}`}>
            <h2>Secure identity layer</h2>
            <p>
              Session cookies, password hashing, and PostgreSQL persistence are ready to support the
              first authenticated workflow.
            </p>
          </article>
          <article className={`cardSurface ${styles.card}`}>
            <h2>Marketing funnel</h2>
            <p>
              The landing page now carries the product story, pricing, trust posture, and CTA
              routing for sign-up and sign-in.
            </p>
          </article>
          <article className={`cardSurface ${styles.card}`}>
            <h2>Next implementation slice</h2>
            <p>
              DNA upload, processing states, and the medication safety report can now be built on
              top of the routes and shared styling already scaffolded here.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
