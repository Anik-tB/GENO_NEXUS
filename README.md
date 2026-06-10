# GenoNexus

GenoNexus is a comprehensive, enterprise-grade bioinformatics and genomics platform designed to bridge the gap between genomic research and everyday healthcare. Featuring a revolutionary **Three-Portal Architecture**, it seamlessly connects the lab, the clinic, and the patient. Designed with a premium "Matte Dark" glassmorphic aesthetic, the platform unifies next-generation DNA analysis, artificial intelligence predictions, 3D visualizations, and secure biomedical research collaboration.

---

## 🌐 The Three-Portal Ecosystem

To eliminate the fragmentation in modern healthcare, GenoNexus operates across three dedicated interfaces:

1. **Researcher Portal (`/dashboard`)**: A powerful Command Center for scientists featuring AI-driven DNA analysis, 3D genome visualization, and real-time global collaboration.
2. **Clinical & Caregiver Portal (`/dashboard` / ingestion routes)**: A streamlined interface for doctors and caregivers to seamlessly ingest patient genomic files and coordinate specialist referrals.
3. **Patient Portal (`/user/dashboard`)**: A secure, intuitive dashboard empowering everyday users to easily understand their personal genetic health insights and track their results.

---

## 🌟 Core Features (The 15 Pillars of GenoNexus)

The platform is architected around 15 cutting-edge capabilities divided into four core groups:

### Group A: Genomics & Core Analysis
- **Multi-Format DNA Analyzer**: Process diverse genomic data (FASTA, FASTQ, VCF, BAM) using state-of-the-art bioinformatics algorithms.
- **Dual-Source Reference Input**: Provide reference sequences via **NCBI URL** *or* **local file upload** — the system handles both seamlessly.
- **Variant Pathogenicity Predictor**: AI-driven classification of genetic variants and their disease implications.
- **CRISPR Target Designer**: Precision AI tool for designing guide RNAs and predicting off-target effects.
- **Non-Coding RNA Function Predictor**: Deep learning architecture for predicting ncRNA interactions and pathways.

### Group B: AI & Machine Learning
- **AI Gene Chatbot**: An LLM-powered assistant (RAG-based) for interactive biomedical knowledge retrieval.
- **Drug-Gene Interaction Predictor**: Graph Neural Network-based prediction of pharmacological responses based on genome profiles.
- **Longitudinal Health Trajectory**: Time-series integration of EHR, wearable data, and DNA for personalized health tracking.
- **Disease Outbreak Predictor**: Epidemic forecasting using global sequencing data streams and time-series ML models.

### Group C: Visualization
- **3D / VR Genome Browser**: Interactive WebGL-based visualization of complex genomic sequences and chromosomes.
- **Digital Cell Twin**: High-fidelity digital simulations of cellular responses and drug interactions.
- **Phylogenetic Tree Builder**: Automated evolutionary tree inference from DNA sequences.
- **Real-Time Virus Mutation Tracker**: Global interactive map tracking emerging viral mutations in real-time.

### Group D: Collaboration & Privacy
- **Research Collaboration Hub**: A bioinformatics-focused "Command Center" merging repository functionality with active computational data streams.
- **Drag & Drop Pipeline Builder**: No-code workflow orchestrator for non-programmers to build bioinformatics pipelines.
- **Blockchain Data Sovereignty & ZKP**: Secure genomic data sharing leveraging Zero-Knowledge Proofs and immutable ledger audits.

---

## 🛠️ Technology Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 15 App Router, React 19, TypeScript |
| **Styling** | Custom CSS token system — "Matte Dark / Liquid Glass" aesthetic |
| **Authentication** | Next.js Middleware + Firebase Auth (SSO/OAuth) + PostgreSQL sessions |
| **Database** | PostgreSQL via `pg` client, raw SQL schema |
| **Validation** | Zod across all API endpoints |
| **Python Engine** | FastAPI + Biopython + scikit-learn (Random Forest) |
| **Alignment Algorithm** | Needleman-Wunsch Global Gapped Alignment |
| **AI Severity Model** | Random Forest Classifier (scikit-learn) |

---

## 🧬 Genomics Engine v2 — AI-Driven Analysis Pipeline

The analysis engine has been fully upgraded from a naive heuristic model to a **virus-agnostic, AI-driven bioinformatics pipeline**.

### How it works

```
Uploaded File (FASTA/FASTQ/BAM/VCF)
       │
       ▼
Biopython SeqIO Parser (robust, handles all line endings & formats)
       │
       ▼
FASTA Header Detection → Organism identified (HIV-1, SARS-CoV-2, etc.)
       │
       ▼
PostgreSQL reference_genomes lookup → Gene Map loaded (gag, pol, env, S, N...)
       │
       ▼
Needleman-Wunsch Global Gapped Alignment (handles unequal-length sequences)
       │
       ▼
SNP + Indel Extraction from aligned pair
       │
       ▼
Random Forest Classifier (per-mutation severity scoring)
  └── Features: mutation type, GC context, codon position, domain, drug-resistance site
       │
       ▼
Enriched JSON → Next.js API → PostgreSQL → Analysis Dashboard
```

