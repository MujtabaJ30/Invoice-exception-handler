# Exception Engine — Context Log

## 2026-06-20 — Credibility upgrade build

### What changed
- Replaced localStorage learning loop with Neon Postgres + local JSON fallback.
- Added serverless API routes: `/api/rules`, `/api/reviews`, `/api/invoices`, `/api/metrics`, `/api/generate`.
- Added invoice ingestion via JSON upload.
- Added ROI metrics dashboard (touchless rate, cost per invoice, learned rules).
- Added Zod validation for LLM proposals.
- Fixed skipped learned rule logic so the correct rule state shows per exception.
- Fixed ErrorBoundary using non-existent Tailwind classes.
- Modernized `vercel.json`.
- Added Vitest tests for detection engine and local database.
- Audited copy across How It Works, Onboarding, and README to reduce AI-slop markers.
- Fixed Vite dev middleware ESM import paths (`pathToFileURL`, explicit `.ts` extensions) so `/api/*` routes work on Windows.
- Fixed all serverless route imports to use explicit file paths instead of directory imports.
- Changed `/api/generate` to return 200 with fallback proposals when the LLM fails, so the UI stays usable without an API key.
- Fixed `InvoiceUploader` ingestion flow so uploaded exceptions are returned to the frontend and displayed.
- Smoke-tested the full backend flow locally: ingestion, detection, review creation, rule creation, metrics, and fallback proposal generation.
- Added `.agents/`, `.claude/`, `.continue/`, and `dev-server.log` to `.gitignore`.
- Full frontend redesign: guided workflow with stage indicator, Phosphor icons, bento-style How It Works, redesigned cards, light mode by default, reduced-motion support, Learn confirmation banner.
- Fixed InvoiceList to show pending counts and resolved status.
- Build, tests, and TypeScript checks pass.

### What still needs to happen
- Create Neon database and add `DATABASE_URL` to Vercel environment variables.
- Add rotated `OPENCODE_GO_API_KEY` to Vercel environment variables.
- Deploy to Vercel and run end-to-end test.
- Record Loom demo and finalize pitch deck.
