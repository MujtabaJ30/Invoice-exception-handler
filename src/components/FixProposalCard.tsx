import { Check, X, Lightning } from '@phosphor-icons/react';
import type { FixProposal } from '../types/index.ts';

interface FixProposalCardProps {
  readonly proposal: FixProposal;
  readonly isRecommended?: boolean;
  readonly onUse: () => void;
  readonly onSkip: () => void;
}

export default function FixProposalCard({
  proposal,
  isRecommended = false,
  onUse,
  onSkip,
}: FixProposalCardProps) {
  const confidencePercent = Math.round(proposal.confidence * 100);
  const confidenceColor = getConfidenceColor(proposal.confidence);
  const isLearned = proposal.id.startsWith('learned_');

  return (
    <div
      className={`bg-card rounded-xl border overflow-hidden transition-all duration-200 hover:border-primary/40 ${
        isRecommended ? 'border-primary/60 shadow-sm' : 'border-border shadow-sm'
      }`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isRecommended && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-medium rounded-full border border-primary/20">
                <Check size={11} weight="bold" />
                Recommended
              </span>
            )}
            {isLearned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-[11px] font-medium rounded-full border border-success/20">
                <Lightning size={11} weight="fill" />
                Learned fix
              </span>
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {proposal.action.type === 'escalate' ? 'Escalation' : 'Resolution'}
            </span>
          </div>
          <span className="text-sm font-semibold font-mono tabular-nums" style={{ color: confidenceColor }}>
            {confidencePercent}%
          </span>
        </div>

        <p className="text-sm text-foreground font-medium leading-relaxed mb-1">
          {proposal.description}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {proposal.reasoning}
        </p>

        <div className="mb-4">
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${confidencePercent}%`,
                backgroundColor: confidenceColor,
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onUse}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm active:scale-[0.98]"
          >
            <Check size={14} weight="bold" />
            Use this fix
          </button>
          <button
            onClick={onSkip}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-surface hover:bg-accent text-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-border active:scale-[0.98]"
          >
            <X size={14} weight="bold" />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#10b981';
  if (confidence >= 0.6) return '#f59e0b';
  return '#ef4444';
}
