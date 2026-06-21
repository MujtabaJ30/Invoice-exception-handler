# Exception Engine

### **Live demo:** [https://exception-engine.vercel.app](https://invoice-exception-handler.vercel.app/)


An AI employee for invoice exception handling. Built for the Zamp AI PM assignment.

Exceptions eat 40% of AP team time. Most invoices match their PO and post automatically. The 20% that don't are where teams get stuck: chasing vendors, recalculating taxes, hunting down missing documents. This engine handles that gap, end-to-end.

**What it does:**

- Detects 7 types of invoice exceptions with deterministic rules (no false positives)
- Uses an LLM to draft fix proposals with confidence scores
- Lets a person approve, skip, or write a custom fix
- Learns from every approval. Same exception pattern next time? Resolved automatically.
- Shows real-time ROI metrics: touchless rate, cost per invoice, rules learned

**Why it fits Zamp:**

Zamp ships AI employees that own jobs end-to-end. This engine demonstrates the exact pattern for AP exception handling: deterministic detection catches the issue, the AI employee proposes a resolution, a human stays in the loop for judgment, and every correction makes the system better. The goal is Zamp's own benchmark: 85%+ touchless processing, cost per invoice below $3.


## Architecture

```
User clicks "Get fix proposals"
        │
        ▼
┌──────────────────┐      ┌─────────────────┐
│  Deterministic   │      │  LLM (DeepSeek)  │
│  rule engine     │ ───► │  generates       │
│  detects issue   │      │  fix proposals   │
└──────────────────┘      └─────────────────┘
        │                         │
        ▼                         ▼
┌──────────────────┐      ┌─────────────────┐
│  User approves,  │      │  Pattern saved   │
│  skips, or writes│ ───► │  to Postgres.    │
│  custom fix      │      │  Applied next     │
└──────────────────┘      │  time.           │
                          └─────────────────┘
```

- **Detection:** Deterministic rules. No AI guessing on what's wrong.
- **Proposals:** LLM generates fixes. AI never approves money on its own.
- **Learning:** Exact field-level pattern matching. Not fuzzy string search.
- **Persistence:** Postgres (or local JSON in dev). Rules survive restarts.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, OKLCH color space |
| LLM | OpenCode Go API (DeepSeek v4 Flash) |
| Backend | Vercel serverless functions |
| Database | Postgres (`@vercel/postgres`), local JSON fallback |
| Animation | Framer Motion |
| Validation | Zod (structured LLM output) |
| Testing | Vitest |

## Running locally

```bash
npm install
# Create .env with OPENCODE_GO_API_KEY
npm run dev        # localhost:5173
npm test           # 10 tests
npm run build      # production build
```

## Project structure

```
├── api/               Vercel serverless functions
│   ├── generate.ts    LLM fix proposals
│   ├── rules.ts       Learned rules CRUD
│   ├── reviews.ts     Decision logging
│   ├── invoices.ts    Invoice ingestion
│   ├── metrics.ts     ROI calculations
│   └── reset.ts       Demo reset
├── src/
│   ├── components/    Dashboard, ExceptionPanel, FixProposalCard,
│   │                  MetricsDashboard, InvoiceList, HowItWorks
│   ├── lib/
│   │   ├── exceptions.ts   Detection engine (7 rules)
│   │   ├── db/             Postgres + local JSON abstraction
│   │   ├── api.ts          Frontend API client with retry
│   │   ├── learning.ts     Rule matching and application
│   │   └── invoices.ts     Deterministic demo data
│   └── types/              TypeScript interfaces
└── docs/              Pitch, plan, decisions
```

## What's next

- PDF/OCR ingestion with LLM extraction
- ERP connectors (Netsuite, SAP, Oracle)
- Approval routing by amount tier with SLA tracking
- Multi-tenant enterprise support
