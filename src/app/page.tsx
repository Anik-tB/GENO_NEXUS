import Link from "next/link";
import { DnaHelix } from "@/components/marketing/dna-helix";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import styles from "./page.module.css";

const HERO_METRICS = [
  {
    value: "DNA",
    label: "consumer and clinical files move through one guided intake flow"
  },
  {
    value: "AI",
    label: "signal layers turn markers into medication and phenotype insight"
  },
  {
    value: "HQ",
    label: "reporting, collaboration, and governance stay in the same workspace"
  }
];

const HERO_CHIPS = [
  "23andMe + AncestryDNA",
  "VCF normalization",
  "Medication safety",
  "Clinician-ready reports"
];

const HERO_FLOW = ["Upload once", "Interpret clearly", "Share safely"];

const PLATFORM_SUMMARY = [
  {
    label: "Input stack",
    value: "Consumer DNA exports and VCF files"
  },
  {
    label: "Release focus",
    value: "Medication safety and phenotype review"
  },
  {
    label: "Control layer",
    value: "Consent, access, audit, and handoff"
  }
];

const PLATFORM_SIGNALS = [
  {
    label: "Ingest",
    title: "Guided upload",
    text: "Normalize raw DNA without exposing users to technical friction.",
    position: "meshNorth"
  },
  {
    label: "Interpret",
    title: "Signal engine",
    text: "Surface pharmacogenomic and phenotype cues in a readable layer.",
    position: "meshEast"
  },
  {
    label: "Govern",
    title: "Ownership vault",
    text: "Make consent, access, and deletion posture visible from the start.",
    position: "meshSouth"
  },
  {
    label: "Collaborate",
    title: "Shared review",
    text: "Create a cleaner handoff path for patients, clinicians, and labs.",
    position: "meshWest"
  }
];

const WORKSPACE_VIEWS = [
  {
    stage: "Upload lane",
    value: "VCF + consumer DNA",
    caption: "Queued and normalized",
    progress: "88%"
  },
  {
    stage: "Interpret lane",
    value: "Drug-gene panel",
    caption: "Guidelines matched",
    progress: "72%"
  },
  {
    stage: "Report lane",
    value: "Clinical summary",
    caption: "Ready for review",
    progress: "93%"
  }
];

const SIGNAL_MIX = [
  { label: "Pharmacogenomics", width: "88%" },
  { label: "Phenotype cues", width: "64%" },
  { label: "Research flags", width: "46%" }
];

const AUDIT_EVENTS = ["Consent captured", "Variant pipeline locked", "Report handoff logged"];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Start with raw DNA",
    text: "Users drop in exports once and land in a guided intake state."
  },
  {
    step: "02",
    title: "Turn data into signal",
    text: "Markers, evidence layers, and risk posture surface fast."
  },
  {
    step: "03",
    title: "Deliver a readable report",
    text: "Results become clear summaries instead of raw genomic jargon."
  },
  {
    step: "04",
    title: "Keep control visible",
    text: "Audit, access, and ownership stay present through the workflow."
  }
];

const REPORT_FINDINGS = [
  {
    gene: "CYP2C19",
    phenotype: "Reduced response",
    implication: "Review clopidogrel alternatives"
  },
  {
    gene: "CYP2D6",
    phenotype: "Rapid metabolism",
    implication: "Avoid codeine-heavy pathways"
  },
  {
    gene: "SLCO1B1",
    phenotype: "Routine risk",
    implication: "Baseline statin plan stays stable"
  }
];

const TRUST_SIGNALS = [
  {
    tag: "Evidence",
    title: "Calm report hierarchy",
    text: "High-priority findings lead while details stay easy to scan."
  },
  {
    tag: "Privacy",
    title: "Ownership stays explicit",
    text: "Consent and access show up as product features, not footnotes."
  },
  {
    tag: "Clinical",
    title: "Decision support tone",
    text: "The UI assists judgment without pretending to replace it."
  },
  {
    tag: "Scale",
    title: "Modular expansion path",
    text: "The same surface can grow into research and simulation workflows."
  }
];

