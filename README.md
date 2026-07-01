# GenoNexus

GenoNexus is a comprehensive, enterprise-grade bioinformatics and genomics platform designed to bridge the gap between genomic research and everyday healthcare. Featuring a revolutionary **Three-Portal Architecture**, it seamlessly connects the lab, the clinic, and the patient. Designed with a premium "Matte Dark" glassmorphic aesthetic, the platform unifies next-generation DNA analysis, artificial intelligence predictions, 3D visualizations, and secure biomedical research collaboration.

---

## 🌐 The Three-Portal Ecosystem

GenoNexus operates across three dedicated interfaces, each tailored to a specific user role:

| Portal | Route | Intended For |
|:---|:---|:---|
| **Researcher & Clinical Portal** | `/dashboard` | Scientists, Clinicians, Lab Staff — full access to AI analysis, collaboration, and all system tools |
| **Patient Portal** | `/user/dashboard` | Patients & Caregivers — simplified, personal health-focused view of results and appointments |
| **Public / Auth** | `/`, `/login`, `/register`, `/reset-password` | All visitors — marketing landing page and authentication flows |

Role-based routing is enforced by `middleware.ts`, which protects both `/dashboard/*` and `/user/*` and redirects unauthenticated users to login.

---

## 🌟 Core Features (The 15 Pillars of GenoNexus)

The platform is architected around 15 cutting-edge capabilities divided into four core groups:

### Group A: Genomics & Core Analysis
- **Multi-Format DNA Analyzer**: Process diverse genomic data (FASTA, FASTQ, VCF, BAM) using state-of-the-art bioinformatics algorithms.
- **Dual-Source Reference Input**: Provide reference sequences via **NCBI URL** *or* **local file upload** — the system handles both seamlessly.
- **Multi-Omics Variant Enricher**: Connects variants to live **NCBI ClinVar** (accessions, review stars, phenotypes) and **EBI AlphaFold DB** (3D coordinate models).
- **CRISPR Target Designer**: Precision AI tool for designing guide RNAs and predicting off-target effects.
- **Non-Coding RNA Function Predictor**: Deep learning architecture for predicting ncRNA interactions and pathways.

### Group B: AI & Machine Learning
- **AI Gene Chatbot (Genome Copilot)**: A Gemini 2.5 Flash-powered assistant for interactive biomedical knowledge retrieval, context-aware analysis summaries, and AI-generated clinical prevention plans.
- **Hybrid ESM-2 Pathogenicity Predictor**: Combines local sequence-level Random Forest features with zero-shot transformer log-likelihoods from **ESM-2** (Hugging Face Serverless Inference API + local CPU fallback) to score variant severity.
- **Longitudinal Health Trajectory**: Time-series integration of EHR, wearable data, and DNA for personalized health tracking.
- **Spatio-Temporal Outbreak Predictor**: Epidemic forecasting using a **STAR (Spatio-Temporal Autoregressive)** RandomForest regression model trained on dynamic WHO GHO and disease.sh historical endpoints.

### Group C: Visualization
- **3D Chromosome Map Viewer**: An interactive WebGL-based chromosome visualizer built with a custom React canvas component (`GenomeBrowser`). Renders mutation pins enriched with ClinVar annotations and AlphaFold 3D PDB download links.
- **Digital Cell Twin**: High-fidelity digital simulations of cellular responses and drug interactions.
- **Phylogenetic Tree Builder**: Automated evolutionary tree inference from DNA sequences.
- **Real-Time Virus Mutation Tracker**: Global interactive map tracking emerging viral mutations in real-time.

### Group D: Collaboration & Privacy
- **Research Collaboration Hub**: A real-time hub with a live Activity Stream, Hypothesis Board (with AI chat per hypothesis), and WebSocket stage-by-stage Pipeline Tracker (QC, Align, Call, Predict, Enrich).
- **Drag & Drop Pipeline Builder**: No-code workflow orchestrator for non-programmers to build bioinformatics pipelines.
- **Blockchain Data Sovereignty & ZKP**: Secure genomic data sharing leveraging Zero-Knowledge Proofs and immutable ledger audits.

