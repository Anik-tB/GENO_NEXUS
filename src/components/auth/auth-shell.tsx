import Link from "next/link";
import styles from "./auth-shell.module.css";

const TRUST_SIGNALS = [
  {
    icon: "🔒",
    title: "HIPAA-aligned foundations",
    text: "Secure handling patterns, controlled access, and privacy-first workflows from day one."
  },
  {
    icon: "🧬",
    title: "Clinical guideline-backed",
    text: "Results designed around pharmacogenomic safety standards and CPIC-style interpretation."
  },
  {
    icon: "🛡️",
    title: "Your data stays yours",
    text: "No resale workflow, deletion-ready architecture, and explicit consent checkpoints."
  },
  {
    icon: "💊",
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
        {/* Animated background geometry */}
        <div className={styles.bgGrid} />
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />

        <div className={styles.brandInner}>
          <div className={styles.brandTop}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark}>
                <svg 
                  width="28" 
                  height="28" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M2 15c6.667-6 13.333 0 20-6" />
                  <path d="M9 22c1.798-1.998 2.518-3.995 2.8-5.993" />
                  <path d="M15 2c-1.798 1.998-2.518 3.995-2.8 5.993" />
                  <path d="m17 6-2.5-2.5" />
                  <path d="m14 8-1-1" />
                  <path d="m7 18 2.5 2.5" />
                  <path d="m3.5 14.5.5.5" />
                  <path d="m20 9 .5.5" />
                  <path d="m6.5 12.5 1 1" />
                  <path d="m16.5 11.5 1 1" />
                  <path d="m10 16 1.5 1.5" />
                </svg>
              </span>
              <span>GenoNexus</span>
            </Link>

            <div className={styles.headlineBlock}>
              <p className="eyebrow">Medication safety intelligence</p>
              <h2 className={`${styles.headline} animate-fade-in-up delay-100`}>
                Your medication safety starts here.
              </h2>
              <p className={`${styles.subtitle} animate-fade-in-up delay-200`}>
                Secure authentication for a pharmacogenomics platform designed to turn raw
                DNA files into patient-friendly medication risk insights.
              </p>
            </div>

            <div className={`${styles.signalList} animate-fade-in-up delay-300`}>
              {TRUST_SIGNALS.map((signal) => (
                <div key={signal.title} className={styles.signal}>
                  <span className={styles.signalIcon}>{signal.icon}</span>
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
            clinician, pharmacist, or emergency advice.
          </p>
        </div>
      </aside>

      <main className={styles.contentPanel}>
        <section className={`${styles.contentCard} animate-fade-in-up delay-100`}>
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
