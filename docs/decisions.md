# Exception Engine — Decisions

## Why a real database instead of localStorage?
localStorage was the biggest toy signal in the original MVP. A PM take-home for an enterprise AI company needs persistence that survives browser refreshes, supports audit trails, and can scale to multiple users. Neon Postgres gives us that. A local JSON fallback keeps local dev simple without a database URL.

## Why Neon / `@neondatabase/serverless`?
Vercel Postgres was deprecated in favor of Neon. Using the Neon serverless driver directly is future-proof and works well in Vercel's serverless environment.

## Why deterministic detection + LLM proposals?
Finance cannot tolerate hallucinated approvals. Rules detect exceptions instantly and are fully auditable. The LLM only generates suggestions for human review. This mirrors Zamp's own architecture: human-in-the-loop by exception, not by default.

## Why invoice ingestion?
The original MVP only had 6 hardcoded invoices. That made the learning loop hard to demonstrate. JSON ingestion lets reviewers add real invoice data and see the system detect exceptions and learn from fixes.

## Why Zod for LLM output?
The original code parsed JSON with regex. Zod validates structure and types, so malformed model responses fall back gracefully instead of crashing the UI.

## Why keep the existing React/Vite/Tailwind stack?
It was already working. Switching stacks for a 1-day build would add risk without meaningful payoff.

## Why a metrics dashboard?
Zamp's pitch centers on business outcomes: touchless rate, cost per invoice, time saved. The metrics tab proves the product thinking is tied to those outcomes.

## Security rules
- API keys and database credentials live only in serverless functions and Vercel environment variables.
- `.env` and `.local-data/` are gitignored.
- Any leaked key is rotated immediately.
