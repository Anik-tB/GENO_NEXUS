# GenoNexus

GenoNexus is a comprehensive, enterprise-grade bioinformatics and genomics platform designed to bridge the gap between genomic research and everyday healthcare. Featuring a revolutionary **Three-Portal Architecture**, it seamlessly connects the lab, the clinic, and the patient. Designed with a premium **"Matte Dark / Liquid Glass"** glassmorphic aesthetic, the platform unifies next-generation DNA analysis, artificial intelligence predictions, 3D visualizations, and secure biomedical research collaboration.

---

## 🎬 Demo Video

[![GenoNexus Demo Video](https://img.youtube.com/vi/xAJA6PNAf9w/maxresdefault.jpg)](https://youtu.be/xAJA6PNAf9w)

> 🔗 **Watch the full demo:** [https://youtu.be/xAJA6PNAf9w](https://youtu.be/xAJA6PNAf9w)

---

## 🌐 The Three-Portal Ecosystem

GenoNexus operates across three dedicated interfaces, each tailored to a specific user role:

| Portal | Route | Intended For |
|:---|:---|:---|
| **Researcher & Clinical Portal** | `/dashboard` | Scientists, Clinicians, Lab Staff — full access to AI analysis, collaboration, visualization, and all system tools |
| **Patient Portal** | `/user/dashboard` | Patients & Caregivers — simplified, personal health-focused view of results, appointments, and reports |
| **Public / Auth** | `/`, `/login`, `/register`, `/reset-password` | All visitors — marketing landing page and full authentication flows |

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
- **Hybrid ESM-2 Pathogenicity Predictor**: Combines local sequence-level Random Forest features with zero-shot transformer log-likelihoods from **ESM-2** (Hugging Face Serverless Inference API + local CPU fallback + BLOSUM62 biological fallback) to score variant severity.
- **Longitudinal Health Trajectory**: Time-series integration of EHR, wearable data, and DNA for personalized health tracking.
- **Spatio-Temporal Outbreak Predictor**: Epidemic forecasting using a **STAR (Spatio-Temporal Autoregressive)** RandomForest regression model trained on dynamic WHO GHO and disease.sh historical endpoints.

### Group C: Visualization
- **3D Chromosome Map Viewer**: An interactive WebGL-based chromosome visualizer built with a custom React canvas component (`GenomeBrowser`). Renders mutation pins enriched with ClinVar annotations and AlphaFold 3D PDB download links. Backed by dedicated `/api/visualization/analysis-data` and `/api/visualization/mutations-raw` endpoints.
- **Digital Cell Twin**: High-fidelity digital simulations of cellular responses and drug interactions.
- **Phylogenetic Tree Builder**: Automated evolutionary tree inference from DNA sequences.
- **Real-Time Virus Mutation Tracker**: Global interactive map tracking emerging viral mutations in real-time.

### Group D: Collaboration & Privacy
- **Research Collaboration Hub**: A real-time hub featuring a live **Activity Stream**, **Alerts Panel**, **Hypothesis Board** (with per-hypothesis AI chat), **Research Timeline**, **Presence Header**, and WebSocket **Pipeline Engine Tracker** (QC → Align → Call → Predict → Enrich).
- **Drag & Drop Pipeline Builder**: No-code workflow orchestrator for non-programmers to build bioinformatics pipelines.
- **Blockchain Data Sovereignty & ZKP**: Secure genomic data sharing leveraging Zero-Knowledge Proofs and immutable ledger audits.

---

## 🛠️ Technology Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 15 App Router, React 19, TypeScript 5.7 |
| **Styling** | Custom CSS token system — "Matte Dark / Liquid Glass" aesthetic with CSS Modules |
| **Authentication** | Next.js Middleware + Firebase Auth (Email/Password + Google OAuth + GitHub OAuth) + PostgreSQL sessions + TOTP 2FA |
| **Database** | PostgreSQL via `pg` client (v8.13), raw SQL schema (no ORM) |
| **Validation** | Zod (v3.23) across all API endpoints |
| **AI Copilot** | Google Gemini 2.5 Flash (`gemini-2.5-flash`) via Gemini API |
| **Python Genomics Engine** | FastAPI 0.103.2 + Biopython + scikit-learn (Random Forest) + ESM-2 (HF API + local CPU + BLOSUM62 fallback) + WebSockets |
| **Python Epidemiology Engine** | FastAPI + scikit-learn (Random Forest Regressor/Classifier) + Pydantic |
| **Visualization Microservice** | Node.js + Express.js + WebSocket (`ws`) + Redis (`ioredis`) |
| **Alignment Algorithm** | Needleman-Wunsch Global Gapped Alignment (via Biopython) |
| **AI Severity Model** | Hybrid Random Forest Classifier + zero-shot ESM-2 log-likelihood ratios + BLOSUM62 biological fallback |
| **Pharmacogenomics** | Live CPIC REST API + RxNorm dynamic ID resolution + star-allele phenotype mapper |
| **Email / 2FA** | Nodemailer (SMTP) + otplib (TOTP) |
| **Testing** | Jest 30 + ts-jest + @testing-library/react |
| **Containerization** | Docker + docker-compose (Visualization Service) |
| **One-Click Launch** | `START_ALL.bat` — launches all 3 services simultaneously in separate terminals (Windows) |

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
ESM-2 Zero-Shot Language Model (log P(mut) - log P(wt) ratio)
  ├── Tier 1: Local CPU (PyTorch + esm2_t6_8M_UR50D ~30MB)
  ├── Tier 2: Hugging Face Serverless Inference API (HF_TOKEN)
  └── Tier 3: BLOSUM62 log-odds biological baseline
       │
       ▼
Hybrid Random Forest Classifier (sequence features + ESM-2 scores)
       │
       ▼
Multi-Omics ClinVar & AlphaFold DB Queries (ClinVar accessions & 3D PDB models)
       │
       ▼
Enriched JSON → Next.js API → PostgreSQL → Analysis Dashboard (real-time WS)
       │
       ▼
Pharmacogenomics Engine (CPIC API + RxNorm + star-allele phenotype mapping)
       │
       ▼
Genome Copilot (Gemini 2.5 Flash) → AI summary & clinical prevention plans
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

### ESM-2 Hybrid Prediction Strategy (3-Tier Cascade)

| Tier | Method | When Used |
|:---|:---|:---|
| **1 (Primary)** | Local CPU — PyTorch + `esm2_t6_8M_UR50D` (~30MB) | When `torch` & `transformers` are installed |
| **2 (Fallback)** | Hugging Face Serverless Inference API | Local model unavailable; `HF_TOKEN` or `HF_API_KEY` env var |
| **3 (Baseline)** | BLOSUM62 matrix log-odds proxy | API offline or rate-limited |

### AI Severity Classifier — Random Forest Features

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
- `esm2_score`: log-likelihood ratio from ESM-2
- `functional_region`: Gene name (e.g., `pol`, `S protein`)
- `drug_resistance_site`: `true` / `false`
- `mutation_class`: `Transition` / `Transversion`

---

## 🗺️ Disease Outbreak Predictor

The Outbreak system is a full end-to-end forecasting pipeline with real-world data ingestion:

1. **Real Data Sources**: Fetches live COVID-19 data from `disease.sh` and HIV prevalence data from the WHO GHO API
2. **Caching Layer**: Forecasts are cached in the `outbreak_forecasts` PostgreSQL table for 1 hour to reduce API calls
3. **STAR Forecaster**: Spatial autoregressive Random Forest Regressor modeling local growth lags, spatial leakage coefficients from neighboring regions, and a latent global reservoir
4. **Alert Stats**: R₀ (reproduction number), hotspot classification, and trend direction

**Supported Pathogens**: COVID-19 (real data), HIV (WHO GHO data), Influenza Strain A (seasonal model)

---

## 💊 Pharmacogenomics Engine

The Precision Prescribing Engine (`/dashboard/drugs`):

- **Source**: Live CPIC REST API + RxNorm dynamic ID resolution
- **Enzymes Covered**: CYP2C19, CYP2D6, CYP3A5, TPMT, DPYD, SLCO1B1, VKORC1, G6PD, HLA-B, CFTR
- **Star-Allele Mapping**: Detected variants → metabolizer phenotypes (CYP2C19*2 → Poor; CYP2C19*17 → Ultrarapid; CYP2D6*4 → Poor; DPYD*2A → Intermediate)
- **Output**: CPIC level (A/B/C), FDA warning flag, active dosing comments, CPIC guideline links
- **Print Support**: Generates a printable clinical pharmacogenomics report

---

## 🤖 Genome Copilot (AI Assistant)

- **Context-Aware**: Reads from the user's most recent analysis results, uploads, and pipeline history
- **Dual-Mode**: `chat` mode (free-form) and `prevention_plan` mode (structured JSON clinical output)
- **Role-Aware**: Patients receive bilingual (English + Bangla) summaries; researchers receive technical analysis
- **Rate-Limited**: 24 requests per 60-second window per user (in-memory per-user counter)
- **Endpoints**: `GET /api/copilot` (greeting), `POST /api/copilot` (chat + plans), `GET /api/copilot/pharmacogenomics` (drug profiles)

---

## 💬 Private Messaging System

- **Routes**: `/dashboard/chat/[userId]`
- **API**: `/api/chat/history`, `/api/chat/presence`, `/api/chat/read`, `/api/chat/unread`, `/api/chat/files`
- **Features**: File attachments, read receipts, real-time online presence

---

## 📅 Appointments & Clinical Tests

- **DNA Appointments** (`/api/dna-appointments`): Patients request DNA sequencing appointments via caregivers. Backed by `dna_appointments` table.
- **General Appointments** (`/api/appointments`): Doctor appointment scheduling. Backed by `appointments` table.
- **Clinical Test Booking** (`/api/clinical-tests/book`): Patients book clinical genetic tests. Backed by `test_bookings` table.

---

## 🔬 Specialist Referral System

The specialist referral module (`/api/specialist-referrals`):
- Caregivers initiate referrals to specialist physicians
- Referral status tracking (pending / accepted / completed)
- Patient-facing visibility via `/user/specialists`

---

## 📁 Complete Application Structure

```
GENO_NEXUS/
├── START_ALL.bat                         # One-click launcher for all 3 services (Windows)
├── SECURITY.md                           # Security policy and vulnerability disclosure
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── reset-password/
│   │   ├── not-found.tsx                 # Custom 404 page
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── logout/
│   │   │   │   ├── verify/
│   │   │   │   ├── reset-password/
│   │   │   │   ├── 2fa/                  # TOTP two-factor auth
│   │   │   │   ├── firebase/             # Firebase token verification
│   │   │   │   ├── google/               # Google OAuth
│   │   │   │   └── github/               # GitHub OAuth
│   │   │   │
│   │   │   ├── analysis/
│   │   │   │   ├── auto/                 # Auto-pair latest query + reference
│   │   │   │   ├── compare/[id]/         # Explicit file-pair comparison + polling
│   │   │   │   ├── history/              # Past analysis runs
│   │   │   │   └── dismiss/[id]/         # Dismiss a failed analysis
│   │   │   │
│   │   │   ├── appointments/             # Doctor appointment scheduling
│   │   │   ├── clinical-tests/book/      # Clinical test booking
│   │   │   ├── dna-appointments/         # DNA sequencing appointment requests
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── files/
│   │   │   │   ├── history/
│   │   │   │   ├── presence/
│   │   │   │   ├── read/
│   │   │   │   └── unread/
│   │   │   │
│   │   │   ├── collaboration/
│   │   │   │   ├── alerts/
│   │   │   │   ├── hypotheses/
│   │   │   │   ├── invite/
│   │   │   │   ├── pipelines/
│   │   │   │   └── stats/
│   │   │   │
│   │   │   ├── copilot/
│   │   │   │   ├── route.ts              # Gemini AI chat & prevention plans
│   │   │   │   └── pharmacogenomics/     # CPIC/FDA drug-gene profiles
│   │   │   │
│   │   │   ├── dashboard/                # Dashboard KPI stats
│   │   │   ├── files/                    # File upload & listing
│   │   │   ├── notifications/
│   │   │   ├── outbreak/                 # Epidemic forecasting → port 8001
│   │   │   ├── patients/                 # Patient management (caregivers)
│   │   │   ├── predictions/              # AI disease risk predictions
│   │   │   ├── profile/
│   │   │   ├── reports/
│   │   │   ├── search/                   # Global search
│   │   │   ├── settings/
│   │   │   ├── specialist-referrals/
│   │   │   ├── user/
│   │   │   ├── users/[id]/               # Admin user management
│   │   │   └── visualization/
│   │   │       ├── analysis-data/        # Enriched chromosome visualization data
│   │   │       └── mutations-raw/        # Raw mutation coordinates for rendering
│   │   │
│   │   ├── dashboard/                    # Researcher & Clinical Portal
│   │   │   ├── analysis/
│   │   │   ├── chat/[userId]/
│   │   │   ├── collaboration/
│   │   │   │   ├── activity/
│   │   │   │   ├── hypothesis/[id]/      # Per-hypothesis AI chat thread
│   │   │   │   ├── pipeline/
│   │   │   │   └── components/
│   │   │   │       ├── ActivityStream.tsx
│   │   │   │       ├── AlertsPanel.tsx
│   │   │   │       ├── HypothesisBoard.tsx
│   │   │   │       ├── PipelineEngine.tsx
│   │   │   │       ├── PresenceHeader.tsx
│   │   │   │       ├── ResearchTimeline.tsx
│   │   │   │       └── ImpactStrip.tsx
│   │   │   ├── drugs/                    # Pharmacogenomics prescribing engine
│   │   │   ├── history/
│   │   │   ├── org/                      # Organization management
│   │   │   ├── outbreak/
│   │   │   ├── predictions/
│   │   │   ├── processing/               # Pipeline execution viewer
│   │   │   ├── profile/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   ├── upload/                   # Dual-source sequence upload station
│   │   │   └── visualization/            # Chromosome Map Viewer (WebGL)
│   │   │
│   │   └── user/                         # Patient Portal
│   │       ├── dashboard/
│   │       ├── history/
│   │       ├── profile/
│   │       ├── reports/
│   │       ├── results/
│   │       ├── specialists/
│   │       └── upload-dna/
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   │   ├── ChatbotPanel.tsx          # Floating Genome Copilot panel
│   │   │   ├── GlobalChatManager.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopNav.tsx
│   │   ├── error/
│   │   ├── marketing/
│   │   ├── user/
│   │   └── visualization/
│   │       └── GenomeBrowser.tsx         # WebGL chromosome canvas renderer
│   │
│   ├── hooks/
│   │   ├── useAnalysisData.ts
│   │   ├── useCollabStats.ts
│   │   ├── useCollabWebSocket.ts         # WebSocket hook for real-time collab events
│   │   └── useHypotheses.ts
│   │
│   └── lib/
│       ├── auth/
│       │   ├── users.ts
│       │   ├── sessions.ts
│       │   ├── email.ts
│       │   ├── password.ts
│       │   ├── password-resets.ts
│       │   ├── portal.ts
│       │   ├── account-category.ts
│       │   └── oauth-state.ts
│       ├── copilot/
│       ├── db.ts                         # PostgreSQL Pool singleton
│       ├── env.ts
│       ├── error/
│       ├── firebase/
│       ├── pharmacogenomics.ts           # Full CPIC/FDA pharmacogenomics dataset (54KB)
│       ├── security/
│       │   ├── audit.ts
│       │   ├── csrf.ts
│       │   ├── enumeration-prevention.ts
│       │   ├── headers.ts
│       │   ├── input-validation.ts
│       │   ├── monitoring.ts
│       │   ├── rate-limit.ts
│       │   └── two-factor.ts
│       └── validation/
│
├── microservices/
│   ├── genomics_engine/                  # Python / FastAPI — Port 8000
│   │   ├── main.py                       # FastAPI app + all bioinformatics endpoints + WebSocket
│   │   ├── virus_classifier.py           # Random Forest severity classifier
│   │   ├── esm_predictor.py              # ESM-2 zero-shot predictor (3-tier cascade)
│   │   ├── pharmacogenomics_client.py    # CPIC/RxNorm API client + star-allele mapper
│   │   ├── canrisk_client.py             # CanRisk/BOADICEA oncology risk API
│   │   └── requirements.txt
│   │
│   ├── epidemiology/                     # Python / FastAPI — Port 8001
│   │   ├── main.py
│   │   └── requirements.txt
│   │
│   └── visualization_service/            # Node.js / Express
│       ├── src/
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── package.json
│
├── database/
│   └── migrations/
│       ├── schema.sql
│       ├── genomics_engine_v2.sql        # 10 organisms seeded
│       ├── collab_schema.sql
│       ├── outbreak_forecasts.sql
│       ├── private_chat.sql
│       ├── patient_metadata.sql
│       ├── profile_settings.sql
│       ├── create_notifications.sql
│       └── view.sql                      # vw_geno_nexus_matrix: 9-CTE analytics view
│
├── __tests__/
├── scripts/
├── middleware.ts
├── .env.example
└── guideline.md
```

---

## 🗄️ Database Schema Overview

### Core Tables (`schema.sql`)
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
| `comparison_results` | Analysis results with mutations, indels, organism, alignment score, ESM-2 scores |
| `reports` | Clinical reports linked to comparison results |
| `hypotheses` | Interactive hypothesis board with confidence scores and AI chat |
| `hypothesis_messages` | Per-hypothesis threaded messages (researcher + AI) |
| `test_bookings` | Clinical test booking records for patients |
| `appointments` | Doctor appointment scheduling |
| `dna_appointments` | Patient DNA appointment requests |
| `specialist_referrals` | Caregiver-to-specialist referral coordination |

### Genomics Engine v2 Tables (`genomics_engine_v2.sql`)
| Table | Purpose |
|:---|:---|
| `reference_genomes` | 10 seeded viral reference genomes with NCBI accessions and gene maps |
| `known_mutations` | HIVDB / ClinVar known high-severity mutation catalog |

### Collaboration Tables (`collab_schema.sql`)
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
- PostgreSQL 14+ (tested on PostgreSQL 18)

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

# Optional: Hugging Face API (for ESM-2 Tier 2 cloud inference)
HF_TOKEN=your_hf_token
```

> **Tip**: `DATABASE_URL` defaults to `postgresql://geno:geno@localhost:5432/genonexus` in the example. Update with your actual credentials.

---

### 2. Database Initialization

**Step 1 — Create the database:**
```sql
psql -U postgres -c "CREATE DATABASE genonexus;"
```

**Step 2 — Apply the base schema:**
```bash
psql -U postgres -d genonexus -f database/migrations/schema.sql
```

**Step 3 — Apply the Genomics Engine v2 migration** (seeds 10 reference genomes + HIVDB/ClinVar mutations):
```bash
psql -U postgres -d genonexus -f database/migrations/genomics_engine_v2.sql
```

**Step 4 — Apply all remaining migrations:**
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

Install dependencies (**use `python -m pip`** if your system has Application Control policies):
```bash
python -m pip install biopython scikit-learn numpy psycopg2-binary --prefer-binary
python -m pip install fastapi==0.103.2 uvicorn==0.23.2 requests==2.31.0 websockets
```

Optional — for local ESM-2 CPU inference (Tier 1):
```bash
python -m pip install torch transformers
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
python -m pip install fastapi uvicorn pydantic scikit-learn numpy python-dotenv
python -m uvicorn main:app --reload --port 8001
```

Epidemiology engine live at: **`http://localhost:8001`**

> The Next.js outbreak API (`/api/outbreak`) calls this service at `http://127.0.0.1:8001/forecast`. If offline, the dashboard shows `ML SERVER OFFLINE`.

---

### 6. ⚡ One-Click Launch (Windows)

Double-click **`START_ALL.bat`** to start all 3 services in separate terminals and open your browser automatically.

---

### 7. All Services Summary

| Terminal | Service | Command | URL |
|:---|:---|:---|:---|
| **Terminal 1** | Next.js Frontend | `npm run dev` | `http://localhost:3000` |
| **Terminal 2** | Genomics Engine | `python -m uvicorn main:app --reload --port 8000` | `http://localhost:8000` |
| **Terminal 3** | Epidemiology Engine | `python -m uvicorn main:app --reload --port 8001` | `http://localhost:8001` |

> The Visualization Service (`microservices/visualization_service`) is optional: `npm run docker:up` from that directory.

---

## 🧬 How to Run a Genomic Analysis

1. Access the **Researcher or Clinical Portal** via `/dashboard`
2. Go to **Dashboard → Upload Genomic Data**
3. Drag & drop your **query sequence** (FASTA/FASTQ/VCF/BAM)
4. Choose your reference source:
   - **NCBI Link** — paste an NCBI Nuccore URL (e.g., `https://www.ncbi.nlm.nih.gov/nuccore/NC_001802.1?report=fasta`)
   - **Local File** — upload your own reference FASTA file
5. Click **"Launch Comparative Pipeline"**
6. The **Analysis Dashboard** shows:
   - Organism auto-detected from FASTA header
   - **SNPs tab** — AI severity, ESM-2 log-likelihood score & confidence
   - **Indels tab** — insertions/deletions
   - **Drug Resistance** counter (HIVDB/ClinVar)
   - **Chromosome Heatmap** — mutation density across genome
7. Navigate to **Predictions** → AI disease risk scores + Genome Copilot prevention plans
8. Navigate to **Drugs** → Personalized pharmacogenomics prescribing profile

---

## 🔍 PostgreSQL Management Guide

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

All real-time events are driven by the `useCollabWebSocket.ts` hook connected to the FastAPI WebSocket server.

| Component | Description |
|:---|:---|
| `ActivityStream.tsx` | Live file uploads, pipeline executions, and AI alerts |
| `AlertsPanel.tsx` | Global research network alerts with CRUD |
| `HypothesisBoard.tsx` | Scientific hunches with per-hypothesis AI chat threads |
| `PipelineEngine.tsx` | Per-stage real-time progress (QC → Align → Call → Predict → Enrich) |
| `ResearchTimeline.tsx` | Chronological visualization of all research events |
| `PresenceHeader.tsx` | Live team member online status |
| `ImpactStrip.tsx` | Key collaboration KPIs at a glance |

---

## 📦 Python Dependencies

### Genomics Engine (`microservices/genomics_engine/requirements.txt`)
| Package | Purpose |
|:---|:---|
| `fastapi==0.103.2` | Web framework |
| `uvicorn[standard]==0.23.2` | ASGI server |
| `biopython` | FASTA/FASTQ parsing + Needleman-Wunsch alignment |
| `scikit-learn` | Random Forest severity classifier |
| `numpy` | Numerical feature computation |
| `psycopg2-binary` | PostgreSQL access |
| `requests==2.31.0` | NCBI eUtils, CPIC API, HF API fetching |
| `websockets` | Real-time collaboration broadcasts |
| `pytest==7.4.3`, `pytest-asyncio==0.21.1`, `httpx==0.25.1` | Testing |
| `torch`, `transformers` *(optional)* | Local ESM-2 CPU inference (Tier 1) |

### Epidemiology Engine (`microservices/epidemiology/requirements.txt`)
| Package | Purpose |
|:---|:---|
| `fastapi`, `uvicorn` | Web framework & ASGI server |
| `pydantic` | Request/response data validation |
| `scikit-learn` | Random Forest Regressor + Classifier |
| `numpy` | Feature computation |
| `python-dotenv` | Environment variable loading |
| `gunicorn` | Production WSGI server |

---

## 🔐 Security Architecture

1. **Next.js Middleware** (`middleware.ts`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, CSP, HSTS, `Permissions-Policy`
2. **Session Security** (`lib/auth/sessions.ts`): Hashed tokens in PostgreSQL with IP + user-agent tracking. Auto-expiry.
3. **Rate Limiting** (`lib/security/rate-limit.ts`): DB-level for auth flows; in-memory for Copilot AI (24 req/min per user)
4. **Two-Factor Authentication** (`lib/security/two-factor.ts`): TOTP via `otplib` + backup codes
5. **CSRF Protection** (`lib/security/csrf.ts`): Token-based via `csrf_tokens` table
6. **Audit Logging** (`lib/security/audit.ts`): All security events logged with IP, user agent, event type
7. **Enumeration Prevention** (`lib/security/enumeration-prevention.ts`): Timing-safe response normalization
8. **Security Monitoring** (`lib/security/monitoring.ts`): Anomaly detection and alerting

---

## 🧪 Running Tests

```bash
npm run test
npm run test -- --coverage
```

Python tests: `microservices/genomics_engine/tests/` and `microservices/epidemiology/tests/` using `pytest` + `pytest-asyncio`.

---

## 🔧 Troubleshooting

| Problem | Solution |
|:---|:---|
| **Database Connection Error** | Ensure `DATABASE_URL` in `.env.local` is correct. Format: `postgresql://postgres:PASSWORD@localhost:5432/genonexus` |
| **`psql` is not recognized** | Add PostgreSQL `bin` folder to PATH (e.g., `C:\Program Files\PostgreSQL\18\bin`) |
| **Port 3000 is in use** | Next.js will prompt to use 3001. Type `y` to accept |
| **Outbreak shows `ML SERVER OFFLINE`** | Ensure Epidemiology Engine is running on port 8001 |
| **Copilot not responding** | Ensure `GEMINI_API_KEY` is set in `.env.local` |
| **Analysis fails immediately** | Ensure Genomics Engine (FastAPI) is running on port 8000 |
| **Firebase OAuth not working** | Ensure all `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_*` keys are set in `.env.local` |
| **ESM-2 scores all show 0.0** | Install `torch transformers` for Tier 1, or set `HF_TOKEN` for Tier 2 cloud inference |
| **START_ALL.bat does not work** | Run as Administrator; ensure `python` and `npm` are on system PATH |

---

## 📄 License

This project is proprietary software for biomedical research and educational purposes.
