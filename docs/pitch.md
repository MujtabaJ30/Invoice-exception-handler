# AI Invoice Exception Handler - MVP Pitch

**Portfolio case study for an AI-powered AP exception workflow.**

## The problem

AP teams spend a huge share of their time on exceptions: missing POs, duplicate invoices, amount mismatches, tax issues, and unknown vendors. These are not rare edge cases. They are the repetitive, expensive part of the workflow that prevents true touchless processing.

Most tools flag the problem and stop. A human still has to open the ERP, find context, decide the fix, and repeat the same work the next time a similar exception returns.

## The product

**AI Invoice Exception Handler is an MVP that handles exception resolution end-to-end.**

Four stages:

1. **Detect.** Deterministic rules catch 7 exception types quickly and audibly.
2. **Propose.** An LLM reviews invoice context and drafts a structured fix proposal with confidence.
3. **Decide.** A human approves, skips, or writes a custom fix.
4. **Learn.** Approved resolutions are stored and suggested again when the same pattern reappears.

**The learning loop is the product.** Every approved decision improves future handling speed and lowers manual effort.

## Why this matters

- **Owns the job.** Not just flagging. Detection, proposal, decision, and learning are part of one workflow.
- **Human-in-the-loop.** The AI proposes. The human makes the financial judgment.
- **Compounding value.** The same exception should not require the same manual effort forever.
- **Product-oriented metrics.** The system tracks handled exceptions, touchless outcomes, and rules learned.

## Metrics that matter

The engine tracks what an AP lead actually cares about:

| Metric | Calculation |
|---|---|
| Touchless rate | Auto-resolved exceptions divided by total |
| Cost per invoice | Baseline manual handling cost minus labor saved |
| Resolution time | From detection to decision |
| Rules learned | Patterns saved from approved fixes |

Baseline assumptions in the demo are intentionally simple: manual handling cost, review time, and a floor cost for oversight/infrastructure.

## What makes it credible

- **Deterministic detection.** The AI does not decide what is wrong with the invoice.
- **Structured LLM output.** Proposal responses are validated with Zod.
- **Persistent learning.** Rules and reviews are stored instead of disappearing on refresh.
- **Fallback behavior.** If model generation fails, the UI still provides usable type-specific resolutions.
- **Visible business outcomes.** The impact dashboard ties the product to operational value.

## Roadmap

Phase 2 would move this from MVP to broader product capability:

1. **PDF and OCR ingestion.** Replace JSON uploads with real document ingestion.
2. **ERP connectors.** Pull invoices from systems like NetSuite, SAP, or Oracle and push resolutions back.
3. **Approval routing.** Route by amount, vendor, or policy tier and escalate on SLA timers.
4. **Enterprise controls.** Multi-tenant scoping, role-based permissions, and compliance features.

## Demo

- Live deployment: [invoice-exception-handler.vercel.app](https://invoice-exception-handler.vercel.app/)
- Loom walkthrough: [2-minute demo](https://www.loom.com/share/530ac0066d3c487d87490231ffa5d1c2)

Suggested walkthrough:

1. Reset the demo.
2. Pick an invoice with an exception.
3. Generate proposals.
4. Approve a fix.
5. Reset and show the learned fix applying to the repeated pattern.

---

*Presented as an MVP case study. Not a full enterprise product yet, but a working system with a real database, a real LLM, and a real learning loop.*
