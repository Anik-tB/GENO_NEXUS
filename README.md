# GenoNexus

Initial implementation for the GenoNexus landing page, login flow, registration flow, and PostgreSQL auth foundation.

## Stack

- Next.js App Router
- React + TypeScript
- PostgreSQL via `pg`
- GNDS-inspired custom CSS token system

## Local setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to match your local PostgreSQL credentials.
2. Create a database named `genonexus` in your local PostgreSQL 18.
3. Apply the schema by running: `psql -U postgres -d genonexus -f database/schema.sql`.
4. Install dependencies with `npm install`.
5. Run the app with `npm run dev`.

## Database

The PostgreSQL bootstrap schema lives in `database/schema.sql`.

### Viewing the Database

To interact with your local PostgreSQL database directly from your terminal, run:

```bash
psql -U postgres -d genonexus
```

Once you are inside the `psql` shell, you can use the following commands:
- `\dt` — List all tables in the database.
- `\d <table_name>` — View the schema (columns, data types) of a specific table.
- `SELECT * FROM <table_name>;` — View all data/rows inside a specific table.
- `\q` — Quit and exit the database interface.

## Project Structure & File Meanings

This section explains the purpose of the core files and directories in this repository:

### Root Files
- **`package.json` / `package-lock.json`**: NPM dependencies and project scripts.
- **`tsconfig.json` / `tsconfig.tsbuildinfo`**: TypeScript configuration and build cache.
- **`next.config.ts`**: Configurations for the Next.js framework.
- **`.env.example` / `.env.local`**: Environment variables (e.g., database connection string, auth secrets).
- **`docker-compose.yml`**: Docker configuration for running the local PostgreSQL database.
- **`GenoNexus.txt`**: A comprehensive project specification or design document containing historical information, styling tokens, and requirements.

### `database/`
- **`schema.sql`**: The PostgreSQL schema definition. Contains table creation scripts for users, sessions, email verifications, password resets, and OAuth state.

### `src/app/` (Next.js App Router)
- **`layout.tsx`**: The main application layout wrapping all pages.
- **`globals.css`**: Global CSS styling and design tokens.
- **`page.tsx` & `page.module.css`**: The main landing page view and its specific styling.
- **`not-found.tsx`**: Custom 404 error page.
- **`login/`, `register/`, `reset-password/`**: Authentication pages containing standard user ingress flows (`page.tsx` forms).
- **`dashboard/`**: The protected user area (dashboard) after a successful login.
- **`api/auth/`**: Backend API routes handling authentication (login, logout, google, github, register, reset-password, verify).

### `src/components/` (Reusable UI Components)
- **`auth/`**: Contains `auth-shell` (wrapper for auth pages) and `forms` (input components used in authentication).
- **`marketing/`**: Contains `dna-helix` (an animated marketing element) and `faq-accordion` (frequently asked questions component).

### `src/lib/` (Core Logic & Utilities)
- **`auth/`**: Core authentication and database access logic (`users.ts`, `sessions.ts`, `oauth-state.ts`, etc.).
- **`db.ts`**: The primary database connection setup (configures `pg` pool).
- **`env.ts`**: Centralized environment variable validation and typing.
- **`firebase/`**: Integration logic for Firebase services (`client.ts`, `admin.ts`).
- **`validation/`**: Zod schemas for input validation (`auth.ts`).
