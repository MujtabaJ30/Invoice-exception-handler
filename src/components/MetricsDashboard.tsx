import { useEffect, useState } from 'react';
import { fetchMetrics } from '../lib/api';
import type { MetricsSnapshot } from '../lib/db/index.ts';

interface MetricsDashboardProps {
  readonly companyId: string;
}

export default function MetricsDashboard({ companyId }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMetrics(companyId)
      .then((data) => {
        if (!cancelled) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load metrics');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-16 text-center">
        <p className="text-muted-foreground text-sm">Loading metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-xl p-8 text-center">
        <p className="text-danger text-sm font-medium">{error || 'No metrics available'}</p>
      </div>
    );
  }

  const touchlessRatePct = Math.round(metrics.touchlessRate * 100);
  const costPerInvoice = metrics.costPerInvoice;
  const potentialSavings = Math.max(0, 13.5 - costPerInvoice);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Touchless rate"
          value={`${touchlessRatePct}%`}
          subtext="Exceptions resolved without human review"
          color="success"
        />
        <MetricCard
          label="Cost per invoice"
          value={`$${costPerInvoice.toFixed(2)}`}
          subtext={`Down from $13.50 manual baseline`}
          color="primary"
        />
        <MetricCard
          label="Exceptions resolved"
          value={String(metrics.resolvedExceptions)}
          subtext={`${metrics.pendingExceptions} still pending`}
          color="warning"
        />
        <MetricCard
          label="Learned rules"
          value={String(metrics.learnedRulesCount)}
          subtext="Patterns saved from past decisions"
          color="foreground"
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">ROI estimate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoices processed</p>
            <p className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.totalInvoices}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total exceptions</p>
            <p className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.totalExceptions}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Savings per invoice</p>
            <p className="text-2xl font-bold font-mono text-success mt-1">${potentialSavings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">What these numbers mean</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Zamp's target for enterprise AP is a 70-90% touchless rate. The baseline manual cost
          is roughly $13-23 per invoice. Every learned rule here is one less decision for a
          person to make later. Every auto-resolved exception is one less interruption for the
          finance team.
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
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <p className="text-xs opacity-80 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-3xl font-bold font-mono mt-2">{value}</p>
      <p className="text-xs opacity-70 mt-1">{subtext}</p>
    </div>
  );
}