---

## 🛠️ Technology Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 15 App Router, React 19, TypeScript |
| **Styling** | Custom CSS token system — "Matte Dark / Liquid Glass" aesthetic |
| **Authentication** | Next.js Middleware + Firebase Auth (Email/Password + Google OAuth) + PostgreSQL sessions |
| **Database** | PostgreSQL via `pg` client, raw SQL schema (no ORM) |
| **Validation** | Zod across all API endpoints |
| **AI Copilot** | Google Gemini 2.5 Flash (`gemini-2.5-flash`) via Gemini API |
| **Python Genomics Engine** | FastAPI + Biopython + scikit-learn (Random Forest) + ESM-2 (Hugging Face API + CPU fallback) + WebSockets |
| **Python Epidemiology Engine** | FastAPI + scikit-learn (Random Forest Regressor/Classifier) + Pydantic |
| **Visualization Microservice** | Node.js + Express.js + WebSocket (`ws`) + Redis (`ioredis`) |
| **Alignment Algorithm** | Needleman-Wunsch Global Gapped Alignment (via Biopython) |
| **AI Severity Model** | Hybrid Random Forest Classifier (scikit-learn) + zero-shot ESM-2 log-likelihood ratios |
| **Pharmacogenomics** | Live Clinical Pharmacogenomics Implementation Consortium (CPIC) REST API + RxNorm dynamic mapping |
| **Email / 2FA** | Nodemailer (SMTP) + otplib (TOTP) |
| **Testing** | Jest + ts-jest + @testing-library/react |
| **Containerization** | Docker + docker-compose (Visualization Service) |

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
FASTA Header Detection → Organism identified (HIV-1, SARS-CoV-2, BRCA1...)
       │
       ▼
PostgreSQL reference_genomes lookup → Gene Map loaded (gag, pol, S, BRCA1 exons...)
       │
       ▼
Needleman-Wunsch Global Gapped Alignment (handles unequal-length sequences)
       │
       ▼
SNP + Indel Extraction from aligned pair
       │
       ▼
ESM-2 Zero-Shot Language Model (predicts log P(mut) - log P(wt) ratio)
       │
       ▼
Hybrid Random Forest Classifier (combines sequence features with ESM-2 scores)
       │
       ▼
Multi-Omics ClinVar & AlphaFold DB Queries (grabs ClinVar accessions & 3D models)
       │
       ▼
Enriched JSON → Next.js API → PostgreSQL → Analysis Dashboard (real-time progress WS)
       │
       ▼
Pharmacogenomics Engine (queries Live CPIC API & RxNorm dynamically)
       │
       ▼
Genome Copilot (Gemini) generates AI summary & prevention plans
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

## 🗺️ Disease Outbreak Predictor

The Outbreak system is a full end-to-end forecasting pipeline with real-world data ingestion:

1. **Real Data Sources**: Fetches live COVID-19 data from `disease.sh` and HIV prevalence data from the WHO GHO API
2. **Caching Layer**: Forecasts are cached in the `outbreak_forecasts` PostgreSQL table for 1 hour to reduce API calls
3. **STAR (Spatio-Temporal Autoregressive) Forecaster**: The Next.js API route (`/api/outbreak`) calls the Epidemiology Engine on `http://127.0.0.1:8001/forecast` which runs a spatial autoregressive Random Forest Regressor. It models local growth lags alongside spatial leakage coefficients from neighboring regions and a latent global reservoir.
4. **Alert Stats**: The ML model predicts R₀ (reproduction number), hotspot classification, and trend direction

**Supported Pathogens**: COVID-19 (with real data), HIV (with WHO GHO data), Influenza Strain A (with a biologically realistic seasonal winter-peak curve)

---

## 💊 Pharmacogenomics Engine

The Precision Prescribing Engine (`/dashboard/drugs`) maps your genomic variants to real drug-gene interactions:

- **Source**: Dynamically integrated with the official Clinical Pharmacogenomics Implementation Consortium (**CPIC API**) to fetch live clinical prescribing recommendations, and the **RxNorm API** to resolve target drug concept IDs.
- **Metabolic Enzymes Covered**: CYP2C19, CYP2D6, CYP3A5, TPMT, DPYD, SLCO1B1, VKORC1, G6PD, HLA-B, CFTR
- **Output**: Favorable response drugs vs. contraindicated medications, each with CPIC level (A/B/C), FDA warning flag, active clinical dosing comments, and CPIC guideline links.
- **Print Support**: Generates a printable clinical pharmacogenomics report

---

## 🤖 Genome Copilot (AI Assistant)

The Genome Copilot is a Gemini-powered AI assistant integrated throughout the platform:

- **Context-Aware**: Reads from the user's most recent analysis results, uploads, and pipeline history before responding
- **Dual-Mode**: Operates in `chat` mode (free-form conversation) and `prevention_plan` mode (structured JSON output for clinical plans)
- **Role-Aware**: Patients receive bilingual (English + Bangla) simplified summaries; researchers receive technical analysis summaries
- **Rate-Limited**: 24 requests per 60-second window per user
- **Endpoint**: `GET /api/copilot` (initial greeting), `POST /api/copilot` (chat)

---

## 💬 Private Messaging System

A full private chat system between users:
- **Routes**: `/dashboard/chat/[userId]`
- **API**: `/api/chat/history`, `/api/chat/presence`, `/api/chat/read`, `/api/chat/unread`, `/api/chat/files`
- **Features**: File attachments, read receipts, real-time presence

---

## 📁 Application Structure Map

