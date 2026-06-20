import { Sparkle, Lightning, ArrowsClockwise } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
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
  readonly elapsedTime: number;
}

export default function ExceptionPanel({
  exception,
  hasLearnedRule,
  skippedRuleId,
  onGenerateProposals,
  onReapplyLearnedRule,
  isProcessing,
  elapsedTime,
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

        {isSkipped ? (
          <div className="flex gap-3">
            <button
              onClick={onReapplyLearnedRule}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-2.5 bg-success/10 hover:bg-success/15 text-success font-semibold py-3 px-5 rounded-xl transition-colors text-sm border border-success/20 disabled:opacity-100"
            >
              {isProcessing ? (
                <><ArrowsClockwise size={16} className="animate-spin" weight="bold" /> Working…</>
              ) : (
                <><Lightning size={16} weight="fill" /> Use learned fix again</>
              )}
            </button>
            <button
              onClick={onGenerateProposals}
              disabled={isProcessing}
              className="flex-1 relative inline-flex items-center justify-between bg-primary text-primary-foreground font-semibold pt-3 pb-4 px-5 rounded-xl transition-colors text-sm disabled:opacity-100 overflow-hidden"
            >
              {isProcessing ? (
                <>
                  <span className="inline-flex items-center gap-2.5">
                    <ArrowsClockwise size={16} className="animate-spin" weight="bold" />
                    Generating…
                  </span>
                  <span className="font-mono tabular-nums opacity-70">{elapsedTime}s</span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/15 overflow-hidden">
                    <motion.div
                      className="h-full w-1/3 bg-primary-foreground/60 rounded-full"
                      animate={{ x: ['-100%', '400%'] }}
                      transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
                    />
                  </div>
                </>
              ) : (
                'Get new proposals'
              )}
            </button>
          </div>
        ) : hasLearnedRule ? (
          <button
            onClick={onGenerateProposals}
            disabled={isProcessing}
            className="w-full relative inline-flex items-center justify-between bg-success hover:bg-success/90 text-success-foreground font-semibold pt-3 pb-4 px-6 rounded-xl transition-colors text-sm disabled:opacity-100 overflow-hidden"
          >
            {isProcessing ? (
              <>
                <span className="inline-flex items-center gap-2.5">
                  <ArrowsClockwise size={18} className="animate-spin" weight="bold" />
                  Generating proposals…
                </span>
                <span className="font-mono tabular-nums opacity-70">{elapsedTime}s</span>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-success-foreground/15 overflow-hidden">
                  <motion.div
                    className="h-full w-1/3 bg-success-foreground/50 rounded-full"
                    animate={{ x: ['-100%', '400%'] }}
                    transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
                  />
                </div>
              </>
            ) : (
              <><Lightning size={18} weight="fill" /> Apply learned fix</>
            )}
          </button>
        ) : (
          <button
            onClick={onGenerateProposals}
            disabled={isProcessing}
            className="w-full relative inline-flex items-center justify-between bg-primary hover:bg-primary/90 text-primary-foreground font-semibold pt-3 pb-4 px-6 rounded-xl transition-colors text-sm disabled:opacity-100 overflow-hidden"
          >
            {isProcessing ? (
              <>
                <span className="inline-flex items-center gap-2.5">
                  <ArrowsClockwise size={18} className="animate-spin" weight="bold" />
                  Generating proposals…
                </span>
                <span className="font-mono tabular-nums opacity-70">{elapsedTime}s</span>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/15 overflow-hidden">
                  <motion.div
                    className="h-full w-1/3 bg-primary-foreground/60 rounded-full"
                    animate={{ x: ['-100%', '400%'] }}
                    transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
                  />
                </div>
              </>
            ) : (
              'Get fix proposals'
            )}
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
