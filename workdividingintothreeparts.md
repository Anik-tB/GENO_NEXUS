# GenoNexus Platform: Work Division for 3 Team Members

Based on the 15 core features outlined in `GenoNexus.txt` and the current state of the project (Frontend pages largely generated, Backend only has Auth and partial Uploads), the remaining work is heavily focused on building backend microservices, AI/ML integration, and wiring up advanced frontend visualizations.

Here is the detailed division of work to fully complete the project. The work is divided logically so that each member owns a specific domain of the architecture, minimizing merge conflicts and overlapping responsibilities.

---

## Member 1: Core Genomics & Pipeline Engineer
**Focus**: Genomic data processing, bioinformatic pipelines, and distributed data architectures.

### Backend Responsibilities:
1. **Genomic Analysis Service (FastAPI)**
   - **Multi-Format DNA Analyzer**: Process raw genomic files (FASTA, VCF) using Biopython.
   - **Variant Pathogenicity Predictor**: Build APIs to classify and score variants.
   - **CRISPR Target Designer**: Implement sequence analysis for guide RNA design and off-target predictions.
   - **Non-Coding RNA Function Predictor**: Implement sequence handling and annotation fetching.
2. **Data Processing Infrastructure**
   - Enhance the existing `upload` API to handle massive file sizes using chunked uploads to AWS S3.
   - Setup Apache Spark (or similar) for distributed genomic data processing.
   - Setup and manage PostgreSQL schemas. **Crucial Storage Rule**: Never store raw sequence files (like the 65MB FASTA) in PostgreSQL. Store the actual files in AWS S3 or a local `/uploads` folder, and only store the file's metadata (URL, size) and the extracted, parsed mutation results in PostgreSQL.
3. **Drag & Drop Pipeline Builder (Backend)**
   - Set up the workflow engine (Apache Airflow or Nextflow).
   - Create APIs to receive pipeline JSON definitions from the frontend and execute them on the compute cluster.

### Frontend Integration Duties:
- Connect the frontend upload components to the new chunked upload API.
- Connect the Drag & Drop Pipeline UI (React Flow) to the Airflow backend.
- Connect the Genomic Analysis pages (DNA, CRISPR, RNA) to the FastAPI endpoints.

---

## Member 2: AI/ML & Healthcare Data Engineer
**Focus**: Machine learning models, LLMs, predictive analytics, and longitudinal healthcare data streams.

### Backend Responsibilities:
1. **AI/ML Service (FastAPI + PyTorch/TensorFlow)**
   - **AI Gene Chatbot**: Implement LangChain/LlamaIndex with a Vector Database (Pinecone/Weaviate) for Retrieval-Augmented Generation (RAG) on genomic literature.
   - **Drug-Gene Interaction Predictor**: Set up Neo4j for relationship mapping and serve Graph Neural Network (GNN) models for predictions.
   - **Disease Outbreak Predictor**: Build time-series forecasting pipelines (XGBoost/LSTM) using historical epidemic data.
   - **Longitudinal Health Trajectory**: Setup InfluxDB or TimescaleDB for continuous wearable and EHR data streams.
2. **Model Serving & Caching**
   - Deploy model serving infrastructure (e.g., TensorFlow Serving or Ray Serve) for rapid inference.
   - Implement Redis caching for frequent predictions (e.g., common drug-gene pairs).

### Frontend Integration Duties:
- Build the WebSocket/SSE connection for the AI Gene Chatbot UI to stream responses.
- Connect the Drug-Gene and Health Trajectory dashboards to the predictive APIs.
- Connect the Outbreak Predictor UI to the forecasting models, ensuring data formats match.

---

## Member 3: Visualization, Real-Time & Security Infrastructure
**Focus**: Advanced WebGL visualizations, real-time data streaming, collaboration tools, and blockchain security.

### Backend Responsibilities:
1. **Visualization Service (Node.js + Express)**
   - **3D / VR Genome Browser**: Serve large genomic coordinate data efficiently for Three.js rendering.
   - **Digital Cell Twin**: Serve complex cellular simulation parameters and handle heavy computational requests.
   - **Phylogenetic Tree Builder**: Execute tree inference tools (RAxML, IQ-TREE) and serve tree structures to the frontend.
2. **Real-Time Collaboration & Tracking (Node.js/WebSockets)**
   - **Real-Time Virus Mutation Tracker**: Set up Apache Kafka and WebSockets to stream global mutation data to the frontend map in real-time.
   - **Research Collaboration Hub**: Build project management APIs, version control (Git) integrations, and RabbitMQ for real-time notifications.
3. **Security & Privacy Service (Blockchain)**
   - **Blockchain Data Sovereignty & ZKP**: Implement Ethereum smart contracts for access control and ZoKrates/Circom circuits for zero-knowledge proofs.

