# 🧬 GenoNexus — Tech Stack Overview

A full breakdown of every framework, library, and service powering the GenoNexus platform.

---

## 🖥️ Frontend

### Core Framework — **Next.js 15** (React 19)
| Detail | Value |
|---|---|
| Framework | [Next.js](https://nextjs.org/) `^15.0.0` |
| UI Library | [React](https://react.dev/) `^19.0.0` + `react-dom ^19.0.0` |
| Language | TypeScript `^5.7.2` |
| Routing | Next.js App Router (`/src/app/`) |
| Styling | Vanilla CSS (`globals.css`, `page.module.css`) |

- **App Router** (`src/app/`) handles all page routing including:
  - `/` — Landing/Home page
  - `/login` — Authentication
  - `/register` — Sign-up
  - `/reset-password` — Password recovery
  - `/dashboard` — Main user dashboard
- **Next.js Middleware** (`middleware.ts`) enforces security headers on all routes:
  - `X-Frame-Options: DENY` (clickjacking prevention)
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS in production)

### Authentication — **Firebase Auth**
| Detail | Value |
|---|---|
| SDK | `firebase ^12.11.0` |
| Admin SDK | `firebase-admin ^13.8.0` |
| Providers | Email/Password + Google OAuth |

- Client-side auth is initialized in `src/lib/firebase/client.ts`
- Google provider configured with `select_account` prompt
- Firebase Storage (`getStorage`) used for file uploads

### Validation — **Zod**
- Schema validation library (`zod ^3.23.8`) used on both client and server for form and API input validation.

### Other Frontend Libraries
| Library | Version | Purpose |
|---|---|---|
| `nodemailer` | `^8.0.2` | Transactional email (password reset, OTP) |
| `otplib` | `^12.0.1` | TOTP / OTP generation for 2FA |

---

## ⚙️ Backend

The backend is split into **three layers**:

---

### Layer 1 — Next.js API Routes (Primary BFF)
- Located in `src/app/api/`
- Acts as a **Backend-for-Frontend (BFF)** — all API calls from the React UI go here
- Routes available:
  - `/api/auth` — Sign-in, sign-up, session management
  - `/api/analysis` — Genomic analysis results
  - `/api/dashboard` — Dashboard stats
  - `/api/files` — File upload & management
  - `/api/notifications` — User notifications
  - `/api/predictions` — ML predictions
  - `/api/profile` — User profile CRUD
  - `/api/reports` — Report generation
  - `/api/search` — Search functionality
  - `/api/settings` — User settings
  - `/api/visualization` — Visualization data

### Layer 2 — Genomics Engine Microservice (Python / FastAPI)
| Detail | Value |
|---|---|
| Language | Python |
| Framework | [FastAPI](https://fastapi.tiangolo.com/) `0.103.2` |
| Server | [Uvicorn](https://www.uvicorn.org/) `0.23.2` (ASGI) |
| Location | `microservices/genomics_engine/` |

**Python Libraries used:**
| Library | Purpose |
|---|---|
| `biopython` | Biological sequence parsing (FASTA, VCF, FASTQ) |
| `scikit-learn` | ML-based mutation classification / prediction |
| `numpy` | Numerical computation for genomics metrics |
| `psycopg2-binary` | Direct PostgreSQL connection from Python |
| `requests` | HTTP calls to external genomics APIs |

Key files:
- `main.py` — FastAPI app with all genomics endpoints
- `canrisk_client.py` — CanRisk API integration for cancer risk scoring
- `virus_classifier.py` — ML classifier for viral genomics

### Layer 3 — Visualization Service Microservice (Node.js / Express)
| Detail | Value |
|---|---|
| Language | TypeScript (Node.js) |
| Framework | [Express.js](https://expressjs.com/) `^4.21.2` |
| Location | `microservices/visualization_service/` |
| Containerized | Yes — Docker + docker-compose |

**Key libraries:**
| Library | Purpose |
|---|---|
| `express` | HTTP REST API server |
| `ws` | WebSocket support for real-time chart streaming |
| `ioredis` | Redis client for caching visualization data |
| `jsonwebtoken` | JWT-based auth verification |
| `helmet` | Security headers |
| `express-rate-limit` | API rate limiting |
| `axios` | HTTP proxy calls to genomics engine |
| `pino` | Structured logging |
| `zod` | Schema validation |

---

## 🗄️ Database

| Detail | Value |
|---|---|
| Database | **PostgreSQL** |
| ORM/Driver | `pg ^8.13.1` (node-postgres) — raw SQL, no ORM |
| Schema | `database/schema.sql` |
| Migrations | `database/migrations/` |
| Connection | Singleton `Pool` in `src/lib/db.ts` |
| SSL | Enabled in production (`rejectUnauthorized: false`) |

---

## 🔐 Auth & Security Stack

| Component | Technology |
|---|---|
| Primary Auth | Firebase Authentication |
| Session/Token | Firebase ID Tokens + `firebase-admin` verification |
| 2FA / OTP | `otplib` (TOTP standard) |
| Email | `nodemailer` (SMTP) |
| Middleware Security | Next.js Middleware (CSP, HSTS, XSS headers) |

---

## 🏗️ Architecture Summary

```
┌──────────────────────────────────────────────────────────┐
│                    BROWSER (React 19)                    │
│              Next.js 15 App Router (TSX/CSS)             │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP / Firebase SDK
┌──────────────────▼───────────────────────────────────────┐
│           Next.js API Routes  (BFF Layer)                │
│         /src/app/api/*  —  TypeScript                    │
└────────┬───────────────────────────┬─────────────────────┘
         │ pg (node-postgres)         │ HTTP
         ▼                           ▼
┌─────────────────┐      ┌───────────────────────────────┐
│   PostgreSQL DB │      │  Genomics Engine (FastAPI)    │
│   (SQL Schema)  │      │  Python / Uvicorn / BioPython │
└─────────────────┘      └───────────────┬───────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │  Visualization Service        │
                         │  Express.js / WebSocket / Redis|
                         └───────────────────────────────┘
```

---

## 📦 DevOps & Tooling

| Tool | Purpose |
|---|---|
| TypeScript `^5.7.2` | Static typing across the whole project |
| `tsx` | TypeScript execution for scripts/microservices |
| `dotenv` | Environment variable loading |
| Docker + docker-compose | Containerization of visualization service |
| ESLint (via `next lint`) | Code linting |
| `.env.local` | Local secrets (Firebase keys, DB URL, etc.) |
