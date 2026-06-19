import {
  FileText,
  MagnifyingGlass,
  Lightbulb,
  Sparkle,
  Checks,
  ArrowRight,
  ShieldCheck,
  Lightning,
} from '@phosphor-icons/react';

export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10">
      <section className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Most AP time is spent on exceptions, not routine invoices.
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Zamp's AI employee handles the standard flow. This tool handles what breaks it:
          missing POs, duplicate invoices, amount mismatches, and unknown vendors. Rules
          detect the problem. The model proposes fixes. You decide. The system learns.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          The workflow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <WorkflowStep
            number={1}
            icon={FileText}
            title="Upload"
            description="Drop in an invoice. JSON today, ERP integration tomorrow."
          />
          <WorkflowStep
            number={2}
            icon={MagnifyingGlass}
            title="Detect"
            description="Deterministic rules find the issue in milliseconds."
          />
          <WorkflowStep
            number={3}
            icon={Sparkle}
            title="Propose"
            description="The model suggests fixes with confidence scores."
          />
          <WorkflowStep
            number={4}
            icon={Checks}
            title="Decide"
            description="Approve, skip, or write a custom fix."
          />
          <WorkflowStep
            number={5}
            icon={Lightning}
            title="Learn"
            description="The same exception resolves automatically next time."
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
            Detection is deterministic and auditable. The model never approves money on its own.
            It only proposes fixes for human review.
          </p>
          <DetectionList />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={22} className="text-success" weight="fill" />
            <h3 className="text-base font-semibold text-foreground">What makes this credible</h3>
          </div>
          <ul className="space-y-3">
            <CredibilityPoint
              title="Real persistence"
              description="Rules, reviews, and invoices live in Postgres, not localStorage."
            />
            <CredibilityPoint
              title="Pattern matching"
              description="Learned rules use exact patterns, not loose substring matches."
            />
            <CredibilityPoint
              title="Fallback proposals"
              description="If the model API is down, the engine still offers exception-type fixes."
            />
            <CredibilityPoint
              title="Audit trail"
              description="Every decision is recorded with a timestamp and the chosen fix."
            />
          </ul>
        </div>
      </section>

      <section className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-2">Try it yourself</h3>
        <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Go to the Queue tab and pick an invoice with an issue badge.</li>
          <li>Click Get fix proposals and wait for the AI response.</li>
          <li>Use a fix or type your own.</li>
          <li>Upload another invoice with the same pattern and watch the learned fix apply.</li>
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
    <div className="relative bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
          {number}
        </div>
        <Icon size={20} className="text-primary" weight="fill" />
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
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
