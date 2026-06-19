export default function HowItWorks() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-12">
      <section>
        <h2 className="text-lg font-bold font-mono text-foreground mb-3">The real job is exceptions</h2>
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Zamp's AI employee handles the routine invoice flow. But every AP team hits the
            same wall: the exceptions. A vendor forgets the PO number. The same invoice lands
            twice. The total doesn't add up. A new vendor isn't in the system yet.
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Most teams think their exception rate is 10-15%. In practice it's closer to 30-40%.
            That is where the manual work lives. This tool is the exception handler: it detects
            problems, proposes fixes, learns from your decisions, and applies them automatically
            next time.
          </p>
          <div className="bg-surface rounded-lg p-4 mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-warning">The point:</strong> the AI employee should not
              stop at the first unexpected input. It should classify the issue, suggest a fix,
              and only escalate when it is genuinely stuck. Human review by exception, not by
              default.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold font-mono text-foreground mb-3">Detection</h2>
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Detection is rule-based, not AI-based. That matters because rules are fast,
            deterministic, and auditable. You do not want a hallucinated approval when money
            is involved.
          </p>
          <div className="space-y-2 mt-3">
            <DetectionRule type="Missing PO Number" severity="high" what="PO number is blank or null" why="Cannot match the invoice to an approved purchase without it" />
            <DetectionRule type="Duplicate Invoice" severity="critical" what="Same invoice number appears more than once" why="Paying twice is the most expensive mistake in AP" />
            <DetectionRule type="Amount Mismatch" severity="high" what="Total does not equal subtotal plus tax" why="Arithmetic errors can overcharge or undercharge the company" />
            <DetectionRule type="Tax Calculation Error" severity="medium" what="Tax from line items does not match stated total" why="Tax authorities audit these; errors mean penalties" />
            <DetectionRule type="Unknown Vendor" severity="medium" what="Vendor ID is not in the master vendor list" why="Paying unknown entities is a compliance and fraud risk" />
            <DetectionRule type="Future Date" severity="low" what="Invoice date is after today" why="Usually a data entry error, sometimes a prepayment" />
            <DetectionRule type="Negative Amount" severity="high" what="Invoice total or subtotal is negative" why="Could be a legitimate credit memo or a data error" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold font-mono text-foreground mb-3">AI proposals</h2>
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Once an exception is detected, the system sends the context to a language model and
            asks for 2-3 fix proposals. The model receives the exception type, invoice details,
            and any learned rules from previous similar exceptions.
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Each proposal comes with a confidence score and a short explanation. You approve,
            reject, or type your own fix. The LLM only suggests; it never acts on its own.
          </p>
          <div className="bg-surface rounded-lg p-4 mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Fallback:</strong> if the model API is down,
              the system returns pre-built proposals for that exception type. The demo keeps
              working.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold font-mono text-foreground mb-3">Learning</h2>
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            When you approve a fix, the system saves a rule: for this exception pattern, use
            this resolution. The rule is stored in a real database, scoped to your company ID,
            so it persists across sessions and devices.
          </p>
          <div className="bg-surface rounded-lg p-4 mt-2">
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              <span className="text-primary">missing_po</span>:{'{'}
              <span className="text-success">"vendorName"</span>:{' '}
              <span className="text-warning">"Acme Corp"</span>{'}'}
              <span className="text-muted-foreground mx-2">→</span>
              <span className="text-foreground">
                "Add PO number from related purchase requisition"
              </span>
            </p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Next time an Acme Corp invoice arrives without a PO, the rule applies instantly.
            No API call. No waiting. Exact pattern matching prevents false positives: Acme Corp
            will not trigger a rule saved for AcmeCorp.
          </p>
          <div className="bg-surface rounded-lg p-4 mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Storage:</strong> rules, reviews, and invoices
              are persisted in Postgres (Neon on Vercel). For local development without a database
              URL, the system falls back to a JSON file on disk.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold font-mono text-foreground mb-3">Try it</h2>
        <div className="bg-card rounded-xl border border-border p-6 space-y-2">
          <p className="text-sm text-foreground leading-relaxed">
            Switch to the Invoices tab and follow the flow:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li>Pick an invoice with an exception badge.</li>
            <li>Click Generate Fix Proposals and wait for the AI response.</li>
            <li>Approve or reject each proposal.</li>
            <li>Pick another invoice of the same exception type to see the learned rule apply.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}

function DetectionRule({
  type,
  severity,
  what,
  why,
}: {
  readonly type: string;
  readonly severity: string;
  readonly what: string;
  readonly why: string;
}) {
  const severityColor =
    severity === 'critical' ? 'text-danger' :
    severity === 'high' ? 'text-danger' :
    severity === 'medium' ? 'text-warning' : 'text-muted-foreground';

  return (
    <div className="bg-surface rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-semibold uppercase ${severityColor}`}>
          {severity}
        </span>
        <span className="text-sm font-medium text-foreground">{type}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">What:</strong> {what}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
        <strong className="text-foreground">Why:</strong> {why}
      </p>
    </div>
  );
}
