import type { FixProposal } from '../types';

interface FixProposalCardProps {
  readonly proposal: FixProposal;
  readonly onApprove: () => void;
  readonly onReject: () => void;
}

export default function FixProposalCard({
  proposal,
  onApprove,
  onReject,
}: FixProposalCardProps) {
  const confidencePercent = Math.round(proposal.confidence * 100);
  const confidenceColor = getConfidenceColor(proposal.confidence);
  const isLearned = proposal.id.startsWith('learned_');

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-slide-up">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLearned ? (
              <span className="px-2 py-0.5 bg-success/10 text-success text-[11px] font-medium rounded border border-success/20">
                Learned
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {proposal.action.type === 'escalate' ? 'Escalation' : 'Resolution'}
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              backgroundColor: confidenceColor + '1A',
              color: confidenceColor,
            }}
          >
            {confidencePercent}
          </div>
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-3">
          {proposal.description}
        </p>

        <div className="bg-surface rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Reasoning:</span>{' '}
            {proposal.reasoning}
          </p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span
              className="text-xs font-semibold"
              style={{ color: confidenceColor }}
            >
              {confidencePercent}%
            </span>
          </div>
          <div className="w-full bg-surface rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${confidencePercent}%`,
                backgroundColor: confidenceColor,
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 bg-success/10 hover:bg-success/20 text-success font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-success/20"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-danger/20"
          >
            Reject
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
