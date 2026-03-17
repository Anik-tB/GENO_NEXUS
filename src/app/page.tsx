import Link from "next/link";
import { DnaHelix } from "@/components/marketing/dna-helix";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import styles from "./page.module.css";

const FAQ_ITEMS = [
  {
    question: "What DNA files can I use?",
    answer:
      "GenoNexus is designed for the raw export files most people receive from consumer DNA services such as 23andMe and AncestryDNA. VCF support can be added as the product expands."
  },
  {
    question: "How fast is the report?",
    answer:
      "The initial product story targets a fast turnaround so people can upload once and get a concise medication-safety summary in about a minute, depending on file size and processing demand."
  },
  {
    question: "Will you sell my genetic data?",
    answer:
      "No. The product positioning in your spec is privacy-first: user-controlled uploads, deletion on request, and no data-selling workflow."
  },
  {
    question: "Is this medical advice?",
    answer:
      "No. GenoNexus is positioned as a decision-support and safety-awareness product. Final prescribing and treatment decisions remain with licensed clinicians."
  },
  {
    question: "Why start with auth and the landing pages?",
    answer:
      "These pages establish the trust surface, conversion funnel, and the core user entry path. They also let the database and auth model be shaped correctly before deeper clinical features are added."
  }
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15c6.667-6 13.333 0 20-6" />
        <path d="M9 22c1.798-1.998 2.518-3.995 2.8-5.993" />
        <path d="M15 2c-1.798 1.998-2.518 3.995-2.8 5.993" />
      </svg>
    ),
    title: "Multi-Format DNA Analysis",
    description: "Process raw DNA files from 23andMe, AncestryDNA, and VCF formats with deep-learning powered variant detection."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Variant Pathogenicity Scoring",
    description: "AI-driven classification with 93.5% accuracy across diverse genomic datasets using graph neural networks."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Real-Time Medication Alerts",
    description: "Instant safety notifications when drug-gene interactions are detected, with risk-tier classification."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
      </svg>
    ),
    title: "Physician-Ready Reports",
    description: "Clinician-formatted summaries with clear risk tiers and plain-English language designed for care conversations."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Privacy-First Architecture",
    description: "HIPAA-aligned infrastructure with end-to-end encryption, user-controlled deletion, and zero data resale."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
    title: "AI-Powered Chatbot",
    description: "Ask questions about your genomic data in natural language and get research-backed answers instantly."
  }
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        {/* Ambient glow orbs */}
        <div className={styles.heroOrbs}>
          <div className={styles.heroOrb1} />
          <div className={styles.heroOrb2} />
        </div>

        <div className={`pageShell ${styles.nav}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>
              <svg 
                width="24" 
                height="24" 
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

          <nav className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#trust">Security</a>
            <a href="#pricing">Pricing</a>
            <Link className="buttonSecondary" href="/login">
              Sign In
            </Link>
          </nav>
        </div>

        <div className={`pageShell ${styles.heroGrid}`}>
          <div className={`${styles.heroCopy} animate-fade-in-up`}>
            <p className="eyebrow">Pharmacogenomics medication safety platform</p>
            <h1>Your DNA file knows which medications could harm you.</h1>
            <p>
              Upload a raw DNA file and receive a clear, patient-friendly medication safety report
              in roughly 60 seconds, built to support safer conversations with your doctor and
              pharmacist.
            </p>

            <div className={styles.heroActions}>
              <Link className="buttonPrimary" href="/register">
                Upload My DNA File
              </Link>
              <a className="buttonSecondary" href="#sample-report">
                See sample report
              </a>
            </div>

            <div className={styles.trustLine}>
              <span />
              <p>Your file is processed securely. Never sold. Deleted on request.</p>
            </div>
          </div>

          <DnaHelix />
        </div>
      </section>

      <section className={styles.stats}>
        <div className={`pageShell ${styles.statsGrid}`}>
          <article className={`${styles.statCard} animate-fade-in-up`}>
            <p className={styles.statValue}>125K</p>
            <p className={styles.statLabel}>
              medication-related deaths cited in the platform&apos;s problem framing
            </p>
          </article>
          <article className={`${styles.statCard} animate-fade-in-up delay-100`}>
            <p className={styles.statValue}>$136B</p>
            <p className={styles.statLabel}>
              in annual cost burden tied to preventable medication complications
            </p>
          </article>
          <article className={`${styles.statCard} animate-fade-in-up delay-200`}>
            <p className={styles.statValue}>1 in 4</p>
            <p className={styles.statLabel}>
              people may carry genetic traits that change how common drugs should be used
            </p>
          </article>
        </div>
      </section>

      {/* Features Showcase */}
      <section className={styles.featuresSection} id="features">
        <div className="pageShell">
          <div className="sectionHeader">
            <h2>Powerful genomics tools, built for everyone.</h2>
            <p>
              From DNA analysis to AI-powered medication safety insights, GenoNexus brings
              clinical-grade pharmacogenomics to patients, physicians, and researchers.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((feature, i) => (
              <article
                key={feature.title}
                className={`${styles.featureCard} animate-fade-in-up delay-${(i % 3) * 100 + 100}`}
              >
                <div className={styles.featureIconWrap}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.darkSection} id="how-it-works">
        <div className="pageShell">
          <div className={`sectionHeader ${styles.sectionHeaderDark}`}>
            <h2>Three steps from raw DNA file to a safer medication conversation.</h2>
            <p>
              The first release is built around a calm, trust-heavy workflow: upload once, review
              high-priority findings, and bring a clear summary into care decisions.
            </p>
          </div>

          <div className={styles.steps}>
            <article className={`${styles.stepCard} animate-fade-in-up`}>
              <span className={styles.stepNumber}>1</span>
              <h3>Upload your raw file</h3>
              <p>
                Start with a consumer DNA export and move through a guided, privacy-first intake
                flow with clear expectations before any analysis begins.
              </p>
            </article>
            <article className={`${styles.stepCard} animate-fade-in-up delay-100`}>
              <span className={styles.stepNumber}>2</span>
              <h3>Map actionable pharmacogenes</h3>
              <p>
                GenoNexus focuses on the medication-related variants that matter for interpretation
                rather than overwhelming users with a full genome dump.
              </p>
            </article>
            <article className={`${styles.stepCard} animate-fade-in-up delay-200`}>
              <span className={styles.stepNumber}>3</span>
              <h3>Review report-ready guidance</h3>
              <p>
                Receive a professional summary with clear risk tiers, plain-English language, and a
                format designed to be shared with clinicians.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section} id="trust">
        <div className="pageShell">
          <div className="sectionHeader">
            <h2>Trust has to be visible before anyone uploads a genetic file.</h2>
            <p>
              The first screens are built to communicate clinical rigor, privacy controls, and
              transparent ownership of user data.
            </p>
          </div>

          <div className={styles.badgeGrid}>
            <article className={`${styles.badgeCard} animate-fade-in-up`}>
              <span className={styles.badgeTag}>HIPAA-aligned</span>
              <h3>Secure foundations</h3>
              <p>Authentication, session handling, and database design are structured for sensitive data.</p>
            </article>
            <article className={`${styles.badgeCard} animate-fade-in-up delay-100`}>
              <span className={styles.badgeTag}>CPIC Level A</span>
              <h3>Clinical relevance</h3>
              <p>Future result views are shaped around guideline-backed medication interpretation patterns.</p>
            </article>
            <article className={`${styles.badgeCard} animate-fade-in-up delay-200`}>
              <span className={styles.badgeTag}>Your Data</span>
              <h3>User control</h3>
              <p>Deletion-ready workflows and explicit consent checkpoints are part of the product story.</p>
            </article>
            <article className={`${styles.badgeCard} animate-fade-in-up delay-300`}>
              <span className={styles.badgeTag}>No Selling</span>
              <h3>Privacy by default</h3>
              <p>No resale positioning, no growth-hack tone, and no ambiguity around ownership of uploads.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sampleSection}`} id="sample-report">
        <div className="pageShell">
          <div className="sectionHeader">
            <h2>Sample insight snapshot</h2>
            <p>
              The report experience is designed to feel clinical, readable, and immediately useful
              for both patients and physicians.
            </p>
          </div>

          <div className={styles.sampleGrid}>
            <article className={`cardSurface ${styles.sampleMain}`}>
              <div className={styles.sampleTop}>
                <div>
                  <p className={styles.badgeTag}>Medication Safety Report</p>
                  <h3>Clopidogrel response alert</h3>
                </div>
                <span className={`${styles.samplePill} ${styles.sampleHigh}`}>High Risk</span>
              </div>
              <p className={styles.sampleText}>
                Your CYP2C19 profile may reduce activation of clopidogrel, which can change how
                well the medication works. A physician-facing summary can recommend reviewing
                alternatives and dosing strategy with a licensed clinician.
              </p>
            </article>

            <div className={styles.sampleList}>
              <article className={`cardSurface ${styles.sampleSideCard}`}>
                <span className={`${styles.samplePill} ${styles.sampleModerate}`}>Moderate</span>
                <h3>Codeine metabolism</h3>
                <p>
                  Codeine response can be inconsistent when CYP2D6 activity is reduced or increased
                  outside the normal range.
                </p>
              </article>
              <article className={`cardSurface ${styles.sampleSideCard}`}>
                <span className={`${styles.samplePill} ${styles.sampleLow}`}>Low Risk</span>
                <h3>Stable maintenance profile</h3>
                <p>
                  Normal metabolizer results are still shown so users can see where no major safety
                  concern is currently identified.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="pricing">
        <div className="pageShell">
          <div className="sectionHeader">
            <h2>Pricing that feels like a clinical product, not a gimmick.</h2>
            <p>
              The landing page frames a clear one-time report option and an annual plan for people
              who want continued access, refreshed reporting, and future medication updates.
            </p>
          </div>

          <div className={styles.pricingGrid}>
            <article className={`cardSurface ${styles.priceCard} animate-fade-in-up`}>
              <h3>One-time report</h3>
              <div className={styles.price}>
                $49 <small>once</small>
              </div>
              <p>
                Best for people who want a single upload, one polished medication safety report, and
                a physician-ready summary they can bring into a visit.
              </p>
              <div className={styles.features}>
                <span>Secure account and report history</span>
                <span>Medication safety summary</span>
                <span>Physician-ready export structure</span>
              </div>
              <Link className="buttonSecondary" href="/register">
                Start one-time report
              </Link>
            </article>

            <article className={`cardSurface ${styles.priceCard} animate-fade-in-up delay-100`}>
              <span className={styles.recommendation}>Recommended</span>
              <h3>Annual access</h3>
              <div className={styles.price}>
                $29 <small>per year</small>
              </div>
              <p>
                Designed for returning users who want secure storage, future feature expansion, and
                ongoing access to medication safety intelligence.
              </p>
              <div className={styles.features}>
                <span>Everything in one-time access</span>
                <span>Persistent account and result access</span>
                <span>Future clinician-sharing and update workflows</span>
              </div>
              <Link className="buttonPrimary" href="/register">
                Choose annual access
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section} id="faq">
        <div className="pageShell">
          <div className="sectionHeader">
            <h2>Frequently asked questions</h2>
            <p>
              The answers below are framed for early-stage trust building while the deeper clinical
              features are still being implemented.
            </p>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA Band */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaGlow} />
        <div className={`pageShell ${styles.ctaInner}`}>
          <h2>Ready to understand your medication safety profile?</h2>
          <p>Upload your raw DNA file and get a clinician-ready report in under 60 seconds.</p>
          <div className={styles.ctaActions}>
            <Link className="buttonPrimary" href="/register">
              Get Started Free
            </Link>
            <Link className="buttonSecondary" href="/login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`pageShell ${styles.footerGrid}`}>
          <div>
            <h3>GenoNexus</h3>
            <p>
              A pharmacogenomics medication safety platform built to make raw DNA files clinically
              understandable, privacy-aware, and easier to act on responsibly.
            </p>
          </div>
          <div>
            <h4>Platform</h4>
            <div className={styles.footerLinks}>
              <Link href="/register">Create account</Link>
              <Link href="/login">Sign in</Link>
              <a href="#sample-report">Sample report</a>
            </div>
          </div>
          <div>
            <h4>Trust</h4>
            <div className={styles.footerLinks}>
              <a href="#trust">Data ownership</a>
              <a href="#faq">Privacy posture</a>
              <a href="#how-it-works">Workflow</a>
            </div>
          </div>
          <div>
            <h4>Contact</h4>
            <div className={styles.footerLinks}>
              <a href="mailto:hello@genonexus.com">hello@genonexus.com</a>
              <p>Medication safety support for patients, families, and clinicians.</p>
            </div>
          </div>
        </div>
        <div className={`pageShell ${styles.footerBottom}`}>
          <p>© 2025 GenoNexus. All rights reserved. Not a substitute for medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
