import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DnaHelix } from "@/components/marketing/dna-helix";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import styles from "./page.module.css";

const MENU_ITEMS = [
  { label: "Dashboard", tag: "01", href: "#overview", active: true },
  { label: "Upload DNA", tag: "02", href: "#upload", active: false },
  { label: "Analysis", tag: "03", href: "#analysis", active: false },
  { label: "Predictions", tag: "04", href: "#predictions", active: false },
  { label: "Visualization", tag: "05", href: "#visualization", active: false },
  { label: "Reports", tag: "06", href: "#reports", active: false },
  { label: "Settings", tag: "07", href: "#settings", active: false }
] as const;

const SUMMARY_CARDS = [
  { label: "Total Genes Analyzed", value: "18,482", note: "+4.2% this week", tone: "primary" },
  { label: "Mutation Count", value: "276", note: "19 urgent markers", tone: "risk" },
  { label: "Risk Level", value: "Medium", note: "2 cohorts escalated", tone: "warning" },
  { label: "AI Confidence Score", value: "94.7%", note: "Model drift stable", tone: "safe" }
] as const;

const UPLOAD_FILES = [
  { name: "patient_20481.vcf", format: "VCF", status: "Validated", progress: "100%" },
  { name: "oncology_panel.fastq", format: "FASTQ", status: "Parsing", progress: "74%" },
  { name: "carrier_profile.fasta", format: "FASTA", status: "Queued", progress: "41%" }
] as const;

const REGIONS = [
  { gene: "BRCA1", region: "Exon 11 hotspot", severity: "high", coverage: "92%" },
  { gene: "TP53", region: "Codon 248", severity: "high", coverage: "88%" },
  { gene: "CYP2C19", region: "Drug-response locus", severity: "medium", coverage: "79%" }
] as const;

const MUTATIONS = [
  { gene: "CYP2D6", variant: "*1xN", severity: "medium", confidence: "93%" },
  { gene: "SLCO1B1", variant: "c.521T>C", severity: "medium", confidence: "90%" },
  { gene: "BRCA1", variant: "c.68_69delAG", severity: "high", confidence: "97%" },
  { gene: "EGFR", variant: "L858R", severity: "low", confidence: "87%" }
] as const;

const PREDICTIONS = [
  {
    title: "Cardiometabolic risk",
    risk: "72%",
    confidence: "95%",
    insight: "Long-term lipid sensitivity is elevated.",
    tone: "warning"
  },
  {
    title: "Breast cancer susceptibility",
    risk: "64%",
    confidence: "97%",
    insight: "Variant cluster suggests high-priority surveillance.",
    tone: "risk"
  },
  {
    title: "Drug response instability",
    risk: "58%",
    confidence: "92%",
    insight: "Several loci support non-standard medication response.",
    tone: "primary"
  }
] as const;

const OUTBREAK_PAST = [22, 28, 31, 38, 44, 51, 57];
const OUTBREAK_FUTURE = [63, 70, 78, 86];
const OUTBREAK_LABELS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

const DRUGS_GOOD = [
  { name: "Prasugrel", note: "Alternative pathway for CYP2C19 risk.", score: "88%", tone: "safe" },
  { name: "Rosuvastatin", note: "Lower transporter burden.", score: "81%", tone: "primary" },
  { name: "Tamoxifen review", note: "Confirm CYP2D6 phenotype first.", score: "69%", tone: "warning" }
] as const;

const DRUGS_AVOID = [
  { name: "Codeine-heavy regimen", note: "Rapid metabolism may distort response.", score: "High risk", tone: "risk" },
  { name: "High-dose simvastatin", note: "Transporter signal raises sensitivity.", score: "Moderate risk", tone: "warning" }
] as const;

const VIEWER_STATS = [
  { label: "Viewer mode", value: "3D helix" },
  { label: "Highlighted loci", value: "12" },
  { label: "Zoom depth", value: "38x" },
  { label: "Interactive nodes", value: "Live" }
] as const;

const TIMELINE_VALUES = [21, 29, 35, 43, 56, 64, 74];
const TIMELINE_LABELS = ["Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027"];

