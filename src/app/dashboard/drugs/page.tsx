"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Severity = "high" | "medium";
type ProfileMode = "no_data" | "baseline" | "variant_guided";
type CpicLevel = "A" | "B" | "C";
type Phenotype =
  | "poor_metabolizer"
  | "intermediate_metabolizer"
  | "normal_metabolizer"
  | "rapid_metabolizer"
  | "ultrarapid_metabolizer"
  | "normal_function"
  | "decreased_function"
  | "increased_sensitivity"
  | "deficient";

interface DrugItem {
  name: string;
  score: number;
  gene: string;
  note: string;
  pathways: string[];
  variantEvidence: string;
  guideline: string;
  severity?: Severity;
  cpicLevel: CpicLevel;
  fdaWarning: boolean;
  dosingGuidance: string;
}

interface MetabolicEnzyme {
  enzyme: string;
  geneFullName: string;
  status: string;
  phenotype: Phenotype;
  description: string;
  evidence: string;
  diplotype: string;
}

interface PrescribingProfile {
  hasData: boolean;
  fileName?: string;
  source: string;
  mode: ProfileMode;
  generatedAt: string;
  coverage: {
    pharmacogeneVariants: number;
    totalVariants: number;
    genesTested: number;
    genesWithFindings: number;
    genes: string[];
    limitations: string[];
  };
  metabolicProfile: MetabolicEnzyme[];
  favorable: DrugItem[];
  avoid: DrugItem[];
}

