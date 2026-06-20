import {
  FileText,
  MagnifyingGlass,
  Sparkle,
  Checks,
  Lightning,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Globe,
  Bell,
  UsersThree,
} from '@phosphor-icons/react';

export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10">
      <section className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          The problem
        </p>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Exceptions eat 40% of AP time. This engine resolves them end-to-end.
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Most invoices match their PO and post automatically. The 20 percent that don't
          are where teams get stuck: chasing vendors, recalculating taxes, hunting down
          missing documents. Zamp's AI employee handles that gap. Rules find the issue.
          The model drafts a fix. You approve or override. Each approval teaches the
          system to handle that pattern on its own next time.
        </p>
      </section>

      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4">
          How the engine works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <WorkflowStep
            number={1}
            icon={FileText}
            title="Ingest"
            description="Drop JSON invoices. ERP connectors next."
          />
          <WorkflowStep
            number={2}
            icon={MagnifyingGlass}
            title="Detect"
            description="Deterministic rules find issues. No false positives."
          />
          <WorkflowStep
            number={3}
            icon={Sparkle}
            title="Propose"
            description="The AI employee reviews context and drafts a fix."
          />
          <WorkflowStep
            number={4}
            icon={Checks}
            title="Decide"
            description="Approve, skip, or type your own resolution."
          />
          <WorkflowStep
            number={5}
            icon={Lightning}
            title="Learn"
            description="Next time that pattern shows up, it resolves on its own."
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={22} className="text-primary" weight="fill" />
            <h3 className="text-base font-semibold text-foreground">Rules first, AI second</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Detection is deterministic and auditable. The AI never approves money.
            It proposes. A person decides. Every decision is logged with a timestamp
            and the fix that was applied.
          </p>
          <DetectionList />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={22} className="text-success" weight="fill" />
            <h3 className="text-base font-semibold text-foreground">Built to be credible</h3>
          </div>
          <ul className="space-y-3">
            <CredibilityPoint
              title="Postgres, not localStorage"
              description="Rules, reviews, and invoices survive restarts. Audit trail is real."
            />
            <CredibilityPoint
              title="Exact pattern matching"
              description="Learned rules use precise field comparisons. No fuzzy string matches."
            />
            <CredibilityPoint
              title="Always works"
              description="If the model API is down, the engine still offers type-specific fallback fixes."
            />
            <CredibilityPoint
              title="Per-company scoping"
              description="Each company's learned rules stay isolated. Your corrections don't leak."
            />
          </ul>
        </div>
      </section>

      <section className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          What's next
        </p>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Where this goes as a product
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VisionPoint
            icon={FileText}
            title="PDF and OCR ingestion"
            description="Accept real invoices. Use LLM-backed extraction instead of JSON uploads."
          />
          <VisionPoint
            icon={Globe}
            title="ERP connectors"
            description="Plug into Netsuite, SAP, Oracle. Pull invoices and push resolutions."
          />
          <VisionPoint
            icon={Bell}
            title="Approval routing and SLAs"
            description="Route by amount tier and vendor. Escalate on timer. Alert via Slack."
          />
          <VisionPoint
            icon={UsersThree}
            title="Multi-tenant for enterprise"
            description="Company-scoped rules. Role-based access. SOC 2 compliant."
          />
        </div>
      </section>

      <section className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-3">See the learning loop</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
          <li>Go to Queue. Pick an invoice with an exception badge.</li>
          <li>Click "Get fix proposals." Wait for the AI to draft fixes.</li>
          <li>Approve a fix. The engine saves the pattern.</li>
          <li>Reset the demo. Pick the same invoice again. The learned fix applies automatically.</li>
        </ol>
      </section>
    </div>
  );
}

function WorkflowStep({
  number,
  icon: Icon,
  title,
  description,
}: {
  readonly number: number;
  readonly icon: React.ElementType;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </div>
        <Icon size={20} className="text-primary" weight="fill" />
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function VisionPoint({
  icon: Icon,
  title,
  description,
}: {
  readonly icon: React.ElementType;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-surface/70">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon size={18} weight="fill" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function DetectionList() {
  const rules = [
    { name: 'Missing PO Number', severity: 'High' },
    { name: 'Duplicate Invoice', severity: 'Critical' },
    { name: 'Amount Mismatch', severity: 'High' },
    { name: 'Tax Calculation Error', severity: 'Medium' },
    { name: 'Unknown Vendor', severity: 'Medium' },
    { name: 'Future Date', severity: 'Low' },
    { name: 'Negative Amount', severity: 'High' },
  ];

  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <div
          key={rule.name}
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/70"
        >
          <span className="text-sm text-foreground">{rule.name}</span>
          <SeverityBadge severity={rule.severity} />
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { readonly severity: string }) {
  const styles: Record<string, string> = {
    Critical: 'bg-danger/10 text-danger border-danger/20',
    High: 'bg-danger/10 text-danger border-danger/20',
    Medium: 'bg-warning/10 text-warning border-warning/20',
    Low: 'bg-muted/20 text-muted-foreground border-border',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

function CredibilityPoint({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <ArrowRight size={16} className="text-success mt-0.5 shrink-0" weight="bold" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
