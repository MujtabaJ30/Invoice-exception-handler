import type { Review, Exception } from '../types';
import { getExceptionTypeLabel, getSeverityColor } from '../lib/exceptions';

interface ReviewSummaryProps {
  readonly reviews: Review[];
  readonly exceptions: Exception[];
}

export default function ReviewSummary({
  reviews,
  exceptions,
}: ReviewSummaryProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-16 text-center">
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="text-muted-foreground text-sm mt-1">
          Review exceptions to see them here
        </p>
      </div>
    );
  }

  const reviewsWithExceptions = reviews.map((review) => {
    const exception = exceptions.find((e) => e.id === review.exceptionId);
    return { review, exception };
  });

  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;
  const correctedCount = reviews.filter((r) => r.status === 'corrected').length;
  const learnedCount = approvedCount + correctedCount;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Approved" value={approvedCount} color="success" icon={'\u2713'} />
        <StatCard label="Rejected" value={rejectedCount} color="danger" icon={'\u2717'} />
        <StatCard label="Corrected" value={correctedCount} color="warning" icon={'\u270E'} />
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 bg-primary/10 text-primary">
              {'\uD83E\uDDE0'}
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{learnedCount}</p>
              <p className="text-xs text-muted-foreground">Rules learned</p>
            </div>
          </div>
        </div>
      </div>

      {learnedCount > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-primary font-medium">{learnedCount} rule{learnedCount !== 1 ? 's' : ''}</span> saved from your decisions.
            Next time a similar exception appears, the system will apply the learned fix automatically.
            Rules persist across page refreshes.
          </p>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Review History</h2>
        </div>
        <div className="divide-y divide-border">
          {reviewsWithExceptions.map(({ review, exception }) => (
            <div key={review.id} className="px-6 py-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {exception ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: getSeverityColor(exception.severity),
                          }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {getExceptionTypeLabel(exception.type)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {exception.message}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Exception details unavailable
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2">
                    {(review.status === 'approved' || review.status === 'corrected') && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        Learned
                      </span>
                    )}
                    <StatusBadge status={review.status} />
                  </div>
                  {review.decision ? (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                      {review.decision.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  readonly label: string;
  readonly value: number;
  readonly color: 'success' | 'danger' | 'warning';
  readonly icon: string;
}) {
  const styles: Record<string, { bg: string; text: string }> = {
    success: { bg: 'bg-success/10', text: 'text-success' },
    danger: { bg: 'bg-danger/10', text: 'text-danger' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
  };

  const { bg, text } = styles[color];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${bg} ${text}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { readonly status: Review['status'] }) {
  const classes: Record<Review['status'], string> = {
    approved: 'bg-success/10 text-success',
    rejected: 'bg-danger/10 text-danger',
    corrected: 'bg-warning/10 text-warning',
    pending: 'bg-muted text-muted-foreground',
  };

  const labels: Record<Review['status'], string> = {
    approved: 'Approved',
    rejected: 'Rejected',
    corrected: 'Corrected',
    pending: 'Pending',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
