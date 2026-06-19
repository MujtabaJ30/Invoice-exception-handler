# Exception Engine — UX/UI Redesign Brief

> Scope: component-level redesign only. The existing data model, API client, and serverless routes stay unchanged.

---

## 1. First-principles UX problem statement

Exception handling is a decision workflow, not a browsing workflow. A user lands with one question: **"What is wrong, and what should I do?"** The current UI answers by showing a list, a document, an exception card, and proposal cards all at once. The hierarchy is flat, so a layman has to hunt for the next action.

Two trust-breaking signals stand out:

1. The left invoice list still advertises exceptions after they have been resolved, because the badge counts all exceptions instead of pending ones.
2. The AI learning loop is described in text but not felt in the flow. After approving a fix, the UI jumps to the next exception without celebrating the rule that was just created.

For Zamp employees, the product must feel deterministic and production-grade: rules first, AI second, human decides, system learns. No AI-slop copy, no decorative noise, no guessing about the next step.

---

## 2. Recommended layout

Keep the top-level tab navigation (Invoices / Metrics / Reviews / How it works) but turn the **Invoices** tab into a guided case workspace.

### Structure

- **Header**: product name, global stats, persistent tabs.
- **Left column (queue)**: invoice uploader + invoice list.
- **Right column (case stage)**: a vertical path that walks through the job:
  1. **Document** — invoice header and line items.
  2. **Detect** — all exceptions found on this invoice.
  3. **Understand** — the active exception detail.
  4. **Propose** — AI-generated fix options.
  5. **Decide** — approve, skip, or write a custom fix.
  6. **Learn** — confirmation that a rule was saved.

A small step indicator at the top of the main column shows the six stages and highlights the current one. The list and the case view stay synchronized: selecting an invoice loads its case; resolving an exception updates both the case view and the queue.

### Wireframe

```text
+--------------------------------------------------------------------------+
|  Exception Engine        [12 to review]  [8 handled]  [5 rules learned]  |
+--------------------------------------------------------------------------+
|  [Queue]   [Impact]   [Decisions]   [How it works]                       |
+--------------------------------------------------------------------------+
|  +----------------+  +------------------------------------------------+  |
|  | Ingest invoices|  | INV-2026-0042                    $12,480.00    |  |
|  | [drop zone]    |  | Acme Supply Co.      Due 2026-07-15            |  |
|  +----------------+  +------------------------------------------------+  |
|  | QUEUE          |  | Detected exceptions                            |  |
|  |                |  | - Missing PO Number   (active)                 |  |
|  | INV-0042  2    |  | - Amount Mismatch     (pending)                |  |
|  | INV-0011  1    |  +------------------------------------------------+  |
|  | INV-0098  [done]| | Understand the exception                       |  |
|  |                |  | [exception card: severity, message, fields]    |  |
|  |                |  | [Get fix proposals]                            |  |
|  +----------------+  +------------------------------------------------+  |
|                      | Proposed fixes                                 |  |
|                      | [Recommended] Add PO from requisition   87%    |  |
|                      | [Skip] Create retroactive PO            64%    |  |
|                      +------------------------------------------------+  |
|                      | Decide                                         |  |
|                      | "Or describe a different fix..." [Apply]       |  |
|                      +------------------------------------------------+  |
|                      | Learned: this fix was saved for Acme + missing PO |
|                      +------------------------------------------------+  |
+--------------------------------------------------------------------------+
```

---

## 3. Component-by-component redesign instructions

### Dashboard

- Apply light mode by default. Add `className="light"` to the root wrapper (or switch the default `@theme` tokens to light and gate dark mode behind a `.dark` class).
- Add a skip link that moves focus to `<main id="main-content">`.
- Convert the four tabs into an accessible `tablist` with `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"`. Support Left/Right arrow keys.
- Add a polite `aria-live` region for transient status: "3 fix proposals generated", "Exception resolved", "Rule saved".
- Update header copy: pending count = "to review", resolved count = "handled", rules count = "rules learned".
- Render the main case view as the guided vertical path described above.

