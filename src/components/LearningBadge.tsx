import type { ExceptionType } from '../types';
import { getExceptionTypeLabel } from '../lib/exceptions';

interface LearningBadgeProps {
  readonly exceptionType: ExceptionType;
}

export default function LearningBadge({ exceptionType }: LearningBadgeProps) {
  const label = getExceptionTypeLabel(exceptionType);

  return (
    <div className="bg-success/10 border border-success/20 rounded-xl p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
          <span className="text-success text-base" aria-hidden="true">{'\uD83E\uDDE0'}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-success">
            Learned Rule Available
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            The system has seen a similar{' '}
            <strong className="text-foreground">{label}</strong> exception
            before and learned how to resolve it. Click{' '}
            <strong className="text-foreground">Generate Fix Proposals</strong>{' '}
            to apply the learned resolution.
          </p>
        </div>
      </div>
    </div>
  );
}
