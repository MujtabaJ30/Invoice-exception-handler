import type { Exception } from '../types';
import {
  getExceptionTypeLabel,
  getSeverityColor,
} from '../lib/exceptions';

interface ExceptionPanelProps {
  readonly exception: Exception;
  readonly hasLearnedRule: boolean;
  readonly skippedRuleId: string | null;
  readonly onGenerateProposals: () => void;
  readonly onReapplyLearnedRule: () => void;
  readonly isProcessing: boolean;
}

const SEVERITY_ICONS: Record<string, string> = {
  low: '\u2139\uFE0F',
  medium: '\u26A0\uFE0F',
  high: '\u274C',
  critical: '\uD83D\uDEA8',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function ExceptionPanel({
  exception,
  hasLearnedRule,
  skippedRuleId,
  onGenerateProposals,
  onReapplyLearnedRule,
  isProcessing,
}: ExceptionPanelProps) {
  const severityColor = getSeverityColor(exception.severity);
  const isSkipped = hasLearnedRule && skippedRuleId !== null;

  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border animate-slide-up"
      style={{ borderLeftWidth: '4px', borderLeftColor: severityColor }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: severityColor + '1A' }}
            >
              <SeverityIcon severity={exception.severity} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {getExceptionTypeLabel(exception.type)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {SEVERITY_LABELS[exception.severity]} severity
              </p>
            </div>
          </div>
          {hasLearnedRule ? (
            <span className="px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">
              Learned Rule Available
            </span>
          ) : null}
        </div>

        <div className="bg-surface rounded-lg p-4 mb-4">
          <p className="text-sm text-foreground">{exception.message}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(exception.details).map(([key, value]) => (
            <div key={key}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                {formatKey(key)}
              </p>
              <p className="text-sm text-foreground mt-1 font-mono">
                {formatValue(value)}
              </p>
            </div>
          ))}
        </div>

        {isProcessing ? (
          <button
            disabled
            className="w-full bg-primary/60 text-primary-foreground font-medium py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse animation-delay-150" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse animation-delay-300" />
            <span className="ml-1 text-primary-foreground/70">Analyzing exception</span>
          </button>
        ) : isSkipped ? (
          <div className="flex gap-2">
            <button
              onClick={onReapplyLearnedRule}
              className="flex-1 bg-success/10 hover:bg-success/20 text-success font-medium py-2.5 px-4 rounded-lg transition-colors text-sm border border-success/20"
            >
              Re-apply Learned Rule
            </button>
            <button
              onClick={onGenerateProposals}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Generate New Fixes
            </button>
          </div>
        ) : hasLearnedRule ? (
          <button
            onClick={onGenerateProposals}
            className="w-full bg-success/10 hover:bg-success/20 text-success font-medium py-2.5 px-4 rounded-lg transition-colors text-sm border border-success/20"
          >
            Apply Learned Rule
          </button>
        ) : (
          <button
            onClick={onGenerateProposals}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Generate Fix Proposals
          </button>
        )}
      </div>
    </div>
  );
}

function SeverityIcon({ severity }: { readonly severity: string }) {
  const icon = SEVERITY_ICONS[severity] || SEVERITY_ICONS.medium;
  return <span aria-hidden="true">{icon}</span>;
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