### InvoiceList

- Accept `reviewedExceptionIds` so it can compute the real pending count per invoice.
- Show a badge only for **pending** exceptions. Resolved invoices show a success checkmark and the word "Resolved".
- Sort the queue by urgency: invoices with pending exceptions first, ordered by highest pending severity (critical > high > medium > low), then resolved invoices.
- Selected row: 3px left border in `--color-primary`, subtle primary tint background, no emoji.
- Use tabular nums for amounts and dates.
- Add an empty state when every invoice is resolved.

### InvoiceDetail

- Treat the invoice as a document, not a form. Lead with invoice number, vendor, total, and due date in a single header row.
- Use a compact metadata grid (PO number, status, subtotal, tax). Use sans labels and mono values.
- Render line items as rows with aligned columns: description, quantity × unit price, amount, tax.
- In the exception list, highlight the current exception and mark resolved exceptions with a success icon. Make severity visible through an icon + label, not color alone.
- If the invoice has no exceptions, show a calm "No open exceptions" state instead of an empty section.

### ExceptionPanel

- Place it inside the **Understand** stage. Add a stage title: "What the engine found".
- Replace emoji severity icons with icons from `@phosphor-icons/react` (Info, Warning, WarningOctagon, Siren).
- Keep the 4px left accent border in the severity color, but also print the severity label in text.
- Display the exception message as the card title. Render `details` as a definition grid with small uppercase labels.
- Primary action:
  - learned rule available: "Apply learned fix" (success style).
  - learned rule skipped: "Use learned fix again" (success ghost) + "Get new proposals" (primary).
  - none: "Get fix proposals" (primary).
- While processing, replace the button with an inline skeleton that matches the shape of the upcoming proposal cards and a short status: "Checking patterns and past rules…"

### FixProposalCard

- Redesign each proposal as a selectable option card. Lead with the fix description, then a "Why this fix" line in muted text.
- Show confidence as a horizontal segmented bar with a percentage label. Do not use a circular score; it reads like a gamified grade.
- Highlight the highest-confidence proposal with a "Recommended" badge.
- Actions: "Use this fix" (primary) and "Skip" (ghost). Rename "Approve" to "Use this fix" so the user understands they are choosing a resolution, not just giving the AI a pat on the back.
- On "Use this fix", animate the card to a success state and reveal the Learn banner. On "Skip", fade the card out and reflow the remaining cards.

### CustomFixInput

- Move it into the **Decide** stage with the label "Or describe a different fix".
- Use a single-line input plus an "Apply custom fix" button. Disable the button until text is entered.
- Keep focus management: after submit, shift focus to the next active element or the Learn banner.

### ReviewSummary ("Decisions" tab)

- Rename the tab to "Decisions" in the UI. The component name can stay.
- Empty state: landing-style illustration + "Your decisions train the engine. Approve or reject a fix and it will show up here."
- Render decisions as a timeline: exception type, chosen fix, status badge, learned-rule badge, timestamp.
- Keep the four summary cards but improve labels: Approved, Corrected, Rejected, Rules learned.

### MetricsDashboard ("Impact" tab)

- Rename the tab to "Impact".
- Keep the four headline KPIs. Add short definitions in tooltips or small subtext so the methodology is visible.
- Empty / loading / error states use skeletons and inline messages, never a blank card.

### HowItWorks

- Replace the long text sections with a landing-page-style visual explainer. Use a 5-step timeline or bento grid:
  - **Detect** — deterministic rules find the issue.
  - **Understand** — the engine shows what went wrong.
  - **Propose** — the model suggests fixes with confidence scores.
  - **Decide** — you approve, skip, or correct.
  - **Learn** — the engine saves the pattern for next time.
- Each step gets an icon, a 4-8 word headline, one sentence of body copy, and a small detail callout.
- Include a simple CSS/SVG diagram (invoice → magnifier → wrench → checkmark → sparkles) instead of a wall of text.

### Onboarding

