# Exception Engine — Roadmap

## Phase 1: Foundation — done
- Project setup (Vite, React, TypeScript, Tailwind)
- Skills installation (design, frontend, dashboard, accessibility, animation, typography)
- TypeScript types for invoices, exceptions, fixes, reviews, rules, metrics
- Deterministic exception detection (7 rules)
- Design system (OKLCH tokens, semantic colors, light mode)

## Phase 2: Credibility Upgrade — done
- Real backend with Neon Postgres + local JSON fallback
- Serverless API routes for rules, reviews, invoices, metrics
- Refactored learning loop from localStorage to database
- Zod-validated LLM proposals
- Invoice ingestion via JSON upload
- ROI metrics dashboard
- Unit tests for detection engine and local database

## Phase 3: Polish & Demo — in progress
- Human-like copy audit across How It Works, Onboarding, Dashboard, Metrics
- Bug fixes: skipped learned rule logic, ErrorBoundary styling, timeout cleanup
- Modernized vercel.json
- Build verification and TypeScript strict check

## Phase 4: Deploy
- Create Neon database and add `DATABASE_URL` to Vercel
- Add `OPENCODE_GO_API_KEY` to Vercel
- Deploy and verify all API routes
- Record 2-minute Loom demo
- Final README and pitch deck review
