# GenoNexus

Initial implementation for the GenoNexus landing page, login flow, registration flow, and PostgreSQL auth foundation.

## Stack

- Next.js App Router
- React + TypeScript
- PostgreSQL via `pg`
- GNDS-inspired custom CSS token system

## Local setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Install dependencies with `npm install`.
4. Run the app with `npm run dev`.

## Database

The PostgreSQL bootstrap schema lives in `database/schema.sql`.

