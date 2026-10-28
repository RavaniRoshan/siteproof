# SiteProof (MVP)

Mobile-first web app for small subcontractors to organize site-work evidence and prepare reviewable draft progress-billing / variation-claim packets. Drafts only; humans remain responsible for confirmation, submission and claims.

## Stack
Next.js 16 (App Router) + TypeScript, Tailwind CSS v4, Drizzle ORM + better-sqlite3 (dev), custom cookie auth, Zod. Production target: Postgres/Supabase (RLS SQL provided under `supabase/migrations`).

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and set `AUTH_SECRET` (>=32 chars).
3. `npm run db:migrate`
4. `npm run seed` (creates demo user `demo@siteproof.local` / `demo-password-123`)
5. `npm run dev` → http://localhost:3000

## Environment variables
See `.env.example`. Placeholders only. Never commit real secrets.

## Tests
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Demo path
1. Log in with demo credentials.
2. Open "Site A – Electrical Fit-out (DEMO)".
3. Review BOQ items, work logs, variation, evidence, missing checklist.
4. Create a packet at `/packets/new`, select records, preview warnings, confirm export, download HTML/CSV/JSON.

## Known limitations
- SQLite dev DB; production should migrate to Postgres/Supabase.
- Auth is custom cookie-based; production should adopt Supabase Auth.
- Export is print-ready HTML + CSV/JSON (PDF deferred).
- Storage is local filesystem; production must use private bucket + signed URLs.
- AI disabled by default; no live provider wired (manual-only).
- RLS policies are documented as SQL artifacts but not executed locally.
- No GST/tax invoice, no auto-send, no payments/e-signature.
EOF