### Frontend Integration Duties:
- Implement Three.js / WebGL in the frontend for the 3D Genome Browser and Digital Cell Twin.
- Implement Leaflet/Mapbox for the Virus Mutation Tracker.
- Integrate WebSockets for real-time collaboration features (live cursors, chat, notifications).
- Connect the Blockchain privacy toggles in the UI to the Web3 backend and display ZKP verification statuses.

---

## Technical Stack Summary by Member

| Role | Primary Technologies | Key Infrastructure |
| :--- | :--- | :--- |
| **Member 1** | Python, FastAPI, Biopython | PostgreSQL, AWS S3, Apache Airflow |
| **Member 2** | Python, PyTorch, LangChain | Pinecone, Neo4j, InfluxDB |
| **Member 3** | Node.js, WebSockets, Solidity, Three.js | Kafka, Ethereum, Redis, WebGL |

## Inter-Team Links & Dependencies (How it all connects)
- **Member 1 -> Member 2**: Member 1 processes the raw DNA/RNA data and normalizes it. This normalized data is then ingested by Member 2's AI models (e.g., for the Pathogenicity Predictor or Health Trajectories).
- **Member 1 -> Member 3**: Member 1 extracts the raw genomic coordinates and sequences. Member 3 queries this structured data to visualize it in the 3D genome browsers and phylogenetic trees.
- **Member 2 -> Member 3**: Member 2's machine learning models predict outbreak patterns, which Member 3 then plots on the interactive Real-Time Virus Tracker map.
- **Security Overlay**: All data read/write operations performed by Member 1 and Member 2 must pass through Member 3's Blockchain & ZKP Security layer to ensure complete data sovereignty and privacy compliance before reaching the user.

---

## Step-by-Step Workflow: Processing a Viral Sequence (e.g., `sequences.fasta` SARS-CoV-2)

Currently, the frontend simulates the upload and analysis process. When you upload the SARS-CoV-2 fasta file and click "Start Analysis Pipeline" -> "View Mutation Analysis", it simply routes to the UI because the backend logic isn't connected yet. 

To make this actually work with real data, here is the exact step-by-step pipeline the team must build:

### Step 1: Data Ingestion & Validation (Member 1)
- **Action**: The user drops `sequences.fasta` into the UI.
- **Backend Process**: The FastAPI upload endpoint (built by Member 1) receives the file. It uses `Biopython` to parse the `.fasta` file, validating that it contains valid nucleotide sequences (A, C, G, T) and extracting the raw viral genome.
- **Output**: A sanitized, structured sequence string securely stored in the database or S3.

### Step 2: Alignment & Variant Calling (Member 1)
- **Action**: The sequence is compared against a known reference to find mutations.
- **Backend Process**: Member 1's pipeline (via Apache Spark or an Airflow script) aligns the uploaded SARS-CoV-2 genome against the original reference genome (e.g., Wuhan-Hu-1). It identifies mismatches, insertions, and deletions (variants/mutations).
- **Output**: A raw list of identified mutations (e.g., a Spike protein mutation like D614G or N501Y).

### Step 3: Pathogenicity Prediction & Severity Scoring (Member 2)
- **Action**: The system determines how dangerous or impactful these mutations are.
- **Backend Process**: The list of raw mutations is passed to Member 2's AI/ML Service (Variant Pathogenicity Predictor). The PyTorch/TensorFlow models evaluate the mutations to predict their clinical impact (e.g., increased transmissibility, vaccine evasion, or benign). 
- **Output**: Severity scores (High, Medium, Low Priority) and confidence metrics (e.g., "94.7% AI Confidence") for each identified variant.

### Step 4: Tracking & Phylogenetics (Member 3)
- **Action**: The virus is mapped globally and placed on an evolutionary tree.
- **Backend Process**: Member 3's Visualization Service queries the mutations and cross-references them with global real-time databases (Real-Time Virus Mutation Tracker) to identify the specific strain (e.g., JN.1 or an Omicron subvariant). The Phylogenetic Tree Builder computes where this exact sequence fits in the evolutionary history of the virus.
- **Output**: Geographical tracking data and a JSON structure representing the phylogenetic tree.

### Step 5: Frontend Visualization & Delivery (All Members)
- **Action**: The user clicks "View Mutation Analysis".
- **Backend Process**: The API Gateway fetches the combined results from the database. Member 3's security layer ensures the transaction is logged via Blockchain/ZKP.
- **Frontend Action**: The UI finally renders the real data instead of mock data:
  - The **"Identified Variants" table** populates with the actual gene mutations found in `sequences.fasta` (from Step 2).
  - The **severity badges** (High/Med/Low) populate from the AI model's assessment (Step 3).
  - Clicking **"Explore in 3D Viewer"** opens Member 3's Three.js module to visualize the 3D protein structure of the specific mutation.