```text
GENO_NEXUS/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   │
│   │   ├── api/
│   │   │   ├── auth/                     # Sign-in, sign-up, session management
│   │   │   ├── analysis/
│   │   │   │   ├── auto/                 # Auto-pair latest query + reference
│   │   │   │   ├── compare/              # Explicit file-pair comparison
│   │   │   │   │   └── [id]/             # Poll comparison result by ID
│   │   │   │   ├── history/              # Past analysis runs
│   │   │   │   └── dismiss/[id]/         # Dismiss a failed analysis
│   │   │   ├── chat/
│   │   │   │   ├── files/                # File attachments in chat
│   │   │   │   ├── history/              # Chat history
│   │   │   │   ├── presence/             # Online presence
│   │   │   │   ├── read/                 # Mark as read
│   │   │   │   └── unread/               # Unread count
│   │   │   ├── collaboration/
│   │   │   │   ├── alerts/               # Collab alerts CRUD
│   │   │   │   ├── hypotheses/           # Hypotheses board CRUD
│   │   │   │   ├── invite/               # Invite collaborators
│   │   │   │   ├── pipelines/            # Pipeline runs management
│   │   │   │   └── stats/                # Collaboration statistics
│   │   │   ├── copilot/
│   │   │   │   ├── route.ts              # Gemini AI chat & prevention plans
│   │   │   │   └── pharmacogenomics/     # CPIC/FDA drug-gene profiles
│   │   │   ├── dashboard/                # Dashboard KPI stats
│   │   │   ├── files/                    # File upload & listing
│   │   │   ├── notifications/            # User notifications
│   │   │   ├── outbreak/                 # Epidemic forecasting (→ port 8001)
│   │   │   ├── patients/                 # Patient management (caregivers)
│   │   │   ├── predictions/              # AI disease risk predictions
│   │   │   ├── profile/                  # User profile CRUD
│   │   │   ├── reports/                  # Report generation & management
│   │   │   ├── search/                   # Global search
│   │   │   ├── settings/                 # User settings
│   │   │   ├── specialist-referrals/     # Referral coordination
│   │   │   ├── user/                     # User info APIs
│   │   │   ├── users/                    # Admin user management
│   │   │   └── visualization/            # Chromosome visualization data
│   │   │
│   │   ├── dashboard/                    # Researcher & Clinical Portal
│   │   │   ├── analysis/                 # AI mutation analysis dashboard
│   │   │   ├── chat/                     # Private messaging
│   │   │   │   └── [userId]/             # Individual conversation
│   │   │   ├── collaboration/            # Research Collaboration Hub
│   │   │   ├── drugs/                    # Pharmacogenomics prescribing engine
│   │   │   ├── history/                  # Analysis history
│   │   │   ├── org/                      # Organization management
│   │   │   ├── outbreak/                 # Epidemic & viral trackers
│   │   │   ├── predictions/              # AI disease predictions + Copilot plans
│   │   │   ├── processing/               # Pipeline execution viewer
│   │   │   ├── profile/                  # User profile & security settings
│   │   │   ├── reports/                  # Clinical report center
│   │   │   ├── settings/                 # Account settings
│   │   │   ├── upload/                   # Dual-source sequence upload station
│   │   │   └── visualization/            # Chromosome Map Viewer
│   │   │
│   │   └── user/                         # Patient Portal
│   │       ├── dashboard/                # Personal health insights & activity
│   │       ├── history/                  # Patient analysis history
│   │       ├── profile/                  # Patient profile
│   │       ├── reports/                  # Simplified genetic test reports
│   │       ├── results/                  # Test results view
│   │       ├── specialists/              # Specialist care coordination
│   │       └── upload-dna/               # Patient DNA submission (Caregiver use)
│   │
│   ├── components/
│   │   ├── auth/                         # Auth forms & guards
│   │   ├── dashboard/                    # Researcher dashboard components
│   │   ├── error/                        # Error boundary components
│   │   ├── marketing/                    # Landing page components
│   │   ├── user/                         # Patient portal components
│   │   └── visualization/
│   │       └── GenomeBrowser.tsx         # WebGL chromosome canvas renderer
│   │
│   ├── hooks/                            # Custom React hooks
│   │
│   └── lib/
│       ├── auth/                         # Session management, portal guards
│       ├── copilot/                      # Gemini API client, context builder, greeting logic
│       ├── db.ts                         # PostgreSQL Pool singleton
│       ├── env.ts                        # Environment variable validation
│       ├── error/                        # Error handling utilities
│       ├── firebase/                     # Firebase client & admin config
│       ├── pharmacogenomics.ts           # Full CPIC/FDA pharmacogenomics dataset (53KB)
│       ├── scripts/                      # One-off utility scripts
│       ├── security/                     # CSRF, rate-limiting, audit logging
│       └── validation/                   # Zod schemas
│
├── microservices/
│   ├── genomics_engine/                  # Python / FastAPI — Core Genomics
│   │   ├── main.py                       # FastAPI app with all bioinformatics endpoints + WebSocket
│   │   ├── virus_classifier.py           # Random Forest severity classifier module
│   │   ├── canrisk_client.py             # CanRisk/BOADICEA oncology risk API integration
│   │   └── requirements.txt
│   │
│   ├── epidemiology/                     # Python / FastAPI — Outbreak Prediction (Port 8001)
│   │   ├── main.py                       # ML-based epidemic forecasting (RF Regressor/Classifier)
│   │   └── requirements.txt
│   │
│   └── visualization_service/            # Node.js / Express — Visualization Backend
│       ├── src/                          # TypeScript Express app
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── package.json
│
├── database/
│   └── migrations/
│       ├── schema.sql                    # Core schema: users, sessions, dna_files, comparison_results, etc.
│       ├── genomics_engine_v2.sql        # reference_genomes + known_mutations + 10 organisms seeded
│       ├── collab_schema.sql             # hypotheses, collab_alerts, pipeline_runs, hypothesis_messages
│       ├── outbreak_forecasts.sql        # outbreak_forecasts cache table
│       ├── private_chat.sql              # private_messages table
│       ├── patient_metadata.sql          # patient_metadata JSONB column on dna_files
│       ├── profile_settings.sql          # user profile columns + user_settings table
│       ├── create_notifications.sql      # user_notifications table
│       └── view.sql                      # vw_geno_nexus_matrix: 9-CTE analytics view
│
├── __tests__/                            # Jest test suites
├── middleware.ts                         # Route guards & security headers (CSP, HSTS, XSS)
├── .env.example                          # Template for all required environment variables
└── guideline.md                          # Machine setup guide for new installs
```