const FAQ_ITEMS = [
  {
    question: "What opens first in GenoNexus?",
    answer:
      "A secure onboarding flow, guided DNA intake, and the medication-safety workspace."
  },
  {
    question: "Who is this interface designed for?",
    answer:
      "Patients, clinicians, and research teams that need readable genomic signals in one place."
  },
  {
    question: "How is privacy represented in the UI?",
    answer:
      "Consent, access, and audit states are visible inside the workflow instead of being buried in settings."
  }
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} />

        <div className={`pageShell ${styles.nav}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>GN</span>
            <span>GenoNexus</span>
          </Link>

          <nav className={styles.navLinks}>
            <a href="#platform">Platform</a>
            <a href="#workflow">Workflow</a>
            <a href="#report">Report</a>
            <a href="#faq">FAQ</a>
            <Link className={styles.navLogin} href="/login">
              Sign in
            </Link>
            <Link className="buttonPrimary" href="/register">
              Create account
            </Link>
          </nav>
        </div>

        <div className={`pageShell ${styles.heroGrid}`}>
          <div className={`${styles.heroContent} animate-fade-in-up`}>
            <p className="eyebrow">Genomics intelligence, made visual</p>

            <div className={styles.heroCopy}>
              <h1>See GenoNexus as a live platform, not a wall of copy.</h1>
              <p className={styles.heroDescription}>
                Secure intake, signal-rich interpretation, clinician-ready reporting, and
                governance controls inside one modern workspace.
              </p>
            </div>

            <div className={styles.heroActions}>
              <Link className="buttonPrimary" href="/register">
                Start secure onboarding
              </Link>
              <a className="buttonSecondary" href="#platform">
                Explore the platform
              </a>
            </div>
          </div>

          <div className={`${styles.heroVisual} animate-fade-in-scale delay-200`}>
            <div className={styles.visualHalo} />
            <div className={styles.visualFrame}>
              <DnaHelix />
            </div>

            <article className={`${styles.floatCard} ${styles.floatCardTop}`}>
              <span className={styles.floatLabel}>GenoNexus workspace</span>
              <strong>Medication safety lane</strong>
              <p>Patient intake, DNA normalization, and review routing stay on one platform surface.</p>
            </article>

            <article className={`${styles.floatCard} ${styles.floatCardBottom}`}>
              <span className={styles.floatLabel}>Governance vault</span>
              <strong>Consent, access + audit</strong>
              <p>Ownership states stay visible beside signal review instead of hidden in settings.</p>
            </article>
          </div>
        </div>

        <div className={`pageShell ${styles.heroBand}`}>
          <article className={styles.heroBandLead}>
            <div className={styles.heroChips}>
              {HERO_CHIPS.map((item) => (
                <span key={item} className={styles.heroChip}>
                  {item}
                </span>
              ))}
            </div>

            <h2>Built to move from raw genomic files to confident clinical handoff.</h2>

            <div className={styles.heroFlow}>
              {HERO_FLOW.map((item) => (
                <span key={item} className={styles.flowPill}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          <div className={styles.heroMetrics}>
            {HERO_METRICS.map((metric, index) => (
              <article
                key={metric.value}
                className={`${styles.metricCard} animate-fade-in-up delay-${(index + 1) * 100}`}
              >
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="platform">
        <div className="pageShell">
          <div className={styles.platformShell}>
            <div className={styles.platformHeader}>
              <div className={styles.sectionIntro}>
                <p className="eyebrow">Platform map</p>
                <h2>One core workspace with four visible signal layers.</h2>
                <p>
                  The page now explains GenoNexus in a cleaner order: what enters the platform,
                  how signal is generated, and where trust stays visible.
                </p>
              </div>

              <div className={styles.platformSummary}>
                {PLATFORM_SUMMARY.map((item) => (
                  <article key={item.label} className={styles.platformSummaryCard}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.meshBoard}>
              <div className={styles.meshGlow} />

              <div className={styles.meshCore}>
                <span>GenoNexus Core</span>
                <strong>Live orchestration</strong>
                <p>DNA data moves through guided steps instead of disconnected tools.</p>
              </div>

              {PLATFORM_SIGNALS.map((signal) => (
                <article
                  key={signal.title}
                  className={`${styles.meshNode} ${styles[signal.position]}`}
                >
                  <span>{signal.label}</span>
                  <h3>{signal.title}</h3>
                  <p>{signal.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.workspaceSection}`} id="workflow">
        <div className="pageShell">
          <div className={styles.workflowStack}>
            <div className={styles.workflowIntro}>
              <p className="eyebrow">Workflow</p>
              <h2>Short journey. Clear states.</h2>
              <p>
                The workflow section now reads in one sequence: guided steps first, interactive
                workspace second.
              </p>
            </div>

            <div className={styles.workflowShowcase}>
              <div className={styles.workflowRail}>
                {WORKFLOW_STEPS.map((item, index) => (
                  <article
                    key={item.step}
                    className={`${styles.workflowStep} animate-fade-in-up delay-${index * 100}`}
                  >
                    <span className={styles.workflowBadge}>{item.step}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>

              <article className={styles.workspacePanel}>
                <div className={styles.workspaceHeader}>
                  <div>
                    <p className={styles.panelEyebrow}>Interactive surfaces</p>
                    <h2>Show the product through motion, states, and data cues.</h2>
                  </div>
                  <span className={styles.workspaceStatus}>Guided mode</span>
                </div>

                <div className={styles.workspaceTabs}>
                  <span className={`${styles.workspaceTab} ${styles.workspaceTabActive}`}>
                    Upload
                  </span>
                  <span className={styles.workspaceTab}>Interpret</span>
                  <span className={styles.workspaceTab}>Report</span>
                </div>

                <div className={styles.pipelineCanvas}>
                  {WORKSPACE_VIEWS.map((view) => (
                    <article key={view.stage} className={styles.pipelineNode}>
                      <span className={styles.nodeKicker}>{view.stage}</span>
                      <strong>{view.value}</strong>
                      <p>{view.caption}</p>
                      <div className={styles.track}>
                        <span style={{ width: view.progress }} />
                      </div>
                    </article>
                  ))}
                </div>

                <div className={styles.workspaceMiniGrid}>
                  <div className={styles.miniPanel}>
                    <p className={styles.miniLabel}>Signal mix</p>
                    <div className={styles.signalBars}>
                      {SIGNAL_MIX.map((item) => (
                        <div key={item.label} className={styles.barRow}>
                          <span>{item.label}</span>
                          <div className={styles.barTrack}>
                            <span style={{ width: item.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.miniPanel}>
                    <p className={styles.miniLabel}>Audit trail</p>
                    <div className={styles.auditList}>
                      {AUDIT_EVENTS.map((item) => (
                        <div key={item} className={styles.auditItem}>
                          <span className={styles.auditDot} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="report">
        <div className="pageShell">
          <div className={styles.reportLayout}>
            <article className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <div>
                  <p className={styles.reportMeta}>Clinical preview</p>
                  <h2>Medication safety dossier</h2>
                </div>
                <span className={styles.reportPill}>Priority review</span>
              </div>

              <div className={styles.reportSummary}>
                <div>
                  <span className={styles.reportLabel}>Patient ID</span>
                  <strong>GN-88392</strong>
                </div>
                <div>
                  <span className={styles.reportLabel}>Guideline layer</span>
                  <strong>CPIC aligned</strong>
                </div>
                <div>
                  <span className={styles.reportLabel}>Status</span>
                  <strong>Ready to share</strong>
                </div>
              </div>

              <div className={styles.findingTable}>
                {REPORT_FINDINGS.map((finding) => (
                  <div key={finding.gene} className={styles.findingRow}>
                    <strong>{finding.gene}</strong>
                    <span>{finding.phenotype}</span>
                    <p>{finding.implication}</p>
                  </div>
                ))}
              </div>

              <div className={styles.reportNote}>
                <p className={styles.reportNoteLabel}>Design goal</p>
                <p>
                  High-priority signals lead the report, and the recommended action stays readable
                  at a glance.
                </p>
              </div>
            </article>

            <aside className={styles.trustStack}>
              <div className={styles.trustIntro}>
                <p className="eyebrow">Trust layer</p>
                <h2>Less marketing noise, more usable confidence.</h2>
                <p>
                  Clear evidence, visible governance, and calmer hierarchy make the platform feel
                  credible faster.
                </p>
              </div>

              {TRUST_SIGNALS.map((item) => (
                <article key={item.title} className={styles.trustCard}>
                  <span className={styles.trustTag}>{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section} id="faq">
        <div className="pageShell">
          <div className="sectionHeader">
            <h2>Keep the answers short and the interface obvious.</h2>
            <p>
              A few concise answers still help conversion when the product handles genomic data.
            </p>
          </div>

          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className="pageShell">
          <div className={styles.ctaCard}>
            <div>
              <p className="eyebrow">Workspace access</p>
              <h2>Open the secure workspace and start with the first real flow.</h2>
              <p>
                The landing page now leads directly into onboarding instead of stopping at a
                marketing shell.
              </p>
            </div>

            <div className={styles.ctaActions}>
              <Link className="buttonPrimary" href="/register">
                Create account
              </Link>
              <Link className="buttonGhost" href="/login">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`pageShell ${styles.footerGrid}`}>
          <div>
            <h3>GenoNexus</h3>
            <p>
              Genomics intelligence for medication safety, clinical review, and governed data
              operations.
            </p>
          </div>

          <div>
            <h4>Workspace</h4>
            <div className={styles.footerLinks}>
              <Link href="/register">Create account</Link>
              <Link href="/login">Sign in</Link>
            </div>
          </div>

          <div>
            <h4>Explore</h4>
            <div className={styles.footerLinks}>
              <a href="#platform">Platform</a>
              <a href="#workflow">Workflow</a>
              <a href="#report">Report</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
