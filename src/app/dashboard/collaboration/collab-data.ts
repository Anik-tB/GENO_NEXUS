// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "active" | "busy";
  viewing?: string;
  typing?: boolean;
  color: string;
  initials?: string;
}

export interface ChatMessage {
  id: number;
  author: string;
  text: string;
  time: string;
  isAI: boolean;
}

export interface Hypothesis {
  id: string;
  title: string;
  confidence: number;
  active: boolean;
  comments: number;
  avatars: string[];
  tags: string[];
  version: number;
  lastEdited: string;
  annotations: string[];
  chatMessages: ChatMessage[];
}

export interface ActivityEntry {
  id: number;
  type: "model" | "data" | "pipeline" | "note" | "alert" | "mutation";
  author: string;
  desc: string;
  time: string;
  /** Actual JS timestamp so the UI can show live relative times */
  ts?: number;
  region?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  status: "running" | "completed" | "failed" | "paused" | "queued";
  progress: number;
  eta?: string;
  logs: string[];
  stages: PipelineStage[];
}

export interface PipelineStage {
  name: string;
  status: "done" | "active" | "pending";
}

export interface SciAlert {
  id: number;
  type: "critical" | "warning" | "info";
  category: "pathogenic" | "outbreak" | "analysis_failed" | "drug_gene";
  title: string;
  desc: string;
  time: string;
  dismissed: boolean;
}

