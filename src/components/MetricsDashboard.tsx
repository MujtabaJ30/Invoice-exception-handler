interface MetricsDashboardProps {
  readonly totalInvoices: number;
  readonly totalExceptions: number;
  readonly resolvedExceptions: number;
  readonly pendingExceptions: number;
  readonly autoResolvedCount: number;
  readonly learnedRulesCount: number;
}

const MANUAL_COST_PER_INVOICE = 13.5;
const MIN_COST_PER_INVOICE = 1.5;
const MINUTES_PER_EXCEPTION = 12;
const LABOR_RATE_PER_HOUR = 45;
const ZAMP_TARGET_COST = 2.75;

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

  const laborHoursSaved = (resolvedExceptions * MINUTES_PER_EXCEPTION) / 60;
  const costSaved = laborHoursSaved * LABOR_RATE_PER_HOUR;
  const invoicesForCalc = Math.max(1, totalInvoices);
  const costPerInvoice = Math.max(
    MIN_COST_PER_INVOICE,
    MANUAL_COST_PER_INVOICE - costSaved / invoicesForCalc,
  );
  const savings = Math.min(
    MANUAL_COST_PER_INVOICE - MIN_COST_PER_INVOICE,
    MANUAL_COST_PER_INVOICE - costPerInvoice,
  );
  const savingsPct = Math.round((savings / MANUAL_COST_PER_INVOICE) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Touchless rate"
          value={`${touchlessRatePct}%`}
          subtext={`${autoResolvedCount} of ${totalExceptions} auto-resolved`}
          color="success"
        />
        <MetricCard
          label="Cost per invoice"
          value={`$${costPerInvoice.toFixed(0)}`}
          subtext={`$${savings.toFixed(0)} saved per invoice vs $${MANUAL_COST_PER_INVOICE.toFixed(0)} baseline`}
          color="primary"
        />
        <MetricCard
          label="Exceptions resolved"
          value={String(resolvedExceptions)}
          subtext={`${pendingExceptions} pending · ${savingsPct}% cost reduction`}
          color="warning"
        />
        <MetricCard
          label="Rules learned"
          value={String(learnedRulesCount)}
          subtext={`Targeting $${ZAMP_TARGET_COST.toFixed(0)}/invoice with scaling`}
          color="foreground"
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Impact estimate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending invoices</p>
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
              ${savings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">How we calculate impact</h3>
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>
            <span className="font-medium text-foreground">Baseline:</span> Manual AP processing at{' '}
            <span className="font-mono text-foreground">${MANUAL_COST_PER_INVOICE.toFixed(0)}/invoice</span>,{' '}
            {MINUTES_PER_EXCEPTION} min per exception at{' '}
            <span className="font-mono text-foreground">${LABOR_RATE_PER_HOUR}/hr</span>.
          </p>
          <p>
            <span className="font-medium text-foreground">Touchless rate:</span> Percentage of exceptions
            resolved by a learned rule without any person reviewing it. Zamp targets 85-90%.
          </p>
          <p>
            <span className="font-medium text-foreground">Cost floor:</span> Savings are capped at{' '}
            <span className="font-mono text-foreground">${(MANUAL_COST_PER_INVOICE - MIN_COST_PER_INVOICE).toFixed(0)}</span>{' '}
            per invoice — the cost never drops below{' '}
            <span className="font-mono text-foreground">${MIN_COST_PER_INVOICE.toFixed(0)}</span> to
            account for infrastructure and oversight.
          </p>
        </div>
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
