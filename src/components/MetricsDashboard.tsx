interface MetricsDashboardProps {
  readonly totalInvoices: number;
  readonly totalExceptions: number;
  readonly resolvedExceptions: number;
  readonly pendingExceptions: number;
  readonly autoResolvedCount: number;
  readonly learnedRulesCount: number;
}

const MANUAL_COST_PER_INVOICE = 13.5;

export default function MetricsDashboard({
  totalInvoices,
  totalExceptions,
  resolvedExceptions,
  pendingExceptions,
  autoResolvedCount,
  learnedRulesCount,
}: MetricsDashboardProps) {
  const touchlessRate = totalExceptions > 0 ? autoResolvedCount / totalExceptions : 0;
  const touchlessRatePct = Math.round(touchlessRate * 100);

  const laborHoursSaved = (resolvedExceptions * 12) / 60;
  const costSaved = laborHoursSaved * 45;
  const costPerInvoice =
    totalInvoices > 0
      ? Math.max(0, MANUAL_COST_PER_INVOICE - costSaved / totalInvoices)
      : MANUAL_COST_PER_INVOICE;
  const potentialSavings = Math.max(0, MANUAL_COST_PER_INVOICE - costPerInvoice);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Touchless rate"
          value={`${touchlessRatePct}%`}
          subtext="Exceptions resolved without a person"
          color="success"
        />
        <MetricCard
          label="Cost per invoice"
          value={`$${costPerInvoice.toFixed(2)}`}
          subtext={`Down from $${MANUAL_COST_PER_INVOICE.toFixed(2)} manual baseline`}
          color="primary"
        />
        <MetricCard
          label="Exceptions handled"
          value={String(resolvedExceptions)}
          subtext={`${pendingExceptions} still pending`}
          color="warning"
        />
        <MetricCard
          label="Rules learned"
          value={String(learnedRulesCount)}
          subtext="Patterns saved from decisions"
          color="foreground"
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Impact estimate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Invoices processed</p>
            <p className="text-2xl font-bold font-mono text-foreground mt-1 tabular-nums">
              {totalInvoices}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total exceptions</p>
            <p className="text-2xl font-bold font-mono text-foreground mt-1 tabular-nums">
              {totalExceptions}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Savings per invoice</p>
            <p className="text-2xl font-bold font-mono text-success mt-1 tabular-nums">
              ${potentialSavings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">How we calculate impact</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Zamp's target for enterprise AP is a 70-90% touchless rate. The baseline manual cost is
          roughly $13-23 per invoice. Every learned rule here is one less decision for a person to
          make later. Every auto-resolved exception is one less interruption for the finance team.
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  color,
}: {
  readonly label: string;
  readonly value: string;
  readonly subtext: string;
  readonly color: 'success' | 'primary' | 'warning' | 'foreground';
}) {
  const colorClasses = {
    success: 'text-success bg-success/10 border-success/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    foreground: 'text-foreground bg-muted/10 border-border',
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${colorClasses[color]}`}>
      <p className="text-xs opacity-80 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-3xl font-bold font-mono mt-2 tabular-nums">{value}</p>
      <p className="text-xs opacity-70 mt-1">{subtext}</p>
    </div>
  );
}