- Keep the modal but reduce to four steps:
  1. Pick an invoice from the queue.
  2. Review the exception the engine found.
  3. Choose or write a fix.
  4. Watch the engine apply the same fix next time.
- Use icons from the icon library for each step. CTA: "Open the queue".

---

## 4. Specific copy recommendations

| Location | Before | After | Why |
|---|---|---|---|
| App subtitle | "Exception handling for Zamp's AI employee" | "Resolve invoice exceptions before they slow you down." | States the outcome in plain language. |
| Header pending badge | "X pending" | "X to review" | Tells the user what work remains. |
| Header resolved badge | "X resolved" | "X handled" | "Handled" covers approved, corrected, and rejected. |
| Tab label | "Reviews" | "Decisions" | Matches the action the user actually takes. |
| Tab label | "Metrics" | "Impact" | Ties the dashboard to business value. |
| Left panel title | "Invoices" | "Queue" | Frames it as work to be done. |
| Exception CTA | "Generate Fix Proposals" | "Get fix proposals" | Conversational, fewer words. |
| Learned rule CTA | "Apply Learned Rule" | "Apply learned fix" | "Fix" is the user-facing noun. |
| Skipped rule CTA | "Re-apply Learned Rule" | "Use learned fix again" | Plain, active voice. |
| Proposal primary action | "Approve" | "Use this fix" | Clarifies that the user is selecting a resolution. |
| Proposal secondary action | "Reject" | "Skip" | Less confrontational; the fix is simply not chosen. |
| Custom fix placeholder | "Or describe your own fix..." | "Describe a different fix…" | Uses an ellipsis and a clearer label. |
| No current exception | "All exceptions resolved" | "No open exceptions on this invoice." | Precise and scoped to the document. |
| No reviews empty state | "No reviews yet / Review exceptions to see them here" | "No decisions yet. Approve or reject a fix and it will show up here." | Explains how to populate the view. |
| How it works hero | "The real job is exceptions" | "Most AP time is spent on exceptions, not routine invoices." | Concrete, no rhetorical flourish. |
| How it works step 1 | "Detection" | "Detect" | Verb-first, consistent with the path. |
| How it works step 3 | "AI proposals" | "Propose" | Neutral; avoids "AI" repetition. |

Copy rules for the whole product:

- No em-dashes (`—`). Use a period, comma, colon, or hyphen instead.
- No lists of three buzzwords for effect.
- Active voice, second person.
- Use an ellipsis (`…`) for trailing states like "Checking patterns…".

---

## 5. Visual direction

### Typography

- Keep **Inter** for UI text. Use **JetBrains Mono** only for invoice numbers, amounts, codes, dates, and confidence percentages.
- No mono headings except code samples.
- Scale:
  - App title: `text-lg font-semibold`
  - Section labels: `text-xs font-semibold uppercase tracking-wide`
  - Card titles: `text-base font-semibold`
  - Body: `text-sm font-normal`
  - Small/micro: `text-xs font-normal`
- Use `tabular-nums` on all numeric columns.
- Apply `text-wrap: balance` to headings.

### Spacing

- Page padding: `px-6 py-6` on desktop, `px-4 py-4` on mobile.
- Card padding: `p-5`.
- Section gap in the case view: `gap-5`.
- Internal element gaps: `gap-3` or `gap-4`.
- Consistent 4px grid.

### Color

- Light mode default: white cards, light gray surface, near-black text.
- Semantic usage:
  - Primary actions: `--color-primary` (indigo/blue).
  - Success / resolved / learned: `--color-success` (green).
  - Warning: `--color-warning` (amber) for medium severity and corrected decisions.
  - Danger: `--color-danger` (red) for high/critical severity and rejected decisions.
  - Low severity: slate/gray, not blue.
- Severity must always be paired with an icon + text label. Never rely on color alone.
- Use `bg-{semantic}/10` for tonal backgrounds and `border-{semantic}/20` for soft borders.

### Cards vs panels

