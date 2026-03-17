import Link from "next/link";
import styles from "./auth-shell.module.css";

const TRUST_SIGNALS = [
  {
    badge: "01",
    title: "HIPAA-aligned foundations",
    text: "Secure handling patterns, controlled access, and privacy-first workflows from day one."
  },
  {
    badge: "02",
    title: "Clinical guideline-backed",
    text: "Results are designed around pharmacogenomic safety standards and CPIC-style interpretation."
  },
  {
    badge: "03",
    title: "Your data stays yours",
    text: "No resale workflow, deletion-ready architecture, and explicit consent checkpoints."
  },
  {
    badge: "04",
    title: "Built for patient clarity",
    text: "Plain-English guidance and medical-grade structure for safer medication conversations."
  }
];

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  title,
  description,
  children,
  footer
}: AuthShellProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandInner}>
          <div className={styles.brandTop}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark}>GN</span>
              <span>GenoNexus</span>
            </Link>

            <div>
              <p className="eyebrow">Medication safety intelligence</p>
              <h2 className={styles.headline}>Your medication safety starts here.</h2>
              <p className={styles.subtitle}>
                Secure authentication for a pharmacogenomics platform designed to turn raw
                DNA files into patient-friendly medication risk insights.
              </p>
            </div>

            <div className={styles.signalList}>
              {TRUST_SIGNALS.map((signal) => (
                <div key={signal.title} className={styles.signal}>
                  <span className={styles.signalBadge}>{signal.badge}</span>
                  <div>
                    <strong className={styles.signalTitle}>{signal.title}</strong>
                    <p className={styles.signalText}>{signal.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.disclaimer}>
            GenoNexus supports medication safety awareness and is not a substitute for a
            clinician, pharmacist, or emergency advice. Treatment decisions must remain with a
            qualified medical professional.
          </p>
        </div>
      </aside>

      <main className={styles.contentPanel}>
        <section className={styles.contentCard}>
          <header className={styles.header}>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </section>
      </main>
    </div>
  );
}