---

## 🗄️ Database Schema Overview

### Core Tables (schema.sql)
| Table | Purpose |
|:---|:---|
| `users` | Registered accounts with roles: `patient`, `caregiver`, `clinician`, `researcher`, `lab_staff`, `other`. Includes 2FA fields. |
| `sessions` | Secure session tokens with IP address and user agent tracking |
| `password_reset_tokens` | Time-limited password reset flow |
| `verification_tokens` | Email verification tokens |
| `rate_limit_attempts` | Brute-force protection for login/register/password_reset |
| `csrf_tokens` | CSRF token storage |
| `audit_logs` | Compliance event logging (user actions, IPs, event types) |
| `dna_files` | All uploaded / linked genomic files, with optional `patient_metadata` JSONB |
| `comparison_results` | Analysis results with mutations, indels, organism, alignment score |
| `reports` | Clinical reports linked to comparison results |
| `hypotheses` | Interactive hypothesis board with confidence scores and AI chat |
| `hypothesis_messages` | Per-hypothesis threaded messages (researcher + AI) |
| `test_bookings` | Clinical test booking records for patients |
| `appointments` | Doctor appointment scheduling |
| `dna_appointments` | Patient DNA appointment requests |
| `specialist_referrals` | Caregiver-to-specialist referral coordination |

### Genomics Engine v2 Tables (genomics_engine_v2.sql)
| Table | Purpose |
|:---|:---|
| `reference_genomes` | 10 seeded viral reference genomes with NCBI accessions and gene maps |
| `known_mutations` | HIVDB / ClinVar known high-severity mutation catalog |

### Collaboration Tables (collab_schema.sql)
| Table | Purpose |
|:---|:---|
| `collab_alerts` | Real-time global alerts (critical/warning/info) for the research network |
| `pipeline_runs` | Logs of all genomic analysis pipelines with stages, logs, and progress |

### Additional Migrations
| Table | Purpose |
|:---|:---|
| `outbreak_forecasts` | Cached ML epidemic forecasts (region × pathogen × horizon, 1-hour TTL) |
| `private_messages` | Direct peer-to-peer messages with file attachment support |
| `user_settings` | Per-user settings: notifications, auto-analysis, theme, data-sharing |
| `user_notifications` | System-generated notification feed |

### Analytics View
| View | Purpose |
|:---|:---|
| `vw_geno_nexus_matrix` | 9-CTE comprehensive analytics matrix joining user activity, storage, pipelines, collaboration, genomic results, alerts, chat, notifications, sessions, and outbreak forecasts |

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 18 (also compatible with 14+)

---

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and configure:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PostgreSQL connection
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/genonexus
SESSION_COOKIE_NAME=geno_session

# Genome Copilot — Required for AI Chatbot & Prevention Plans
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Firebase (required for Google OAuth)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK (required for server-side token verification)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

> **Tip**: `DATABASE_URL` defaults to `postgresql://geno:geno@localhost:5432/genonexus` in the example. Update with your actual credentials.

---

### 2. Database Initialization

**Step 1 — Create the database:**
```sql
psql -U postgres -c "CREATE DATABASE genonexus;"
```

**Step 2 — Apply the base schema** (creates all core tables, security tables, and genomic data tables):
```bash
psql -U postgres -d genonexus -f database/migrations/schema.sql
```

**Step 3 — Apply the Genomics Engine v2 migration** (seeds 10 reference genomes + HIVDB/ClinVar mutations):
```bash
psql -U postgres -d genonexus -f database/migrations/genomics_engine_v2.sql
```

