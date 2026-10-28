# SiteProof

Mobile-first web app for small subcontractors to organize site-work evidence and prepare reviewable draft billing/variation packets. Drafts only; humans confirm and submit.

## Commands
- `npm run dev` `npm run build` `npm run typecheck` `npm run lint` `npm run test` `npm run seed`

## Key paths
- `src/app` routes, `src/lib` domain/db/auth/storage/ai, `src/tests` tests, `docs/` plans/reports.

## Invariants
- All tenant data scoped by organizationId server-side.
- Money in integer minor units (paise); never float.
- AI disabled unless configured + org consent; manual workflow must work.
- Variations not approved by attachments/AI.
- Exports user-initiated; no auto-send.
EOF