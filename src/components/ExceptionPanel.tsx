import { Sparkle, Lightning, ArrowsClockwise } from '@phosphor-icons/react';
import type { Exception } from '../types/index.ts';
import { getExceptionTypeLabel, getSeverityColor } from '../lib/exceptions.ts';
import SeverityIcon from './SeverityIcon.tsx';

interface ExceptionPanelProps {
  readonly exception: Exception;
  readonly hasLearnedRule: boolean;
  readonly skippedRuleId: string | null;
  readonly onGenerateProposals: () => void;
  readonly onReapplyLearnedRule: () => void;
  readonly isProcessing: boolean;
}

export default function ExceptionPanel({
  exception,
  hasLearnedRule,
  skippedRuleId,
  onGenerateProposals,
  onReapplyLearnedRule,
  isProcessing,
}: ExceptionPanelProps) {
  const severityColor = getSeverityColor(exception.severity);
  const isSkipped = skippedRuleId !== null;

  return (
    <div
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-slide-up"
      style={{ borderLeftWidth: '4px', borderLeftColor: severityColor }}
    >
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: severityColor + '14' }}
            >
              <SeverityIcon severity={exception.severity} size={22} className="shrink-0" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {getExceptionTypeLabel(exception.type)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {exception.severity} severity
              </p>
            </div>
          </div>
          {hasLearnedRule && !isSkipped && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">
              <Sparkle size={12} weight="fill" />
              Learned fix available
            </span>
          )}
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-4">{exception.message}</p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {Object.entries(exception.details).map(([key, value]) => (
            <div key={key} className="bg-surface/70 rounded-lg p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                {formatKey(key)}
              </p>
              <p className="text-sm text-foreground mt-1 font-mono break-words">{formatValue(value)}</p>
            </div>
          ))}
        </div>

        {isProcessing ? (
          <div className="space-y-3">
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 bg-primary/40 text-primary-foreground font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed"
            >
              <ArrowsClockwise size={18} className="animate-spin" />
              Generating proposals…
            </button>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-surface animate-pulse" />
              <div className="h-16 rounded-lg bg-surface animate-pulse" />
            </div>
          </div>
        ) : isSkipped ? (
          <div className="flex gap-3">
            <button
              onClick={onReapplyLearnedRule}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-success/10 hover:bg-success/15 text-success font-medium py-2.5 px-4 rounded-lg transition-colors text-sm border border-success/20"
            >
              <Lightning size={16} weight="fill" />
              Use learned fix again
            </button>
            <button
              onClick={onGenerateProposals}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Get new proposals
            </button>
          </div>
        ) : hasLearnedRule ? (
          <button
            onClick={onGenerateProposals}
            className="w-full inline-flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            <Lightning size={18} weight="fill" />
            Apply learned fix
          </button>
        ) : (
          <button
            onClick={onGenerateProposals}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Get fix proposals
          </button>
        )}
      </div>
    </div>
  );
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