**Step 4 — Apply all remaining migrations** (collaboration, outbreak, chat, profile, notifications, analytics view):
```bash
psql -U postgres -d genonexus -f database/migrations/collab_schema.sql
psql -U postgres -d genonexus -f database/migrations/outbreak_forecasts.sql
psql -U postgres -d genonexus -f database/migrations/private_chat.sql
psql -U postgres -d genonexus -f database/migrations/patient_metadata.sql
psql -U postgres -d genonexus -f database/migrations/profile_settings.sql
psql -U postgres -d genonexus -f database/migrations/create_notifications.sql
psql -U postgres -d genonexus -f database/migrations/view.sql
```

---

### 3. Install Frontend Dependencies & Run

```bash
npm install
npm run dev
```

Frontend live at: **`http://localhost:3000`**

---

### 4. Install & Run the Python Genomics Microservice (Port 8000)

Open a **second terminal**:

```bash
cd microservices/genomics_engine
```

Install dependencies (**use `python -m pip`** instead of `pip` if your system has Application Control policies):
```bash
python -m pip install biopython scikit-learn numpy psycopg2-binary --prefer-binary
python -m pip install fastapi==0.103.2 uvicorn==0.23.2 requests==2.31.0 websockets
```

Start the engine:
```bash
python -m uvicorn main:app --reload --port 8000
```

Engine live at: **`http://localhost:8000`**
Swagger docs at: **`http://localhost:8000/docs`**

> **Health check:** `GET http://localhost:8000/health` → `{"status": "ok", "version": "2.0.0"}`

---

### 5. Install & Run the Python Epidemiology Microservice (Port 8001)

Open a **third terminal**:

```bash
cd microservices/epidemiology
```

```bash
python -m pip install fastapi uvicorn pydantic scikit-learn numpy python-dotenv
```

Start the engine:
```bash
python -m uvicorn main:app --reload --port 8001
```

Epidemiology engine live at: **`http://localhost:8001`**

> The Next.js outbreak API (`/api/outbreak`) calls this service at `http://127.0.0.1:8001/forecast`. If this service is offline, the dashboard will display `ML SERVER OFFLINE` in the alert stats.

---

### 6. Running All Services Together

You need **3 terminals running simultaneously**:

| Terminal | Service | Command | URL |
|:---|:---|:---|:---|
| **Terminal 1** | Next.js Frontend | `npm run dev` | `http://localhost:3000` |
| **Terminal 2** | Genomics Engine | `cd microservices/genomics_engine && python -m uvicorn main:app --reload --port 8000` | `http://localhost:8000` |
| **Terminal 3** | Epidemiology Engine | `cd microservices/epidemiology && python -m uvicorn main:app --reload --port 8001` | `http://localhost:8001` |

> The Visualization Service (`microservices/visualization_service`) is optional and can be started with Docker: `npm run docker:up` from that directory.

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
7. Navigate to **Predictions** to view AI-generated disease risk scores and generate clinical prevention plans via the Genome Copilot
8. Navigate to **Drugs** to view your personalized pharmacogenomics prescribing profile

---

## 🔍 PostgreSQL Management Guide

Connect to the database:
```bash
psql -U postgres -d genonexus
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

-- View cached outbreak forecasts
SELECT region, pathogen, horizon, created_at FROM outbreak_forecasts ORDER BY created_at DESC;

-- Query the comprehensive analytics matrix
SELECT full_name, account_category, total_dna_files, last_detected_pathogen, security_status
FROM vw_geno_nexus_matrix;
```

### Essential psql Commands
| Command | Description |
|:---|:---|
| `\dt` | List all tables |
| `\d table_name` | Inspect columns and types |
| `\dv` | List all views |
| `\q` | Exit psql |

---

## 🤝 Real-Time Collaboration Hub

The `dashboard/collaboration` interface is powered by a real-time WebSocket connection managed by the FastAPI Python server. When new analyses are triggered, files uploaded, or mutations detected, the engine broadcasts real-time events to all connected clients.

Features include:
1. **Live Activity Stream:** See file uploads, pipeline executions, and AI alerts exactly when they happen.
2. **Hypothesis Board:** Track active scientific hunches, link them to specific genes or mutations, and update their confidence levels dynamically. Each hypothesis has its own AI-powered chat thread.
3. **Pipeline Engine Tracker:** Watch the background processing of your genome analysis tools in real-time with per-stage progress broadcasts (QC, Align, Call, Predict, Enrich).
4. **Historical Analytics:** Dedicated History pages with dynamic metrics derived from database analytics.