const emptyProfile: PrescribingProfile = {
  hasData: false,
  source: "CPIC/FDA Pharmacogenomics Decision Support",
  mode: "no_data",
  generatedAt: "",
  coverage: {
    pharmacogeneVariants: 0,
    totalVariants: 0,
    genesTested: 9,
    genesWithFindings: 0,
    genes: [],
    limitations: ["No completed analysis is available yet."],
  },
  metabolicProfile: [],
  favorable: [],
  avoid: [],
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.31" />
      <path d="M14 9.3V2" />
      <path d="M8.5 2h7" />
      <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
      <path d="M5.5 16.5h13" />
      <path d="M12 13v7" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function statusLabel(mode: ProfileMode) {
  if (mode === "variant_guided") return "Variant evidence linked";
  if (mode === "baseline") return "Baseline guideline mode";
  return "Analysis required";
}

function statusTone(mode: ProfileMode) {
  if (mode === "variant_guided") return styles.statusSuccess;
  if (mode === "baseline") return styles.statusWarning;
  return styles.statusMuted;
}

function scoreText(drug: DrugItem) {
  return drug.severity ? `${100 - drug.score}%` : `${drug.score}%`;
}

export default function DrugsPage() {
  const [profile, setProfile] = useState<PrescribingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPathway, setSelectedPathway] = useState("All");
  const [selectedDrug, setSelectedDrug] = useState<DrugItem | null>(null);

  const fetchProfile = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/copilot/pharmacogenomics", {
        signal,
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with HTTP ${response.status}`);
      }

      setProfile(data as PrescribingProfile);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setProfile(null);
      setError((err as Error).message || "Failed to load pharmacogenomics profile.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfile(controller.signal);
    return () => controller.abort();
  }, [fetchProfile]);

  useEffect(() => {
    if (!selectedDrug) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDrug(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDrug]);

  const activeProfile = profile ?? emptyProfile;

  const allDrugs = useMemo(
    () => [...activeProfile.favorable, ...activeProfile.avoid],
    [activeProfile.avoid, activeProfile.favorable],
  );

  const allPathways = useMemo(
    () => [
      "All",
      ...Array.from(new Set(allDrugs.flatMap((drug) => drug.pathways))).sort((a, b) => a.localeCompare(b)),
    ],
    [allDrugs],
  );

  const browseOptions = useMemo(() => {
    const drugNames = Array.from(new Set(allDrugs.map((drug) => drug.name))).sort((a, b) => a.localeCompare(b));
    const genes = Array.from(new Set(allDrugs.map((drug) => drug.gene))).sort((a, b) => a.localeCompare(b));
    return { drugNames, genes };
  }, [allDrugs]);

  const filteredDrugs = useCallback(
    (list: DrugItem[]) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();

      return list.filter((drug) => {
        const matchesSearch =
          !normalizedQuery ||
          drug.name.toLowerCase().includes(normalizedQuery) ||
          drug.gene.toLowerCase().includes(normalizedQuery) ||
          drug.pathways.some((pathway) => pathway.toLowerCase().includes(normalizedQuery));
        const matchesPathway = selectedPathway === "All" || drug.pathways.includes(selectedPathway);
        return matchesSearch && matchesPathway;
      });
    },
    [searchQuery, selectedPathway],
  );

  const filteredFavorable = filteredDrugs(activeProfile.favorable);
  const filteredAvoid = filteredDrugs(activeProfile.avoid);
  const generatedAt = activeProfile.generatedAt
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(activeProfile.generatedAt))
    : "Pending";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerMeta}>
            <div className={styles.eyebrow}>
              <span className={styles.iconSm}>
                <FlaskIcon />
              </span>
              Precision Prescribing Engine
            </div>
            <span className={`${styles.statusPill} ${statusTone(activeProfile.mode)}`}>
              <span className={styles.statusDot} />
              {statusLabel(activeProfile.mode)}
            </span>
          </div>
          <h1 className={styles.title}>Pharmacogenomics</h1>
          <p className={styles.subtitle}>
            Evidence-based prescribing support from the latest completed genome comparison, with transparent coverage,
            guideline source, and variant evidence for each recommendation.
          </p>
        </div>
      </header>

      {loading ? (
        <section className={styles.loadingPanel} aria-live="polite">
          <div className={styles.spinner} />
          <div>
            <h2>Building prescribing profile</h2>
            <p>Reading comparison results and matching actionable pharmacogene evidence.</p>
          </div>
        </section>
      ) : (
        <>
          {error && (
            <section className={styles.alertDanger} role="alert">
              <span className={styles.alertIcon}>
                <WarningIcon />
              </span>
              <div>
                <strong>Unable to load pharmacogenomics profile</strong>
                <p>{error}</p>
              </div>
              <button type="button" className={styles.retryButton} onClick={() => void fetchProfile()}>
                Retry
              </button>
            </section>
          )}

          {!error && (
            <>
              <section className={styles.insightStrip} aria-label="Pharmacogenomics profile summary">
                <div className={styles.insightItem}>
                  <span className={styles.mutedLabel}>Genome Source</span>
                  <strong>{activeProfile.fileName || "No completed analysis"}</strong>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.mutedLabel}>Genes Tested</span>
                  <strong>{activeProfile.coverage.genesTested ?? activeProfile.metabolicProfile.length}</strong>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.mutedLabel}>Actionable Findings</span>
                  <strong>{activeProfile.coverage.genesWithFindings ?? 0}</strong>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.mutedLabel}>Pharmacogene Variants</span>
                  <strong>{activeProfile.coverage.pharmacogeneVariants}</strong>
                </div>
                <div className={styles.insightItem}>
                  <span className={styles.mutedLabel}>Generated</span>
                  <strong>{generatedAt}</strong>
                </div>
              </section>

              {activeProfile.coverage.limitations.length > 0 && (
                <section className={styles.alertInfo}>
                  <span className={styles.alertIcon}>
                    <InfoIcon />
                  </span>
                  <div>
                    <strong>Clinical use notice</strong>
                    <p>{activeProfile.coverage.limitations[0]}</p>
                  </div>
                </section>
              )}

              <div className={styles.layout}>
                <main className={styles.mainContent}>
                  <section className={styles.controlsPanel} aria-label="Drug and pathway filters">
                    <div className={styles.searchGrid}>
                      <label className={styles.searchField}>
                        <span>Search drug, gene, or pathway</span>
                        <input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Try CYP2C19, warfarin, lipid..."
                        />
                      </label>
                      <label className={styles.searchField}>
                        <span>Browse available matches</span>
                        <select
                          value=""
                          onChange={(event) => setSearchQuery(event.target.value)}
                          aria-label="Browse available drugs and genes"
                        >
                          <option value="">Select a drug or gene</option>
                          <optgroup label="Medications">
                            {browseOptions.drugNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Genes">
                            {browseOptions.genes.map((gene) => (
                              <option key={gene} value={gene}>
                                {gene}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </label>
                    </div>

                    <div className={styles.tagList} aria-label="Pathway filters">
                      {allPathways.map((pathway) => (
                        <button
                          key={pathway}
                          type="button"
                          onClick={() => setSelectedPathway(pathway)}
                          className={`${styles.filterTag} ${selectedPathway === pathway ? styles.filterTagActive : ""}`}
                          aria-pressed={selectedPathway === pathway}
                        >
                          {pathway}
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className={styles.columns}>
                    <DrugColumn
                      title="Favorable Response"
                      subtitle={`${filteredFavorable.length} matched recommendation${filteredFavorable.length === 1 ? "" : "s"}`}
                      tone="success"
                      drugs={filteredFavorable}
                      emptyText="No favorable response matches for the current filters."
                      onSelect={setSelectedDrug}
                    />
                    <DrugColumn
                      title="Contraindicated / High Risk"
                      subtitle={`${filteredAvoid.length} flagged recommendation${filteredAvoid.length === 1 ? "" : "s"}`}
                      tone="danger"
                      drugs={filteredAvoid}
                      emptyText="No high-risk matches for the current filters."
                      onSelect={setSelectedDrug}
                    />
                  </div>
                </main>

                <aside className={styles.sidebar}>
                  <div>
                    <span className={styles.mutedLabel}>Metabolic Pathway Status</span>
                    <p className={styles.sidebarIntro}>{activeProfile.source}</p>
                  </div>
                  <div className={styles.pathwayGrid}>
                    {activeProfile.metabolicProfile.map((metabolic) => (
                      <PathwayCard key={metabolic.enzyme} metabolic={metabolic} />
                    ))}
                  </div>
                </aside>
              </div>
            </>
          )}
        </>
      )}

      {selectedDrug && <DrugModal drug={selectedDrug} onClose={() => setSelectedDrug(null)} />}
    </div>
  );
}

function DrugColumn({
  title,
  subtitle,
  tone,
  drugs,
  emptyText,
  onSelect,
}: {
  title: string;
  subtitle: string;
  tone: "success" | "danger";
  drugs: DrugItem[];
  emptyText: string;
  onSelect: (drug: DrugItem) => void;
}) {
  return (
    <section className={styles.column}>
      <div className={`${styles.columnHeader} ${tone === "success" ? styles.headerSuccess : styles.headerDanger}`}>
        <div className={styles.headerIcon}>{tone === "success" ? <CheckIcon /> : <CloseIcon />}</div>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className={styles.drugList}>
        {drugs.map((drug) => (
          <button
            key={`${drug.name}-${drug.gene}-${drug.severity ?? "ok"}`}
            type="button"
            className={`${styles.drugCardButton} ${drug.severity ? styles.cardDanger : styles.cardSuccess}`}
            onClick={() => onSelect(drug)}
          >
            <DrugCard drug={drug} />
          </button>
        ))}

        {drugs.length === 0 && (
          <div className={styles.emptyState}>
            <span>{tone === "success" ? <CheckIcon /> : <InfoIcon />}</span>
            <p>{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DrugCard({ drug }: { drug: DrugItem }) {
  const riskPct = 100 - drug.score;
  const metricValue = drug.severity ? riskPct : drug.score;

  return (
    <>
      {/* Top row: drug name + gene left, badge right */}
      <div className={styles.cardTop}>
        <div className={styles.cardTitleBlock}>
          <h3 className={styles.drugName}>{drug.name}</h3>
          <code className={`${styles.geneTag} ${drug.severity ? styles.geneTagDanger : ""}`}>{drug.gene}</code>
        </div>
        {drug.severity ? (
          <span className={`${styles.sevBadge} ${drug.severity === "high" ? styles.sevHigh : styles.sevMedium}`}>
            <WarningIcon />
            {drug.severity === "high" ? "High risk" : "Elevated"}
          </span>
        ) : (
          <div className={styles.scoreBadge}>
            <span>{drug.score}</span>
            <small>Efficacy</small>
          </div>
        )}
      </div>

      {/* Note – 3 line clamp */}
      <p className={styles.drugNote}>{drug.note}</p>

      {/* Clinical badges row: CPIC level + FDA warning */}
      <div className={styles.cardBadgeRow}>
        <span className={`${styles.cpicBadge} ${styles[`cpic${drug.cpicLevel}`]}`}>
          CPIC Level {drug.cpicLevel}
        </span>
        {drug.fdaWarning && (
          <span className={styles.fdaBadge}>
            <WarningIcon /> FDA Label
          </span>
        )}
        <span className={styles.guidelineText}>{drug.guideline}</span>
      </div>

      {/* Dosing guidance */}
      <div className={styles.dosingRow}>
        <span className={styles.dosingLabel}>Recommended action</span>
        <span className={styles.dosingValue}>{drug.dosingGuidance}</span>
      </div>

      {/* Progress bar – track + percentage */}
      <div
        className={styles.metricRow}
        aria-label={`${drug.severity ? "Risk" : "Efficacy"}: ${scoreText(drug)}`}
      >
        <div className={styles.metricTrack}>
          <div
            className={`${styles.metricFill} ${drug.severity ? styles.metricFillDanger : styles.metricFillSuccess}`}
            style={{ width: `${metricValue}%` }}
          />
        </div>
        <strong>{scoreText(drug)}</strong>
      </div>
    </>
  );
}


function PathwayCard({ metabolic }: { metabolic: MetabolicEnzyme }) {
  const p = metabolic.phenotype;
  const isRisk =
    p === "poor_metabolizer" ||
    p === "decreased_function" ||
    p === "deficient" ||
    p === "increased_sensitivity";
  const isIntermediate = p === "intermediate_metabolizer";
  const isUltrarapid = p === "ultrarapid_metabolizer" || p === "rapid_metabolizer";

  const phenotypeLabel: Record<string, string> = {
    poor_metabolizer: "Poor Metabolizer",
    intermediate_metabolizer: "Intermediate Metabolizer",
    normal_metabolizer: "Normal Metabolizer",
    rapid_metabolizer: "Rapid Metabolizer",
    ultrarapid_metabolizer: "Ultrarapid Metabolizer",
    normal_function: "Normal Function",
    decreased_function: "Decreased Function",
    increased_sensitivity: "Increased Sensitivity",
    deficient: "Deficient",
  };

  const cardClass = isRisk
    ? styles.pathwayCardDanger
    : isIntermediate
      ? styles.pathwayCardWarning
      : isUltrarapid
        ? styles.pathwayCardRapid
        : styles.pathwayCardSuccess;

  const badgeClass = isRisk
    ? styles.phenotypeDanger
    : isIntermediate
      ? styles.phenotypeWarning
      : isUltrarapid
        ? styles.phenotypeRapid
        : styles.phenotypeNormal;

  return (
    <article className={`${styles.pathwayCard} ${cardClass}`}>
      <div className={styles.pathwayHeader}>
        <strong>{metabolic.enzyme}</strong>
        <span className={`${styles.phenotypeBadge} ${badgeClass}`}>
          {phenotypeLabel[metabolic.phenotype] ?? metabolic.status}
        </span>
      </div>
      <p className={styles.geneFullName}>{metabolic.geneFullName}</p>
      <code className={styles.diplotype}>{metabolic.diplotype}</code>
      <p className={styles.pathwayDesc}>{metabolic.description}</p>
    </article>
  );
}

function DrugModal({ drug, onClose }: { drug: DrugItem; onClose: () => void }) {
  const metric = drug.severity ? 100 - drug.score : drug.score;

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <section
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drug-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close drug details">
          <CloseIcon />
        </button>

        <div className={styles.modalHeader}>
          <div className={`${styles.modalIconWrapper} ${drug.severity ? styles.modalIconDanger : styles.modalIconSuccess}`}>
            {drug.severity ? <WarningIcon /> : <FlaskIcon />}
          </div>
          <div>
            <h3 id="drug-detail-title" className={styles.modalTitle}>
              {drug.name}
            </h3>
            <code className={styles.modalGeneTag}>Gene target: {drug.gene}</code>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div>
            <span className={styles.mutedLabel}>Variant Evidence</span>
            <p className={styles.modalEvidenceText}>{drug.variantEvidence}</p>
          </div>

          <div>
            <span className={styles.mutedLabel}>Clinical Recommendation</span>
            <p className={styles.modalNoteText}>{drug.note}</p>
          </div>

          <div>
            <span className={styles.mutedLabel}>Guideline Basis</span>
            <p className={styles.modalNoteText}>{drug.guideline}</p>
          </div>

          <div className={styles.modalDiagnosticBox}>
            <div className={styles.modalDiagnosticHeader}>
              <span>{drug.severity ? "Risk signal" : "Response signal"}</span>
              <strong className={drug.severity ? styles.textDanger : styles.textSuccess}>
                {drug.severity ? "Review required" : "Favorable"}
              </strong>
            </div>
            <div className={styles.modalProgressBarWrapper}>
              <div className={styles.modalProgressBarTrack}>
                <div
                  className={`${styles.modalProgressBarFill} ${
                    drug.severity ? styles.metricFillDanger : styles.metricFillSuccess
                  }`}
                  style={{ width: `${metric}%` }}
                />
              </div>
              <strong className={drug.severity ? styles.textDanger : styles.textSuccess}>{metric}%</strong>
            </div>
          </div>

          <div className={styles.modalFooterInfo}>
            <InfoIcon />
            Clinical decision support only. Confirm genotype and patient context before changing therapy.
          </div>
        </div>
      </section>
    </div>
  );
}
