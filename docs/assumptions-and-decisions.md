# Assumptions and Decisions

## Validated facts
- Repository was empty at start (no existing stack).
- Node 24, npm 11 available; no Docker, no Postgres, no Supabase CLI installed.
- Playwright and agent-browser available for browser checks.
- Internet available for package install.

## Assumptions (unvalidated)
- A self-hosted SQLite dev database is acceptable for validating the business hypothesis; production should migrate to Postgres/Supabase.
- Custom cookie auth is acceptable for MVP validation; production should adopt Supabase Auth.
- Print-ready HTML + CSV/JSON export satisfies "draft packet artifact" acceptance; PDF deferred until a reliable library is validated in stack.
- Local filesystem storage with authenticated serving route is an acceptable dev fallback for private buckets; production must use private object storage + signed URLs.

## Decisions
- Use integer paise for money. Never binary float.
- AI disabled by default; manual workflow complete without it.
- Synthetic demo data only, clearly labeled.
- RLS policies shipped as SQL migration artifact for Postgres deployment even though dev uses SQLite + app-level authorization.
- Single organization per user in UI; schema retains membership table for future multi-org.

## Known limitations
- No live Supabase; tenant isolation enforced in application layer + tested. RLS SQL provided but not executed locally.
- No PDF generation (HTML print + CSV/JSON only).
- No email/WhatsApp/payouts/GST.
- AI requires explicit env + org consent; defaults to manual.