### Supported Organisms (Auto-Detected)

| Organism | NCBI Accession | Gene Map |
|:---|:---|:---|
| HIV-1 | NC_001802.1 | gag, pol, env, tat, rev, nef |
| HIV-2 | NC_001722.1 | gag, pol |
| SARS-CoV-2 | NC_045512.2 | ORF1ab, S, E, M, N |
| Influenza A | NC_002016.1 | HA, NA |
| Influenza B | NC_002204.1 | HA |
| Hepatitis B | NC_003977.2 | S, C, P |
| Hepatitis C | NC_004102.1 | E1, E2, NS5B |
| Dengue-1 | NC_001477.1 | E |
| Ebola | NC_002549.1 | GP, NP |
| Monkeypox | NC_063383.1 | — |

### AI Severity Classifier — Random Forest

Each detected mutation is scored by a **Random Forest Classifier** trained on biologically-motivated seed data sourced from **HIVDB** and **ClinVar**:

| Feature | Description |
|:---|:---|
| `is_transition` | Purine↔Purine or Pyrimidine↔Pyrimidine change |
| `is_indel` | Insertion or Deletion event |
| `gc_context` | GC% of ±10bp window around the mutation |
| `codon_position` | Position within the affected codon (0, 1, 2) |
| `in_functional_domain` | Whether the site falls inside a known gene region |
| `drug_resistance_site` | Cross-referenced against HIVDB/ClinVar known sites |

**Output per mutation:**
- `severity`: `high` / `medium` / `low`
- `ai_confidence`: 0.0 → 1.0 confidence score
- `functional_region`: Gene name (e.g., `pol`, `S protein`)
- `drug_resistance_site`: `true` / `false`
- `mutation_class`: `Transition` / `Transversion`

---

## 📁 Application Structure Map

```text
GENO_NEXUS/
├── src/
│   └── app/
│       ├── (auth)/                  # Login, register, password reset
│       ├── api/
│       │   ├── files/               # File upload & listing routes
│       │   ├── collaboration/       # Collaboration APIs (Pipelines, Stats, WebSockets, Hypotheses)
│       │   └── analysis/
│       │       ├── auto/            # Auto-pair latest query + reference
│       │       ├── compare/         # Explicit file-pair comparison
│       │       │   └── [id]/        # Poll comparison result by ID
│       │       ├── history/         # Past analysis runs
│       │       └── dismiss/[id]/    # Dismiss a failed analysis
│       ├── dashboard/               # Researcher & Clinical Portal
│       │   ├── analysis/            # AI mutation analysis dashboard
│       │   ├── upload/              # Dual-source sequence upload station
│       │   ├── collaboration/       # Research Collaboration Hub (Hypotheses, Activity Stream, Pipelines)
│       │   ├── history/             # Dedicated Analysis History Page
│       │   ├── drugs/               # Drug-Gene interaction predictions
│       │   ├── outbreak/            # Epidemic & Viral trackers
│       │   ├── predictions/         # ncRNA and Health Trajectories
│       │   ├── processing/          # Pipeline executions
│       │   ├── reports/             # Research readouts
│       │   ├── visualization/       # 3D Genome Browsers
│       │   └── profile/             # User & security settings
│       └── user/                    # Patient Portal
│           ├── dashboard/           # Personal Health Insights & Activity
│           ├── results/             # Simplified genetic test results
│           ├── upload-dna/          # Patient DNA submission (Caregiver use)
│           └── specialists/         # Specialist care coordination
│
├── microservices/
│   └── genomics_engine/
│       ├── main.py                  # FastAPI v2 engine with WebSocket Collaboration broadcasting
│       ├── virus_classifier.py      # Random Forest severity classifier module
│       └── requirements.txt         # Python dependencies
│
└── database/
    ├── schema.sql                   # Core PostgreSQL schema
    └── migrations/
        ├── 001_create_notifications.sql
        ├── 002_genomics_engine_v2.sql   # reference_genomes, known_mutations + comparison_results v2
        └── collab_schema.sql            # WebSockets, Collaboration, Hypotheses, Pipeline Runs
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

---

### 1. Environment Configuration
Copy `.env.example` to `.env.local` and configure:
```env
# PostgreSQL connection
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/genonexus

# Firebase (required for Google/GitHub OAuth)
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... (all other Firebase keys from .env.example)
```

---

### 2. Database Initialization

**Step 1 — Create the database:**
```sql
CREATE DATABASE genonexus;
```

**Step 2 — Apply the base schema:**
```bash
psql -U your_postgres_username -d genonexus -f database/schema.sql
```

**Step 3 — Apply the v2 genomics engine migration** (adds `reference_genomes`, `known_mutations` tables and seeds 10 reference genomes + HIVDB mutations):
```bash
psql -U your_postgres_username -d genonexus -f database/migrations/002_genomics_engine_v2.sql
```

---

### 3. Install Frontend Dependencies & Run

```bash
npm install
npm run dev
```

Frontend live at: **`http://localhost:3000`**

---

### 4. Install & Run the Python Genomics Microservice

