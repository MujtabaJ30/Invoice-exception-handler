# Exception Engine

A working MVP for the Zamp AI PM assignment. It is an exception handler for invoice processing: deterministic detection, LLM-generated fix proposals, human approval, and a learning loop that persists in a real database.

## What it does

1. **Detects exceptions** using deterministic rules: missing PO, duplicate invoice, amount mismatch, tax error, unknown vendor, future date, negative amount.
2. **Generates fix proposals** with an LLM when an exception needs a decision.
3. **Learns from approvals**: saved rules apply automatically to similar exceptions later.
4. **Shows ROI metrics**: touchless rate, cost per invoice, resolved exceptions, learned rules.
5. **Ingests invoices** via JSON upload so the learning loop is demonstrable with fresh data.

## Why this matters for Zamp

Zamp's AI employee handles the routine invoice flow. The real bottleneck is exceptions. Most AP teams underestimate their exception rate. This tool is the layer that lets the AI employee keep working when invoices break, with human review only when needed.

## Tech stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with OKLCH design tokens
- **LLM**: OpenCode Go API (deepseek-v4-flash)
- **Backend**: Vercel serverless functions
- **Database**: Neon Postgres via `@neondatabase/serverless` (falls back to local JSON file in dev)
- **Validation**: Zod for structured LLM output
- **Tests**: Vitest

## Local setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```
   OPENCODE_GO_API_KEY=your-key-here
   DATABASE_URL=your-neon-connection-string  # optional; local JSON fallback works without it
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Deploy to Vercel

1. Push to GitHub.
2. Import in Vercel.
3. Add `OPENCODE_GO_API_KEY` and `DATABASE_URL` in the Vercel dashboard.
4. Deploy.

## Project structure

```
exception-engine/
├── api/                     # Vercel serverless functions
│   ├── generate.ts          # LLM fix proposal generation
│   ├── rules.ts             # Learned rules CRUD
│   ├── reviews.ts           # Review decisions
│   ├── invoices.ts          # Invoice ingestion and listing
│   └── metrics.ts           # ROI metrics
├── src/
│   ├── components/          # React components
│   ├── lib/
│   │   ├── api.ts           # Frontend API client
│   │   ├── db/              # Database abstraction (Postgres + local fallback)
│   │   ├── exceptions.ts    # Deterministic exception detection
│   │   ├── invoices.ts      # Mock invoice generator
│   │   └── learning.ts      # Learning loop client
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Root state management
│   └── index.css            # Design system
├── docs/                    # Plan, decisions, context
└── README.md
```

## License

ISC
