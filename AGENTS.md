# Exception Engine — Project Rules

## Project Overview
AI-powered exception handling for invoice processing. Built as a PM assignment for Zamp.ai. This is Option 2 of the credibility upgrade: real backend persistence, invoice ingestion, ROI metrics, and Zamp-aligned product narrative.

## Tech Stack
- **Frontend**: React 19 + TypeScript (strict) + Vite
- **Styling**: Tailwind CSS v4 (CSS-based config, OKLCH color space, semantic tokens)
- **LLM**: OpenCode Go API (deepseek-v4-flash, reasoning model — needs 4000 max_tokens)
- **Backend**: Vercel serverless functions (`api/*.ts`)
- **Database**: Vercel Postgres (`@vercel/postgres`) for rules, reviews, invoices, metrics
- **State**: Server-persisted learned rules scoped to a company/session; localStorage used only for ephemeral UI state (active tab, skipped rule IDs in current session)
- **Hosting**: Vercel (serverless functions + static build)
- **Dev**: Vite middleware plugin in `vite.config.ts` proxies `/api/*` locally

## Skills (must reference)
- `.agents/skills/tailwind-design-system/` — OKLCH tokens, semantic pairs, CVA components
- `.agents/skills/vercel-react-best-practices/` — 70 React rules (rerender, bundle, async, client)
- `.agents/skills/typescript-advanced-types/` — branded types, discriminated unions
- `.agents/skills/design-taste-frontend/` — refined UI taste, avoid AI-slop visuals
- `.agents/skills/frontend-design/` — pixel-perfect production details
- `.agents/skills/web-design-guidelines/` — consistent icon/color/layout discipline
- `.agents/skills/landing-page-design/` — hero, CTAs, value proposition structure
- `.agents/skills/ui-animation/` — purposeful motion and micro-interactions
- `.agents/skills/kpi-dashboard-design/` — metrics layout and data clarity
- `.agents/skills/web-typography/` — type scale, hierarchy, readability

## Code Style
- TypeScript strict mode
- Named exports preferred
- Meaningful variable names (no `data`, `temp`, `res`)
- Every async call wrapped in try/catch with user-facing error states
- Constants for all magic numbers/strings
- Functional setState for callbacks (no `[state]` dependency)
- No inline component definitions — all at module level
- `readonly` on all component prop types

## Architecture Decisions
- Serverless API routes for LLM calls and DB access (keys stay server-side) + Vite dev middleware for local
- Deterministic exception detection (regex/rules) + LLM for fix proposals only
- Context-aware fallback proposals per exception type
- **Vercel Postgres for learned rules and reviews** with audit trail (creator, timestamps, hit counts)
- Company/session-scoped rules so learning persists across browsers and devices
- Exact pattern matching only (no substring — prevents false positives)
- ErrorBoundary wrapping entire app
- Retry logic: 2 retries, 1s backoff, 30s timeout on API calls
- `useTransition` for non-blocking proposal generation
- Zod-validated LLM output for structured proposals

## Security & Secrets (hard rules)
- **Never commit `.env` or any file containing secrets.** Add to `.gitignore` and verify with `git status` before every commit.
- **Never expose API keys to the client.** LLM keys and DB credentials stay in serverless functions only.
- **Rotate any leaked key immediately** and treat the old key as compromised.
- **Do not paste secrets into chat.** Reference env var names only.
- Before deploying, confirm Vercel environment variables are set in the dashboard, not in the repo.

## Key Files
- `src/lib/exceptions.ts` — Deterministic exception detection (7 rules)
- `src/lib/api.ts` — OpenCode Go API wrapper with retry logic
- `src/lib/db.ts` — Database abstraction (rules, reviews, invoices, metrics)
- `api/rules.ts` — Serverless routes for learned rules
- `api/reviews.ts` — Serverless routes for review decisions
- `api/invoices.ts` — Serverless routes for invoice ingestion and listing
- `api/generate.ts` — Vercel serverless function for LLM fix proposals
- `vite.config.ts` — Dev API middleware + Tailwind plugin
- `src/components/ExceptionPanel.tsx` — Exception details, severity, dual-button (learned/fresh)
- `src/components/ErrorBoundary.tsx` — Crash recovery
- `src/components/HowItWorks.tsx` — Full explainer tab (problem, detection, proposals, learning)
- `src/components/MetricsDashboard.tsx` — ROI metrics: touchless rate, cost per invoice, resolution time
- `src/App.tsx` — State management with useRef + functional setState, skippedLearnedRuleIds, auto-select next exception
- `src/index.css` — Design system (@theme, OKLCH tokens, animations, light mode)

## Don'ts
- Don't commit .env file or any secrets
- Don't expose API key or DB credentials to the client
- Don't use magic numbers
- Don't skip error handling
- Don't use generic variable names
- Don't define components inside other components
- Don't use `[state]` as a callback dependency
- Don't use substring matching for learned rules
- Don't rely on localStorage for business-critical persisted state
- Don't write AI-slop copy (no em-dash overload, no lists of three for effect, no generic buzzword sentences)
