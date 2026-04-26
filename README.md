# GenoNexus

GenoNexus is a comprehensive, enterprise-grade bioinformatics and genomics platform. Designed with a premium "Matte Dark" glassmorphic aesthetic, the platform unifies next-generation DNA analysis, artificial intelligence predictions, 3D visualizations, and secure biomedical research collaboration into a single Command Center.

## 🌟 Core Features (The 15 Pillars of GenoNexus)

The platform is architected around 15 cutting-edge capabilities divided into four core groups:

### Group A: Genomics & Core Analysis
- **Multi-Format DNA Analyzer**: Process diverse genomic data using state-of-the-art deep learning architectures.
- **Remote Dataset Linking**: Directly import Reference Sequences from NCBI or external databases via URL, bypassing local storage constraints.
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

This repository serves as the unified frontend and primary API gateway for GenoNexus:

- **Frontend Core**: Next.js 15 App Router, React 19, TypeScript
- **Styling**: Extensive custom CSS Token system (`globals.css`), featuring a unique "Matte Dark/Liquid Glass" aesthetic, eschewing utility-class frameworks for ultimate precision.
- **Authentication**: Hybrid secure authentication using Next.js Middleware, Firebase Auth (for SSO/OAuth), and direct PostgreSQL sessions.
- **Database Layer**: PostgreSQL via the `pg` client wrapper, managed through raw optimized SQL schema (`database/schema.sql`).
- **Validation**: Strict schema typing with Zod across all API endpoints.
- **Python Microservices**: Advanced processing (like NCBI genomic alignment) is isolated in a FastAPI service (`microservices/genomics_engine/`) communicating directly with Next.js APIs.

---

## 📁 Application Structure Map

The `src/app/` directory maps directly to the core features:

```text
src/app/
├── (auth)/             # login, register, reset-password gateaways
├── api/                # Core Next.js API Routes (auth, verify, user-data)
└── dashboard/          # Protected User Domain Command Center
    ├── analysis/       # DNA and Variant Analyzers
    ├── collaboration/  # Research Collaboration Hub & Organizations
    ├── drugs/          # Drug-Gene interaction predictions
    ├── org/            # Institutional management
    ├── outbreak/       # Epidemic & Viral trackers
    ├── predictions/    # ncRNA and Health Trajectories
    ├── processing/     # Drag & Drop pipeline executions
    ├── reports/        # Comprehensive research readouts
    ├── visualization/  # 3D Genome Browsers and Digital Twins
    └── profile/        # User and security settings
```

---

## 🚀 Getting Started & Local Setup

### 1. Environment Configuration
Copy `.env.example` to a new file named `.env.local` and configure it:
```env
# Essential Database String
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/genonexus

# Firebase configuration (Required for Google/GitHub Auth integrations)
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... (all other Firebase keys)
```

### 2. Database Initialization

To set up your PostgreSQL database using a direct local installation:

1. Open your terminal or `psql` command prompt.
2. Create the database: `CREATE DATABASE genonexus;`
3. Upload the schema into your designated database by running this in your standard terminal/cmd:
   ```bash
   psql -U your_postgres_username -d genonexus -f database/schema.sql
   ```
   *(Enter your PostgreSQL password when prompted)*

### 3. Running the Development Server
Install dependencies and launch the Next.js server:
```bash
npm install
npm run dev
```

Your platform will now be live on `http://localhost:3000`.

### 4. Running the Python Analytics Microservice
To enable DNA sequence alignment and NCBI genomic comparison features, you must run the background Python engine.

1. Open a new terminal window.
2. Navigate to the microservice directory:
   ```bash
   cd microservices/genomics_engine
   ```
3. Install the dependencies (requires Python 3.x installed on your machine):
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
The engine will now quietly listen on port 8000 and compute massive alignments seamlessly for your Next.js frontend!

---

## 🔍 PostgreSQL Management Guide

Once the database is initialized, you can interact directly with your tables and verify data integrity via the `psql` command line tool on your physical machine.

To connect:
```bash
psql -U your_postgres_username -d genonexus
```

### Essential Commands
- **View All Tables:** 
  Type `\dt` and press Enter. This lists `users`, `sessions`, `email_verifications`, etc.
- **Inspect a Table's Columns:** 
  Type `\d users` (or any table name). This shows you every column, its data type (e.g., `VARCHAR`, `TIMESTAMP`), and foreign key relationships.
- **View Data (SQL Queries):**
  - `SELECT * FROM users;` (View all registered users)
  - `SELECT id, email, is_verified FROM users;` (View specific columns)
- **Delete Data:**
  - `DELETE FROM users WHERE email = 'test@example.com';`
- **Exit PSQL:**
  - `\q` (Closes the database connection and returns to your regular terminal).