const SETTINGS = [
  { label: "AI autoprioritization", detail: "Promote urgent variants to the top.", enabled: true },
  { label: "Clinician export gating", detail: "Require governance checks before release.", enabled: true },
  { label: "Outbreak alert auto-ping", detail: "Trigger warnings when forecast accelerates.", enabled: false }
] as const;

const CHAT_MESSAGES = [
  { role: "ai", title: "Genome Copilot", text: "BRCA1 and CYP2C19 are the highest-value review targets right now." },
  { role: "user", title: "You", text: "Summarize the biggest medication risk in plain clinical language." },
  { role: "ai", title: "Genome Copilot", text: "Clopidogrel response may be reduced, so an alternative antiplatelet should be reviewed before sign-off." }
] as const;

const CHAT_SUGGESTIONS = [
  "Explain the outbreak forecast",
  "Why is BRCA1 high priority?",
  "Generate a clinician summary"
] as const;

type Tone = "primary" | "safe" | "warning" | "risk";
type Severity = "low" | "medium" | "high";
type ChartPoint = { x: number; y: number };

function chartPoints(values: readonly number[], width: number, height: number, padding = 18) {
  const min = 0;
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);

    return { x, y };
  });
}

function pointString(points: ChartPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function toneClass(tone: Tone) {
  switch (tone) {
    case "safe":
      return styles.toneSafe;
    case "warning":
      return styles.toneWarning;
    case "risk":
      return styles.toneRisk;
    default:
      return styles.tonePrimary;
  }
}

function severityClass(severity: Severity) {
  switch (severity) {
    case "high":
      return styles.severityHigh;
    case "medium":
      return styles.severityMedium;
    default:
      return styles.severityLow;
  }
}

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

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const userInitials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "GN";

  const outbreakWidth = 520;
  const outbreakHeight = 220;
  const outbreakAll = [...OUTBREAK_PAST, ...OUTBREAK_FUTURE];
  const outbreakPoints = chartPoints(outbreakAll, outbreakWidth, outbreakHeight);
  const outbreakPast = outbreakPoints.slice(0, OUTBREAK_PAST.length);
  const outbreakFuture = outbreakPoints.slice(OUTBREAK_PAST.length - 1);

  const timelineWidth = 700;
  const timelineHeight = 220;
  const timeline = chartPoints(TIMELINE_VALUES, timelineWidth, timelineHeight);

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarBrand}>
              <span className={styles.sidebarBadge}>GN</span>
              <div>
                <strong>GenoNexus</strong>
                <span>AI Genomics Command</span>
              </div>
            </div>

            <div className={styles.sidebarIntro}>
              <p className={styles.sidebarEyebrow}>Mission status</p>
              <h2>Genomics intelligence built for researchers and clinicians.</h2>
              <p>NASA dashboard energy, AI lab rigor, hospital-safe controls.</p>
            </div>

            <nav className={styles.sidebarNav} aria-label="Dashboard menu">
              {MENU_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`${styles.menuItem} ${item.active ? styles.menuItemActive : ""}`}
                >
                  <span className={styles.menuTag}>{item.tag}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>

            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <span className={styles.liveIndicator} />
                <strong>System pulse</strong>
              </div>
              <div className={styles.sidebarPulseGrid}>
                <div className={`${styles.sidebarPulseCard} ${styles.tonePrimary}`}>
                  <span>Sequencer feed</span>
                  <strong>91%</strong>
                </div>
                <div className={`${styles.sidebarPulseCard} ${styles.toneWarning}`}>
                  <span>Urgent review</span>
                  <strong>12</strong>
                </div>
                <div className={`${styles.sidebarPulseCard} ${styles.toneSafe}`}>
                  <span>Reports cleared</span>
                  <strong>04</strong>
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.contentShell}>
            <header className={styles.topbar}>
              <Link className={styles.topbarBrand} href="/">
                <Image
                  src="/dna-icon.svg"
                  alt="GenoNexus Logo"
                  width={40}
                  height={40}
                  className={styles.topbarMark}
                  priority
                />
                <div>
                  <strong>GenoNexus</strong>
                  <span>AI-powered genomics dashboard</span>
                </div>
              </Link>

              <label className={styles.searchBar}>
                <span>Search</span>
                <input type="search" placeholder="Genes, variants, cohorts, reports, AI queries" />
              </label>

              <div className={styles.topbarTools}>
                <button type="button" className={styles.notificationButton}>
                  <span>03</span>
                  Alerts
                </button>

                <div className={styles.profileCard}>
                  <span className={styles.profileAvatar}>{userInitials}</span>
                  <div className={styles.profileMeta}>
                    <strong>{fullName || user.firstName}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>

                <form action="/api/auth/logout" method="post">
                  <button className={styles.signOut} type="submit">
                    Sign out
                  </button>
                </form>
              </div>
            </header>

            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>
                <section className={styles.overviewPanel} id="overview">
                  <div className={styles.overviewCopy}>
                    <p className={styles.kicker}>Futuristic medical AI workspace</p>
                    <h1>Operate GenoNexus like a live genomic mission-control system.</h1>
                    <p>
                      Welcome back, {user.firstName}. Intake, mutation triage, predictions,
                      outbreak forecasting, drug guidance, and DNA visualization now live in one
                      high-tech medical surface.
                    </p>
                    <div className={styles.badgeRow}>
                      <span>AI lab orchestration</span>
                      <span>Clinical-grade review</span>
                      <span>Governance visible</span>
                    </div>
                  </div>

                  <div className={styles.overviewSignal}>
                    <span className={styles.signalLabel}>AI mission board</span>
                    <strong>Outbreak Increasing</strong>
                    <p>Surveillance forecast is rising above the safe baseline for the next cycle.</p>
                    <div className={styles.signalBars}>
                      <div><span>Upload lanes</span><strong>86%</strong></div>
                      <div><span>Mutation triage</span><strong>72%</strong></div>
                      <div><span>Clinical export</span><strong>91%</strong></div>
                    </div>
                  </div>
                </section>

                <section className={styles.summaryGrid} aria-label="Summary cards">
                  {SUMMARY_CARDS.map((card) => (
                    <article key={card.label} className={`${styles.summaryCard} ${toneClass(card.tone)}`}>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                      <p>{card.note}</p>
                    </article>
                  ))}
                </section>

                <section className={styles.panelGridTwo}>
                  <article className={styles.panel} id="upload">
                    <div className={styles.panelHeader}>
                      <div>
                        <p className={styles.panelEyebrow}>DNA upload</p>
                        <h2>Drag-and-drop intake for FASTA, FASTQ, and VCF</h2>
                      </div>
                      <span className={styles.panelPill}>Encrypted intake</span>
                    </div>

                    <div className={styles.uploadGrid}>
                      <div className={styles.uploadZone}>
                        <div className={styles.uploadBadge}>AI-assisted parsing</div>
                        <strong>Drop files into the secure genomics lane</strong>
                        <p>Validation, normalization, and queueing begin immediately.</p>
                        <div className={styles.uploadActions}>
                          <button type="button" className={styles.primaryAction}>Select files</button>
                          <button type="button" className={styles.secondaryAction}>Start parse</button>
                        </div>
                      </div>

                      <div className={styles.fileList}>
                        {UPLOAD_FILES.map((file) => (
                          <article key={file.name} className={styles.fileCard}>
                            <div className={styles.fileHeader}>
                              <div>
                                <strong>{file.name}</strong>
                                <p>{file.format}</p>
                              </div>
                              <span>{file.status}</span>
                            </div>
                            <div className={styles.progressTrack}>
                              <span style={{ width: file.progress }} />
                            </div>
                            <div className={styles.fileMeta}>
                              <span>{file.progress} complete</span>
                              <span>Live status</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </article>

                  <article className={styles.panel} id="analysis">
                    <div className={styles.panelHeader}>
                      <div>
                        <p className={styles.panelEyebrow}>Mutation analysis</p>
                        <h2>Highlighted regions and severity-coded gene table</h2>
                      </div>
                      <span className={`${styles.panelPill} ${styles.panelPillRisk}`}>2 urgent loci</span>
                    </div>

                    <div className={styles.regionGrid}>
                      {REGIONS.map((region) => (
                        <article key={region.gene} className={styles.regionCard}>
                          <div className={styles.regionHeader}>
                            <div>
                              <strong>{region.gene}</strong>
                              <p>{region.region}</p>
                            </div>
                            <span className={`${styles.severityPill} ${severityClass(region.severity)}`}>
                              {region.severity}
                            </span>
                          </div>
                          <div className={styles.progressTrack}>
                            <span style={{ width: region.coverage }} />
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className={styles.tableShell}>
                      <table className={styles.mutationTable}>
                        <thead>
                          <tr>
                            <th>Gene</th>
                            <th>Variant</th>
                            <th>Severity</th>
                            <th>Confidence</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {MUTATIONS.map((item) => (
                            <tr key={item.gene + item.variant}>
                              <td>{item.gene}</td>
                              <td>{item.variant}</td>
                              <td>
                                <span className={`${styles.tableSeverity} ${severityClass(item.severity)}`}>
                                  {item.severity}
                                </span>
                              </td>
                              <td>{item.confidence}</td>
                              <td>
                                <button type="button" className={styles.inspectButton}>Inspect</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </section>

                <section className={styles.panelGridTwo} id="predictions">
                  <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <div>
                        <p className={styles.panelEyebrow}>AI prediction panel</p>
                        <h2>Disease risk, confidence scores, and recommendation insights</h2>
                      </div>
                      <span className={styles.panelPill}>Model confidence live</span>
                    </div>

                    <div className={styles.predictionList}>
                      {PREDICTIONS.map((item) => (
                        <article key={item.title} className={`${styles.predictionCard} ${toneClass(item.tone)}`}>
                          <div className={styles.predictionHeader}>
                            <div>
                              <strong>{item.title}</strong>
                              <p>{item.insight}</p>
                            </div>
                            <div className={styles.predictionMeta}>
                              <span>{item.risk}</span>
                              <small>{item.confidence} confidence</small>
                            </div>
                          </div>
                          <div className={styles.progressTrack}>
                            <span style={{ width: item.risk }} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <div>
                        <p className={styles.panelEyebrow}>Outbreak prediction graph</p>
                        <h2>Past signal versus dashed future forecast</h2>
                      </div>
                      <span className={`${styles.panelPill} ${styles.panelPillRisk}`}>Outbreak Increasing</span>
                    </div>

                    <div className={styles.chartLegend}>
                      <div className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.legendSolid}`} />Past data</div>
                      <div className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.legendDashed}`} />Future prediction</div>
                    </div>

                    <div className={styles.chartShell}>
                      <svg viewBox={`0 0 ${outbreakWidth} ${outbreakHeight}`} className={styles.chartSvg} role="img" aria-label="Outbreak prediction graph">
                        <polyline points={pointString(outbreakPast)} fill="none" stroke="#49b4ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points={pointString(outbreakFuture)} fill="none" stroke="#b882ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 10" />
                        {outbreakPast.map((point, index) => (
                          <circle key={`past-${OUTBREAK_LABELS[index]}`} cx={point.x} cy={point.y} r="4.5" fill="#49b4ff" />
                        ))}
                        {outbreakFuture.map((point, index) => (
                          <circle key={`future-${index}`} cx={point.x} cy={point.y} r="4.5" fill="#b882ff" />
                        ))}
                      </svg>
                      <div className={styles.chartLabels}>
                        {OUTBREAK_LABELS.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                </section>

                <section className={styles.panelGridTwo}>
                  <article className={styles.panel} id="reports">
                    <div className={styles.panelHeader}>
                      <div>
                        <p className={styles.panelEyebrow}>Drug recommendation</p>
                        <h2>Suggested and avoided therapies with effectiveness signals</h2>
                      </div>
                      <span className={styles.panelPill}>Pharmacogenomics ready</span>
                    </div>

                    <div className={styles.drugColumns}>
                      <div className={styles.drugColumn}>
                        <h3>Suggested drugs</h3>
                        <div className={styles.drugList}>
                          {DRUGS_GOOD.map((item) => (
                            <article key={item.name} className={`${styles.drugCard} ${toneClass(item.tone)}`}>
                              <div className={styles.drugHeader}>
                                <strong>{item.name}</strong>
                                <span>{item.score}</span>
                              </div>
                              <p>{item.note}</p>
                            </article>
                          ))}
                        </div>
                      </div>

                      <div className={styles.drugColumn}>
                        <h3>Avoid drugs</h3>
                        <div className={styles.drugList}>
                          {DRUGS_AVOID.map((item) => (
                            <article key={item.name} className={`${styles.drugCard} ${toneClass(item.tone)}`}>
                              <div className={styles.drugHeader}>
                                <strong>{item.name}</strong>
                                <span>{item.score}</span>
                              </div>
                              <p>{item.note}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <div>
                        <p className={styles.panelEyebrow}>Health timeline graph</p>
                        <h2>Smooth progression of future risk across the next review horizon</h2>
                      </div>
                      <span className={styles.panelPill}>Future trajectory</span>
                    </div>

                    <div className={styles.chartShell}>
                      <svg viewBox={`0 0 ${timelineWidth} ${timelineHeight}`} className={styles.chartSvg} role="img" aria-label="Health timeline graph">
                        <polyline points={pointString(timeline)} fill="none" stroke="#2cffc4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        {timeline.map((point, index) => (
                          <circle key={TIMELINE_LABELS[index]} cx={point.x} cy={point.y} r="5" fill="#2cffc4" />
                        ))}
                      </svg>
                      <div className={styles.chartLabels}>
                        {TIMELINE_LABELS.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                </section>

                <section className={`${styles.panel} ${styles.visualizationPanel}`} id="visualization">
                  <div className={styles.panelHeader}>
                    <div>
                      <p className={styles.panelEyebrow}>DNA visualization</p>
                      <h2>3D helix viewer with zoom, rotate, and highlight controls</h2>
                    </div>
                    <div className={styles.viewerControls}>
                      <button type="button" className={styles.viewerControl}>Zoom</button>
                      <button type="button" className={styles.viewerControl}>Rotate</button>
                      <button type="button" className={styles.viewerControl}>Highlight</button>
                    </div>
                  </div>

                  <div className={styles.viewerStats}>
                    {VIEWER_STATS.map((item) => (
                      <article key={item.label} className={styles.viewerStatCard}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </article>
                    ))}
                  </div>

                  <div className={styles.viewerFrame}>
                    <DnaHelix variant="dashboard" />
                  </div>
                </section>

                <section className={styles.panel} id="settings">
                  <div className={styles.panelHeader}>
                    <div>
                      <p className={styles.panelEyebrow}>Settings</p>
                      <h2>Operational switches for the AI healthcare workflow</h2>
                    </div>
                    <span className={styles.panelPill}>Secure defaults</span>
                  </div>

                  <div className={styles.settingsList}>
                    {SETTINGS.map((item) => (
                      <article key={item.label} className={styles.settingRow}>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.detail}</p>
                        </div>
                        <span className={`${styles.settingToggle} ${item.enabled ? styles.settingToggleOn : styles.settingToggleOff}`}>
                          {item.enabled ? "On" : "Off"}
                        </span>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <aside className={styles.chatPanel}>
                <div className={styles.chatHeader}>
                  <div>
                    <p className={styles.panelEyebrow}>AI chatbot panel</p>
                    <h2>Genome Copilot</h2>
                  </div>
                  <span className={styles.chatStatus}>Online</span>
                </div>

                <div className={styles.chatMessages}>
                  {CHAT_MESSAGES.map((message, index) => (
                    <article
                      key={`${message.role}-${index}`}
                      className={`${styles.chatBubble} ${message.role === "ai" ? styles.chatBubbleAi : styles.chatBubbleUser}`}
                    >
                      <span className={styles.chatBubbleLabel}>{message.title}</span>
                      <p>{message.text}</p>
                    </article>
                  ))}
                </div>

                <div className={styles.chatSuggestions}>
                  {CHAT_SUGGESTIONS.map((item) => (
                    <button key={item} type="button" className={styles.chatChip}>
                      {item}
                    </button>
                  ))}
                </div>

                <form className={styles.chatComposer}>
                  <input type="text" placeholder="Ask about variants, disease risk, or therapy guidance..." />
                  <button type="submit" className={styles.primaryAction}>Send</button>
                </form>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