Open a **second terminal**:

```bash
cd microservices/genomics_engine
```

Install dependencies (**use `python -m pip`** instead of `pip` if your system has Application Control policies):
```bash
python -m pip install biopython scikit-learn numpy psycopg2-binary --prefer-binary
python -m pip install fastapi==0.103.2 uvicorn==0.23.2 requests==2.31.0
```

Start the engine:
```bash
python -m uvicorn main:app --reload --port 8000
```

Engine live at: **`http://localhost:8000`**  
Swagger docs at: **`http://localhost:8000/docs`**

> **Health check:** `GET http://localhost:8000/health` → `{"status": "ok", "version": "2.0.0"}`

---

### 5. Running Both Services Together

You need **2 terminals running simultaneously**:

| Terminal | Command | URL |
|:---|:---|:---|
| **Terminal 1** (Python) | `python -m uvicorn main:app --reload --port 8000` | `http://localhost:8000` |
| **Terminal 2** (Next.js) | `npm run dev` | `http://localhost:3000` |

---

## 🧬 How to Run a Genomic Analysis

1. Access the **Researcher or Clinical Portal** via `/dashboard`
2. Go to **Dashboard → Upload Genomic Data**
3. Drag & drop your **query sequence** (FASTA/FASTQ/VCF/BAM) into the upload zone
4. In the **"Launch Sequence Alignment"** section, choose your reference source:
   - **NCBI Link** — paste an NCBI Nuccore URL (e.g., `https://www.ncbi.nlm.nih.gov/nuccore/NC_001802.1?report=fasta`)
   - **Local File** — upload your own reference FASTA file
5. Click **"Launch Comparative Pipeline"**
6. You are automatically redirected to the **Analysis Dashboard** where:
   - The organism is **auto-detected** from the FASTA header
   - Mutations are listed in the **SNPs tab** with AI severity + confidence scores
   - Insertions/Deletions are listed in the **Indels tab**
   - A **Drug Resistance** counter highlights known resistance sites (HIVDB/ClinVar)
   - A **Chromosome Heatmap** shows mutation density across the genome

---

## 🔍 PostgreSQL Management Guide

Connect to the database:
```bash
psql -U your_postgres_username -d genonexus
```

### Useful Queries

```sql
-- View all uploaded files
SELECT id, file_name, file_type, status, created_at FROM dna_files ORDER BY created_at DESC;

-- View all comparison results with organism detected
SELECT id, status, match_percentage, detected_organism, alignment_score FROM comparison_results ORDER BY created_at DESC;

-- View seeded reference genomes
SELECT organism, ncbi_accession, genome_length FROM reference_genomes;

-- View known high-severity mutation seeds
SELECT organism, position, reference_base, query_base, severity, drug_resistance, source
FROM known_mutations WHERE severity = 'high';
```

### Essential psql Commands
| Command | Description |
|:---|:---|
| `\dt` | List all tables |
| `\d table_name` | Inspect columns and types |
| `\q` | Exit psql |

---

## 🗄️ Database Schema Overview

| Table | Purpose |
|:---|:---|
| `users` | Registered accounts with roles (Patient, Caregiver, Clinician, Researcher) |
| `sessions` | Secure session tokens |
| `dna_files` | All uploaded / linked genomic files |
| `comparison_results` | Analysis results with mutations, indels, organism, AI metadata |
| `reference_genomes` | Seeded viral reference genome library with gene maps |
| `known_mutations` | HIVDB / ClinVar known high-severity mutation catalog |
| `collab_alerts` | Real-time global alerts for the research network |
| `pipeline_runs` | Logs of all genomic analysis pipelines and their execution status |
| `hypotheses` | Interactive hypothesis board for researchers to track hunches |
| `audit_logs` | Compliance event logging |
| `rate_limit_attempts` | Brute-force protection |
| `csrf_tokens` | CSRF token storage |

---

## 🤝 Real-Time Collaboration Hub

The `dashboard/collaboration` interface is powered by a real-time WebSocket connection managed by the FastAPI Python server. When new analyses are triggered, files uploaded, or mutations detected, the engine broadcasts real-time events to all connected clients.

Features include:
1. **Live Activity Stream:** See file uploads, pipeline executions, and AI alerts exactly when they happen.
2. **Hypothesis Board:** Track active scientific hunches, link them to specific genes or mutations, and update their confidence levels dynamically.
3. **Pipeline Engine Tracker:** Watch the background processing of your genome analysis tools in real-time.
4. **Historical Analytics:** Dedicated History pages with dynamic metrics derived from database analytics.

---

## 📦 Python Dependencies

| Package | Purpose |
|:---|:---|
| `fastapi` | Web framework for the microservice |
| `uvicorn` | ASGI server |
| `biopython` | FASTA/FASTQ parsing + Needleman-Wunsch alignment |
| `scikit-learn` | Random Forest severity classifier |
| `numpy` | Numerical feature computation |
| `psycopg2-binary` | PostgreSQL access from the Python engine |
| `requests` | NCBI eUtils API fetching |

---

## 📄 License

This project is proprietary software for biomedical research and educational purposes.
