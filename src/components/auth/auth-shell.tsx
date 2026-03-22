import Link from "next/link";
import styles from "./auth-shell.module.css";

const PLATFORM_TAGS = ["DNA uploads", "Report history", "Google + GitHub"];

const PLATFORM_SIGNALS = [
  {
    code: "01",
    title: "Secure intake",
    text: "Enter the workspace for uploads, case review, and report history."
  },
  {
    code: "02",
    title: "Medication safety",
    text: "Keep pharmacogenomic signals readable for clinicians and patients."
  },
  {
    code: "03",
    title: "Governed access",
    text: "Consent, identity, and audit posture stay attached to the product."
  }
];

const PLATFORM_STATS = [
  { value: "SSO", label: "Google and GitHub access" },
  { value: "24/7", label: "Secure session coverage" },
  { value: "HQ", label: "Report-ready workspace" }
];

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.brandPanel}>
        <div className={styles.panelGlow} />
        <div className={styles.panelGrid} />

        <div className={styles.brandInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>GN</span>
            <span>GenoNexus</span>
          </Link>

          <div className={styles.storyBlock}>
            <p className="eyebrow">Secure access</p>
            <h1>Access the GenoNexus platform.</h1>
            <p>One account for genomic uploads, medication-safety review, and report history.</p>
          </div>

          <div className={styles.tagRow}>
            {PLATFORM_TAGS.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className={styles.signalList}>
            {PLATFORM_SIGNALS.map((signal) => (
              <article key={signal.code} className={styles.signalCard}>
                <span className={styles.signalCode}>{signal.code}</span>
                <div>
                  <h2>{signal.title}</h2>
                  <p>{signal.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.statsStrip}>
            {PLATFORM_STATS.map((item) => (
              <div key={item.label} className={styles.stat}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className={styles.contentPanel}>
        <section className={`${styles.contentCard} animate-fade-in-up`}>
          <div className={styles.cardAccent} />
          <div className={styles.cardInner}>{children}</div>
        </section>
      </main>
    </div>
  );
}
