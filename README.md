# AI Invoice Exception Handler (Zamp)

An MVP for AP teams that resolves invoice exceptions with a rules-first, human-in-the-loop AI workflow.

This project started as a PM assignment and was then polished into a portfolio-ready case study. The core idea is simple: most invoices post automatically, but the exceptions are where finance teams lose time. This product detects those exceptions deterministically, proposes fixes with an LLM, captures human decisions, and learns approved resolutions for next time.

## Links

- Live app: [invoice-exception-handler.vercel.app](https://invoice-exception-handler.vercel.app/)
- GitHub repo: [MujtabaJ30/Invoice-exception-handler](https://github.com/MujtabaJ30/Invoice-exception-handler)
- Loom walkthrough: [2-minute demo](https://www.loom.com/share/530ac0066d3c487d87490231ffa5d1c2)

## What this product does

- Detects 7 invoice exception types with deterministic rules
- Generates structured fix proposals with confidence scores
- Keeps a human in the loop for approval, rejection, or custom correction
- Learns approved fixes and reapplies them when the same pattern returns
- Tracks outcome metrics like touchless resolution, handled exceptions, and rules learned

## Why this is interesting

Most AP tools stop at flagging a problem. This MVP focuses on the full loop:

1. Detect the issue
2. Propose a fix
3. Capture the human decision
4. Learn from that decision

That learning loop is the product. Each approved resolution makes the next similar exception cheaper and faster to handle.

## Product framing

### User

Accounts payable teams reviewing exceptions such as missing POs, duplicate invoices, tax mismatches, unknown vendors, or incorrect totals.

### Problem

Manual exception handling is repetitive, slow, and expensive. Teams often resolve the same issues again and again with no compounding benefit.

### MVP solution

A rules-first exception engine that keeps financial judgment with the human reviewer while using AI to reduce repetitive work.

### Scope of this MVP

- JSON invoice ingestion
- Deterministic exception detection
- LLM-generated proposals with fallback behavior
- Review logging
- Learned-rule persistence
- Impact dashboard

### Not in scope yet

- PDF and OCR ingestion
- ERP integrations like NetSuite, SAP, or Oracle
- Approval routing and SLA automation
- Multi-tenant enterprise controls

## Screenshots

### Queue and triage

The main workspace keeps exception review focused: invoice queue on the left, current document and exception details in the center, and next-step actions close at hand.

![Exception Queue home page](</E:/Projects/zamp/exception-engine/docs/assets/exception-queue-home.png>)

### Proposal generation

Once an exception is selected, the product generates candidate fixes while keeping the human reviewer in control of the final decision.

![Generating fix proposal](</E:/Projects/zamp/exception-engine/docs/assets/generating-fix-proposal.png>)

### Guided walkthrough

The product includes a built-in demo path so reviewers and recruiters can understand the learning loop quickly without needing outside setup.

![Demo instructions](</E:/Projects/zamp/exception-engine/docs/assets/demo-instructions.png>)

### Decisions and audit trail

Every action is logged so the workflow stays reviewable instead of becoming a black-box automation layer.

![Decisions log](</E:/Projects/zamp/exception-engine/docs/assets/decisions-log.png>)

### Impact view

The dashboard ties product behavior back to operational outcomes like handled work, touchless processing, and rules learned.

![Impact Dashboard](</E:/Projects/zamp/exception-engine/docs/assets/impact-dashboard.png>)

## Demo flow

1. Open the Queue tab and pick an invoice with an exception.
2. Generate fix proposals.
3. Approve one proposal or enter a custom correction.
4. Reset the demo and reopen the same exception.
5. Show that the learned fix is now available instantly.

## Architecture

```text
Invoice data -> deterministic detection engine -> exception identified
             -> LLM proposal generation -> human decision
             -> review log + learned rule persistence
             -> same pattern returns -> learned fix suggested/applied
```

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Backend | Vercel serverless functions |
| Database | Neon/Postgres with local JSON fallback |
| LLM output validation | Zod |
| Motion | Framer Motion |
| Testing | Vitest |

## Credibility choices

- Deterministic rules decide what is wrong
- AI proposes fixes instead of approving money autonomously
- Learned rules persist instead of resetting on refresh
- LLM output is validated and has fallback proposals when generation fails
- Business metrics are visible in the product, not just described in slides

## Local development

```bash
npm install
npm run dev
npm test
npm run build
```

Create a local `.env` file if you want live LLM responses:

```bash
OPENCODE_GO_API_KEY=your_key_here
DATABASE_URL=your_database_url_here
```

The app still works in a demo-friendly mode without those values by using fallback behavior where possible.

## Repo structure

```text
api/                  Serverless endpoints
src/components/       Dashboard and interaction UI
src/lib/exceptions.ts Deterministic exception detection
src/lib/learning.ts   Learned rule creation and application
src/lib/db/           Postgres and local fallback data layer
docs/                 Pitch, demo script, context, and portfolio assets
```

## Portfolio notes

This repo is presented as an MVP case study rather than a finished enterprise product. The goal is to show product thinking, implementation depth, and a credible AI workflow with clear safety boundaries.

## License

MIT. See [LICENSE](</E:/Projects/zamp/exception-engine/LICENSE>).