export interface TimelineEvent {
  id: number;
  type: "version" | "milestone" | "edit" | "access";
  title: string;
  author: string;
  time: string;
  detail: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const TEAM: TeamMember[] = [
  { id: "EH", name: "Dr. E. Hayes", role: "Lead Scientist", status: "online", viewing: "BRCA1 VCF Cohort", color: "#10b981" },
  { id: "RV", name: "Dr. R. Vance", role: "Epidemiologist", status: "offline", color: "#6366f1" },
  { id: "MO", name: "Dr. M. Okafor", role: "Bioinformatician", status: "online", viewing: "WGS Pipeline Config", color: "#f59e0b" },
  { id: "AI", name: "Nexus Copilot", role: "AI Engine v3.2", status: "active", viewing: "Global Mutation Index", color: "#06b6d4" },
  { id: "SK", name: "Dr. S. Kim", role: "Clinical Geneticist", status: "busy", viewing: "Patient Batch 12", color: "#ec4899" },
];

export const HYPOTHESES: Hypothesis[] = [
  {
    id: "H-402",
    title: "Targeted CRISPR knock-out efficiency in lung organoids",
    confidence: 84,
    active: true,
    comments: 3,
    avatars: ["EH", "AI"],
    tags: ["CRISPR", "Lung", "Organoid"],
    version: 4,
    lastEdited: "12 min ago",
    annotations: ["chr17:7674220 — TP53 splice variant", "Batch 3 shows 2.4x knock-out resilience"],
    chatMessages: [
      { id: 1, author: "EH", text: "I've isolated the organoid batches. Seeing high resilience in batch 3.", time: "10:04 AM", isAI: false },
      { id: 2, author: "AI", text: "Analysis confirmed. Batch 3 exhibits anomalous expression of target gene 4B. Statistical significance: p < 0.001. Recommend expanding sample size to n=200.", time: "10:05 AM", isAI: true },
      { id: 3, author: "MO", text: "I can set up an automated pipeline to process the expanded batch. Should I use the WGS or targeted panel?", time: "10:12 AM", isAI: false },
      { id: 4, author: "AI", text: "Recommendation: Use targeted panel for cost efficiency. WGS coverage data from batch 3 suggests 40x depth is sufficient for this variant class.", time: "10:13 AM", isAI: true },
    ]
  },
  {
    id: "H-401",
    title: "Elevated expression of marker genes in drug-resistant strains",
    confidence: 62,
    active: true,
    comments: 7,
    avatars: ["MO", "RV", "AI"],
    tags: ["Drug Resistance", "Expression", "AMR"],
    version: 8,
    lastEdited: "2 hours ago",
    annotations: ["MDR1 overexpression confirmed in 3/5 isolates"],
    chatMessages: [
      { id: 1, author: "RV", text: "The new RNA-seq data from the resistant strains is up. Overexpression of MDR1 is very clear.", time: "08:15 AM", isAI: false },
      { id: 2, author: "AI", text: "Cross-referencing with previous cohorts: MDR1 overexpression is correlated with 72% reduction in drug efficacy.", time: "08:16 AM", isAI: true },
      { id: 3, author: "MO", text: "Could there be an upstream regulatory mutation? Let's check the promoter regions.", time: "08:45 AM", isAI: false },
    ]
  },
  {
    id: "H-399",
    title: "Patient batch 12 covariance anomaly mapping",
    confidence: 91,
    active: false,
    comments: 1,
    avatars: ["RV"],
    tags: ["Covariance", "QC"],
    version: 2,
    lastEdited: "Yesterday",
    annotations: [],
    chatMessages: [
      { id: 1, author: "RV", text: "Noticing a strong batch effect in the PCA plots for batch 12. Anyone else see this?", time: "Yesterday", isAI: false },
      { id: 2, author: "AI", text: "Running QC diagnostics... Batch 12 samples show varying GC content bias. Suggested action: apply strict GC correction.", time: "Yesterday", isAI: true },
    ]
  },
  {
    id: "H-398",
    title: "Novel SARS-CoV-2 spike protein mutation cluster analysis",
    confidence: 73,
    active: true,
    comments: 5,
    avatars: ["SK", "AI", "EH"],
    tags: ["COVID-19", "Spike", "Phylogenetics"],
    version: 6,
    lastEdited: "4 hours ago",
    annotations: ["S:E484K + S:N501Y co-occurrence in 12% of samples"],
    chatMessages: [
      { id: 1, author: "SK", text: "We have a new cluster showing E484K and N501Y co-occurrence.", time: "Yesterday", isAI: false },
      { id: 2, author: "AI", text: "Structural modeling predicts enhanced ACE2 binding affinity by 2.3 kcal/mol.", time: "Yesterday", isAI: true },
      { id: 3, author: "EH", text: "Are there any neutralizing assay results available for this lineage yet?", time: "4 hours ago", isAI: false },
    ]
  },
];

function minsAgo(m: number) { return Date.now() - m * 60_000; }

export const INITIAL_STREAMS: ActivityEntry[] = [
  { id: 1, type: "model",    author: "Nexus Copilot",  desc: "Re-trained BRCA1 pathogenicity model with Cohort #47.",                                              time: "2 min ago",    ts: minsAgo(2) },
  { id: 2, type: "data",     author: "Dr. E. Hayes",   desc: "Uploaded 120 new VCF samples to central storage.",                                                  time: "18 min ago",   ts: minsAgo(18),  region: "chr17:41196312-41277500" },
  { id: 3, type: "pipeline", author: "Dr. M. Okafor", desc: "Optimized alignment script for Nextflow WGS Phase 3.",                                               time: "1 hour ago",   ts: minsAgo(62) },
  { id: 4, type: "mutation", author: "Nexus Copilot",  desc: "Detected novel missense variant in EGFR exon 21 (L858R) — flagged for clinical review.",             time: "1.5 hrs ago",  ts: minsAgo(90),  region: "chr7:55259515" },
  { id: 5, type: "note",     author: "Dr. R. Vance",   desc: "Noted significant deviation in control group telemetry.",                                            time: "3 hours ago",  ts: minsAgo(180) },
  { id: 6, type: "alert",    author: "System",          desc: "Pathogen variant calling pipeline completed with 2 warnings.",                                      time: "4 hours ago",  ts: minsAgo(240) },
];

export const INCOMING_STREAMS: ActivityEntry[] = [
  { id: 100, type: "mutation", author: "Nexus Copilot", desc: "Identified compound heterozygous variants in CFTR gene — cystic fibrosis risk elevated.", time: "just now", region: "chr7:117120017" },
  { id: 101, type: "data", author: "Dr. S. Kim", desc: "Pushed annotated BAM file for Patient 7842 to shared workspace.", time: "just now" },
  { id: 102, type: "pipeline", author: "System", desc: "Pharmacogenomic Risk Score pipeline restarted with updated reference panel.", time: "just now" },
  { id: 103, type: "model", author: "Nexus Copilot", desc: "Clustering analysis reveals 3 distinct haplotype groups in East Asian cohort.", time: "just now" },
  { id: 104, type: "note", author: "Dr. E. Hayes", desc: "Flagged potential batch effect in samples 401-420. Recommending PCA re-analysis.", time: "just now" },
  { id: 105, type: "alert", author: "System", desc: "Memory threshold reached on compute node 3 — load balancer engaged.", time: "just now" },
  { id: 106, type: "mutation", author: "Nexus Copilot", desc: "Rare frameshift deletion detected in BRCA2 c.5946delT — pathogenic classification.", time: "just now", region: "chr13:32914438" },
  { id: 107, type: "data", author: "Dr. M. Okafor", desc: "Merged 45 whole-exome sequencing results into Cohort #48 dataset.", time: "just now" },
];

export const PIPELINES: Pipeline[] = [
  {
    id: "pipe-1",
    name: "Genomic Alignment (WGS)",
    status: "running",
    progress: 68,
    eta: "12 min",
    stages: [
      { name: "FastQC", status: "done" },
      { name: "Trimming", status: "done" },
      { name: "BWA-MEM2", status: "active" },
      { name: "MarkDup", status: "pending" },
      { name: "BQSR", status: "pending" },
    ],
    logs: [
      "[14:22:01] FastQC completed — 98.2% reads passed",
      "[14:28:33] Trimmomatic: 2.1M reads trimmed",
      "[14:35:12] BWA-MEM2 alignment in progress... 68% mapped",
    ],
  },
  {
    id: "pipe-2",
    name: "Pathogen Variant Calling",
    status: "completed",
    progress: 100,
    stages: [
      { name: "Align", status: "done" },
      { name: "Call Variants", status: "done" },
      { name: "Annotate", status: "done" },
    ],
    logs: [
      "[13:01:00] Pipeline completed successfully",
      "[13:00:45] 847 variants annotated via ClinVar",
      "[12:58:22] GATK HaplotypeCaller finished — 1,204 variants called",
    ],
  },
  {
    id: "pipe-3",
    name: "Pharmacogenomic Risk Score",
    status: "failed",
    progress: 42,
    stages: [
      { name: "Ingest", status: "done" },
      { name: "PGx Lookup", status: "done" },
      { name: "Risk Model", status: "active" },
      { name: "Report", status: "pending" },
    ],
    logs: [
      "[ERROR] Risk model inference failed — CUDA OOM on batch 7",
      "[12:44:10] PGx lookup completed for 12 pharmacogenes",
      "[12:40:01] Data ingestion: 340 samples loaded",
    ],
  },
  {
    id: "pipe-4",
    name: "Structural Variant Detection",
    status: "queued",
    progress: 0,
    eta: "~25 min",
    stages: [
      { name: "Pre-filter", status: "pending" },
      { name: "Manta SV", status: "pending" },
      { name: "SURVIVOR Merge", status: "pending" },
    ],
    logs: ["[Queued] Waiting for compute resources..."],
  },
];

export const INITIAL_ALERTS: SciAlert[] = [
  { id: 1, type: "critical", category: "pathogenic", title: "Pathogenic BRCA2 Variant", desc: "Frameshift deletion c.5946delT detected in Patient #7841 — immediate clinical review required.", time: "3 min ago", dismissed: false },
  { id: 2, type: "warning", category: "outbreak", title: "Outbreak Anomaly Detected", desc: "Cluster of 8 genetically similar SARS-CoV-2 sequences from Region 4A within 48 hours.", time: "15 min ago", dismissed: false },
  { id: 3, type: "warning", category: "drug_gene", title: "Drug-Gene Interaction Risk", desc: "CYP2D6 poor metabolizer status in Patient #7839 — codeine contraindicated.", time: "1 hour ago", dismissed: false },
  { id: 4, type: "info", category: "analysis_failed", title: "Analysis Warning", desc: "Whole-genome alignment for sample WGS-0421 completed with 12% unmapped reads (threshold: 10%).", time: "2 hours ago", dismissed: false },
];

export const INCOMING_ALERTS: SciAlert[] = [
  { id: 10, type: "critical", category: "pathogenic", title: "Novel TP53 Splice Variant", desc: "Splice-site mutation c.672+1G>A in TP53 — predicted loss of tumor suppressor function.", time: "just now", dismissed: false },
  { id: 11, type: "warning", category: "drug_gene", title: "HLA-B*5701 Positive", desc: "Patient #7843 positive for HLA-B*5701 — abacavir hypersensitivity risk.", time: "just now", dismissed: false },
  { id: 12, type: "info", category: "analysis_failed", title: "Pipeline Timeout", desc: "Structural variant detection exceeded 30-minute SLA for batch 14.", time: "just now", dismissed: false },
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 1, type: "version", title: "Cohort #47 Dataset v3.1", author: "Dr. E. Hayes", time: "Today 14:22", detail: "Added 120 VCF samples, updated metadata schema" },
  { id: 2, type: "milestone", title: "BRCA1 Model Accuracy 94.2%", author: "Nexus Copilot", time: "Today 13:05", detail: "Re-training completed with expanded training set" },
  { id: 3, type: "edit", title: "H-402 Confidence Updated", author: "Dr. M. Okafor", time: "Today 11:30", detail: "Confidence raised from 78% to 84% based on batch 3 results" },
  { id: 4, type: "access", title: "Dr. S. Kim Joined Workspace", author: "System", time: "Today 09:15", detail: "Granted read-write access to Workspace Alpha" },
  { id: 5, type: "version", title: "Reference Panel v2.8", author: "System", time: "Yesterday", detail: "Updated ClinVar and gnomAD reference databases" },
  { id: 6, type: "edit", title: "Pipeline Config Updated", author: "Dr. M. Okafor", time: "Yesterday", detail: "BWA-MEM2 thread count increased from 8 to 16" },
  { id: 7, type: "milestone", title: "1,000th Variant Annotated", author: "System", time: "2 days ago", detail: "Workspace milestone reached across all cohorts" },
  { id: 8, type: "access", title: "Audit: Export Permission", author: "Dr. R. Vance", time: "3 days ago", detail: "Exported de-identified dataset for IRB review" },
];

