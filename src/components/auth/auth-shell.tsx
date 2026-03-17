import Link from "next/link";
import styles from "./auth-shell.module.css";

const TRUST_SIGNALS = [
  {
    icon: "🔒",
    title: "HIPAA-aligned foundations",
    text: "Secure handling patterns, privacy-first workflows, and protected genetic data."
  },
  {
    icon: "🧬",
    title: "Clinical guideline-backed insights",
    text: "Medication recommendations based on pharmacogenomic standards like CPIC."
  },
  {
    icon: "🔬",
    title: "AI-powered medication safety analysis",
    text: "Advanced analysis that converts complex DNA data into understandable health insights."
  }
];

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className={styles.layout}>
      {/* =========================================
          LEFT BRAND PANEL
          ========================================= */}
      <aside className={styles.brandPanel}>
        {/* Animated background geometry */}
        <div className={styles.bgGrid} />
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        
        {/* Floating DNA/Molecular Particles */}
        <div className={styles.particleLayer}>
            <div className={`${styles.particle} ${styles.p1}`}></div>
            <div className={`${styles.particle} ${styles.p2}`}></div>
            <div className={`${styles.particle} ${styles.p3}`}></div>
            <div className={`${styles.particle} ${styles.p4}`}></div>
            <div className={`${styles.particle} ${styles.p5}`}></div>
        </div>

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
              <p className="eyebrow">Medication Safety Intelligence</p>
              <h2 className={`${styles.headline} animate-fade-in-up delay-100`}>
                Secure pharmacogenomic insights that transform raw DNA files into patient-friendly medication risk analysis.
              </h2>
            </div>

            <div className={`${styles.signalList} animate-fade-in-up delay-200`}>
              {TRUST_SIGNALS.map((signal) => (
                <div key={signal.title} className={styles.signal}>
                  <div className={styles.signalIconBox}>
                    <span className={styles.signalIcon}>{signal.icon}</span>
                  </div>
                  <div>
                    <strong className={styles.signalTitle}>{signal.title}</strong>
                    <p className={styles.signalText}>{signal.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================
          RIGHT CONTENT PANEL
          ========================================= */}
      <main className={styles.contentPanel}>
        <section className={`${styles.contentCard} animate-fade-in-up delay-100`}>
          {/* Glassmorphic border glow overlay */}
          <div className={styles.cardGlowBorder} />
          <div className={styles.cardInner}>
             {children}
          </div>
        </section>
      </main>
    </div>
  );
}
