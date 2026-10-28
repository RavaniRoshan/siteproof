# SiteProof Implementation Plan

## Status
Empty repository at start. Stack chosen per PRD defaults with documented fallbacks where infrastructure is unavailable locally.

## Stack decision
- Next.js 15 App Router + TypeScript.
- Tailwind CSS v4 + accessible component patterns (no shadcn CLI; hand-rolled primitives).
- Data: Drizzle ORM + better-sqlite3 (local/self-hosted). Production target remains Postgres/Supabase; RLS policies provided as SQL migration artifact (`supabase/migrations/*.sql`) for deployment. Rationale: no Docker/Postgres/Supabase CLI available in this environment; SQLite keeps dev/test runnable. Documented in assumptions.
- Auth: signed httpOnly session cookie (jose) + bcryptjs password hashing. Single-org-per-user in UI; schema allows membership.
- Validation: Zod at server boundaries.
- Tests: Vitest (unit/integration) + Playwright (browser smoke).
- Export: print-ready HTML report + CSV/JSON (PDF deferred; documented scope decision).
- AI: server-only adapter, disabled unless provider configured AND org consent; deterministic fixtures in tests.

## Phases
### Phase 0 (done): discovery + docs
### Phase 1: skeleton, env validation, DB, auth, org, UI shell, migrations
Acceptance: `npm run dev`, `npm run build`, login/register, org auto-create, dashboard.
### Phase 2: project → BOQ → work log → private evidence upload → timeline
Acceptance: create project, BOQ item, work log, upload evidence, view timeline; tenant isolation tests.
### Phase 3: variations workflow
### Phase 4: packet builder + export (selection, preview, warnings, freeze snapshots, export + audit)
### Phase 5: optional AI adapter (consent-gated, validated, fallback)
### Phase 6: hardening (isolation review, a11y, responsive, upload abuse, docs)

## Data model
See PRD core entities. SQLite schema mirrors them with integer minor currency units (paise). All tenant rows carry organization_id.

## Risks
- SQLite concurrency not suited to production multi-tenant; document migration to Postgres.
- File storage local filesystem in dev; production should use private bucket + signed URLs. Local adapter stores under data/uploads and serves via authenticated route.
- Auth is custom; production should prefer Supabase Auth. RLS policies provided as reference.
- No live AI; adapter disabled by default.

## First vertical slice
Phase 1 + 2: auth → org → project → BOQ → work log → evidence upload → timeline, with tests.