export const CHAT_MESSAGES = [
  { id: 1, author: "EH", text: "I've isolated the organoid batches. Seeing high resilience in batch 3.", time: "10:04 AM", isAI: false },
  { id: 2, author: "AI", text: "Analysis confirmed. Batch 3 exhibits anomalous expression of target gene 4B. Statistical significance: p < 0.001. Recommend expanding sample size to n=200.", time: "10:05 AM", isAI: true },
  { id: 3, author: "MO", text: "I can set up an automated pipeline to process the expanded batch. Should I use the WGS or targeted panel?", time: "10:12 AM", isAI: false },
  { id: 4, author: "AI", text: "Recommendation: Use targeted panel for cost efficiency. WGS coverage data from batch 3 suggests 40x depth is sufficient for this variant class.", time: "10:13 AM", isAI: true },
];

// ─── Impact Strip Stats ──────────────────────────────────────────────────────

export const IMPACT_STATS = [
  { label: "Active Researchers", value: 4, icon: "👥", color: "#10b981", suffix: "" },
  { label: "Shared Datasets", value: 23, icon: "📊", color: "#6366f1", suffix: "" },
  { label: "Pipelines Executed", value: 147, icon: "⚡", color: "#f59e0b", suffix: "" },
  { label: "Variants Identified", value: 3842, icon: "🧬", color: "#ec4899", suffix: "" },
  { label: "Collab Score", value: 94, icon: "🏆", color: "#06b6d4", suffix: "%" },
];