- Left queue: panel look — border only, no shadow.
- Case cards: white background, border, subtle shadow-sm, `rounded-xl`.
- Exception card: white background with a 4px left severity border.
- Proposals: selectable cards that gain a primary border on hover/focus.
- KPIs: small border cards with a semantic top border or left accent.

### Shape system

- Cards and panels: `rounded-xl` (12px).
- Buttons: `rounded-lg` (8px).
- Badges and pills: `rounded-full`.
- Do not mix sharp and soft shapes without a documented rule.

---

## 6. Motion / micro-interactions

- **Tab switch**: crossfade the tabpanel content over 200ms with `ease-out`.
- **Queue selection**: instant background change; the selected left border animates width via CSS transition.
- **Proposal reveal**: when proposals appear, stagger them in from `translateY(12px)` and `opacity: 0` over 250ms with 50ms delays.
- **Processing state**: show a skeleton placeholder whose shape matches a proposal card, plus a pulsing status line.
- **Decision feedback**:
  - On "Use this fix": scale the card to `0.98`, then fade it out while a success checkmark scales in.
  - On "Skip": slide the card out to the right and collapse its space.
- **Confidence bar**: animate width over 500ms after the card enters.
- **Learned rule banner**: slide down and fade in after an approval.
- **Button press**: `active:scale-[0.98]` on all buttons.
- Gate every animation behind `prefers-reduced-motion`. Under reduced motion, use instant state changes or opacity-only fades.

---

## 7. Accessibility checklist

- [ ] Skip link to `#main-content`.
- [ ] Tabs use `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, and `aria-controls`. Arrow keys move between tabs.
- [ ] All interactive elements have visible `:focus-visible` rings.
- [ ] `aria-live="polite"` announces proposal results, resolutions, and rule saves.
- [ ] Severity is conveyed by icon + text, not color alone.
- [ ] Form inputs have visible labels (`htmlFor` + `id` or wrapping `<label>`).
- [ ] Icon-only buttons have `aria-label`.
- [ ] Color contrast meets WCAG AA for all text; AAA for body copy where possible.
- [ ] Minimum touch target 24×24px; primary actions aim for 44×44px.
- [ ] Heading hierarchy is logical (`h1` app title, `h2` tab/section titles, `h3` card titles).
- [ ] Decorative icons have `aria-hidden="true"`.
- [ ] Respect `prefers-reduced-motion` for all motion.

---

## 8. Suggested implementation order

1. **Fix trust signals first**
   - Pass `reviewedExceptionIds` into `InvoiceList` and compute pending counts.
   - Sort the queue by pending severity.
   - Apply `className="light"` (or invert the default tokens) so light mode is the default.

2. **Establish the icon and severity system**
   - Install `@phosphor-icons/react`.
   - Replace emoji severity icons with `SeverityIcon`.
   - Ensure every severity indicator includes a text label.

3. **Rebuild the document and queue surfaces**
   - Redesign `InvoiceList` and `InvoiceDetail` with the new spacing, typography, and empty states.

4. **Build the guided case view**
   - In `Dashboard`, replace the flat right column with the Detect → Understand → Propose → Decide → Learn vertical path.
   - Add the step indicator.

5. **Redesign decision components**
   - Refactor `ExceptionPanel`, `FixProposalCard`, and `CustomFixInput` for the new path.

6. **Add landing-style explainers**
   - Rewrite `HowItWorks` as a 5-step visual explainer.
   - Replace all empty states with illustrated, actionable copy.

7. **Motion and feedback**
   - Add `AnimatePresence` for tab/proposal transitions.
   - Add stagger, button press, and success animations.
   - Wrap motion in `prefers-reduced-motion` guards.

8. **Accessibility and copy audit**
   - Run the accessibility checklist.
   - Audit every visible string for AI-slop markers (em-dashes, buzzword triples, passive voice).

---

*Assumptions: the project keeps React 19 + TypeScript strict + Tailwind CSS v4, and the existing `@neondatabase/serverless` backend and API client are not modified.*