---

## 📦 Python Dependencies

### Genomics Engine (`microservices/genomics_engine/requirements.txt`)
| Package | Purpose |
|:---|:---|
| `fastapi==0.103.2` | Web framework for the microservice |
| `uvicorn[standard]==0.23.2` | ASGI server |
| `biopython` | FASTA/FASTQ parsing + Needleman-Wunsch alignment |
| `scikit-learn` | Random Forest severity classifier |
| `numpy` | Numerical feature computation |
| `psycopg2-binary` | PostgreSQL access from the Python engine |
| `requests==2.31.0` | NCBI eUtils API fetching |
| `websockets` | WebSocket support for real-time collaboration broadcasts |
| `pytest`, `pytest-asyncio`, `httpx` | Testing |

### Epidemiology Engine (`microservices/epidemiology/requirements.txt`)
| Package | Purpose |
|:---|:---|
| `fastapi`, `uvicorn` | Web framework & ASGI server |
| `pydantic` | Request/response data validation |
| `scikit-learn` | Random Forest Regressor (time-series forecasting) + Classifier (hotspot detection) |
| `numpy` | Feature computation |
| `python-dotenv` | Environment variable loading |
| `gunicorn` | Production WSGI server |

---

## 🔐 Security Architecture

The platform implements a multi-layered security model:

1. **Next.js Middleware** (`middleware.ts`): Applies security headers on every response:
   - `X-Frame-Options: DENY` — clickjacking prevention
   - `X-Content-Type-Options: nosniff` — MIME sniffing prevention
   - `X-XSS-Protection: 1; mode=block` — legacy XSS filter
   - `Content-Security-Policy` — restricts sources to `self`, Firebase Auth, and Google APIs
   - `Strict-Transport-Security` — HSTS in production
   - `Permissions-Policy` — disables geolocation, microphone, camera

2. **Session Security**: Hashed session tokens in PostgreSQL with IP address and user agent tracking. Sessions expire automatically.

3. **Rate Limiting**: DB-level rate limiting table (`rate_limit_attempts`) for login, register, and password reset flows. In-memory rate limiting for the Copilot AI (24 req/min per user).

4. **Two-Factor Authentication**: TOTP-based 2FA via `otplib`, with backup codes stored in the database.

5. **CSRF Protection**: Token-based CSRF protection via the `csrf_tokens` table.

6. **Audit Logging**: All security-relevant events are logged to `audit_logs` with IP, user agent, and event type.

---

## 🧪 Running Tests

```bash
# Run all tests
npm run test

# Run with coverage (if configured)
npm run test -- --coverage
```

Tests are located in `__tests__/` and use Jest + ts-jest + @testing-library/react.

Python microservice tests are located in `microservices/genomics_engine/tests/` and `microservices/epidemiology/tests/` and use `pytest` + `pytest-asyncio`.

---

## 🔧 Troubleshooting

| Problem | Solution |
|:---|:---|
| **Database Connection Error** | Ensure `DATABASE_URL` in `.env.local` has the correct password. Default format: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/genonexus` |
| **`psql` is not recognized** | Add PostgreSQL `bin` folder to PATH (e.g., `C:\Program Files\PostgreSQL\18\bin`) |
| **Port 3000 is in use** | Next.js will prompt to use 3001. Type `y` to accept |
| **Outbreak shows `ML SERVER OFFLINE`** | Ensure the Epidemiology Engine is running on port 8001 |
| **Copilot not responding** | Ensure `GEMINI_API_KEY` is set in `.env.local` |
| **Analysis fails immediately** | Ensure the Genomics Engine (FastAPI) is running on port 8000 |
| **Firebase OAuth not working** | Ensure all `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_*` keys are set in `.env.local` |

---

## 📄 License

This project is proprietary software for biomedical research and educational purposes.
