# Exception Engine — PM Pitch

**For the Zamp AI Product Manager assignment.**

## The problem

AP teams spend 40% of their time on exceptions. An invoice with a missing PO. A duplicate entry. An amount that does not match the contract. These are not edge cases. Zamp's own data says 20-22% of invoices fail matching and each one costs $9-13 to resolve manually, with a 7-10 day cycle.

The current tooling flags the problem and stops. A person opens the ERP, finds the context, figures out the fix, and enters it. No learning. No compounding. The same exceptions reappear and the same person does the same work.

## The product

**Exception Engine is an AI employee that owns exception resolution end-to-end.**

Four stages:

1. **Detect.** Deterministic rules catch 7 exception types in under 100ms. Missing PO, duplicate invoice, amount mismatch, tax error, unknown vendor, future date, negative amount. No false positives. Every detection is auditable.

2. **Propose.** An LLM reviews the invoice context and drafts a fix with a confidence score. The AI never approves money. It proposes. A person decides.

3. **Decide.** The user sees the proposal, the reasoning, and the confidence. They approve, skip, or type their own resolution. Every decision is logged with a timestamp.

4. **Learn.** When a fix is approved, the engine saves the exception pattern to Postgres. Next time the same pattern appears on any invoice, the fix applies automatically. The user sees "Learned fix available" and can apply it in one click or generate fresh proposals.

**The learning loop is the product.** Each approval makes the engine faster and cheaper. This is the compounding advantage that RPA and rule-based tools do not have.

## Why this matters for Zamp

Zamp positions itself as an AI employee, not a chatbot. This engine fits that thesis exactly:

- **Owns the job.** Not a flagging tool. Not a routing tool. From detection to resolution to learning.
- **Human-in-the-loop.** The AI drafts. The person decides. Judgment stays where it belongs.
- **End-to-end.** Ingestion, detection, proposal, decision, learning. One engine.
- **Agentic, not deterministic.** Rules detect. AI proposes. The system learns from corrections.

Zamp's blog post "From Flag to Fix" describes a 4-stage exception pipeline that could use this exact architecture.

## Metrics that matter

The engine tracks what an AP manager cares about:

| Metric | Calculation |
|--------|------------|
| Touchless rate | Auto-resolved exceptions ÷ total |
| Cost per invoice | $13.50 baseline minus labor saved |
| Resolution time | From detection to decision |
| Rules learned | Patterns saved from approvals |

Baseline assumptions: $13.50 per manual invoice, 12 min per exception, $45/hr labor rate. Floor of $1.50 per invoice to account for infrastructure and oversight. Zamp's own target is $2.75 per invoice.

## What makes it credible

- **Postgres, not localStorage.** Rules and reviews survive restarts. Audit trail is real.
- **Exact pattern matching.** Learned rules compare field values precisely. No fuzzy matching that produces false positives.
- **Deterministic detection.** The AI never decides what is an exception. Rules do. The AI only proposes fixes.
- **Zod-validated LLM output.** Structured proposals with enforced schemas. No free-text guessing.
- **Fallback proposals.** If the LLM API is down, the engine still offers type-specific fixes.

## Roadmap

Phase 2 moves this from a demo to a real product:

1. **PDF and OCR ingestion.** Replace JSON uploads with real invoices. Use LLM-backed extraction with 98%+ accuracy as Zamp claims.
2. **ERP connectors.** Plug into Netsuite, SAP, Oracle. Pull invoices via API and push resolutions back.
3. **Approval routing.** Route by amount tier, vendor, and GL code. Escalate on timer. Alert via Slack and Teams.
4. **Multi-tenant.** Company-scoped rules. Role-based access. SOC 2 compliance.

## Demo

[Live deployment](https://exception-engine.vercel.app)

Click "Reset demo" in the header for a clean slate. Pick an invoice, generate proposals, approve a fix, then reset and watch the learned fix apply automatically.

---

*Built for the Zamp AI Product Manager assignment. Not a spec. A working MVP with a real database, a real LLM, and a real learning loop.*
