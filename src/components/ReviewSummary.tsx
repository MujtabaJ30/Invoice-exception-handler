import { useState } from 'react';
import { Check, X, PencilSimple, Brain, Clock, CaretDown, CaretRight } from '@phosphor-icons/react';
import type { Review, Exception, Invoice } from '../types/index.ts';
import { getExceptionTypeLabel } from '../lib/exceptions.ts';
import SeverityIcon from './SeverityIcon.tsx';

interface ReviewSummaryProps {
  readonly reviews: Review[];
  readonly exceptions: Exception[];
  readonly invoices: Invoice[];
}

type FilterKey = 'all' | 'approved' | 'rejected' | 'corrected';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'corrected', label: 'Corrected' },
  { key: 'rejected', label: 'Skipped' },
];

export default function ReviewSummary({ reviews, exceptions, invoices }: ReviewSummaryProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reviewsWithContext = reviews
    .map((review) => {
      const exception = exceptions.find((e) => e.id === review.exceptionId);
      const invoice = exception ? invoices.find((i) => i.id === exception.invoiceId) : undefined;
      return { review, exception, invoice };
    })
    .sort((a, b) => b.review.reviewedAt.localeCompare(a.review.reviewedAt));

  const filtered = filter === 'all'
    ? reviewsWithContext
    : reviewsWithContext.filter((r) => r.review.status === filter);

  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;
  const correctedCount = reviews.filter((r) => r.status === 'corrected').length;
  const learnedCount = approvedCount + correctedCount;

  if (reviews.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-16 text-center shadow-sm">
        <Brain size={40} className="text-muted-foreground mx-auto mb-4" weight="duotone" />
        <p className="text-sm font-medium text-foreground">No decisions yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Approve, skip, or correct a fix and it will show up here. Your decisions train the engine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Approved" value={approvedCount} color="success" icon={Check} />
        <StatCard label="Corrected" value={correctedCount} color="warning" icon={PencilSimple} />
        <StatCard label="Skipped" value={rejectedCount} color="danger" icon={X} />
        <StatCard label="Rules learned" value={learnedCount} color="primary" icon={Brain} />
      </div>

      {learnedCount > 0 && (
        <div className="bg-success/5 border border-success/10 rounded-xl p-4 flex items-start gap-3">
          <Brain size={20} className="text-success shrink-0 mt-0.5" weight="fill" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{learnedCount} rule{learnedCount !== 1 ? 's' : ''}</span>{' '}
            saved from your decisions. Similar exceptions will now resolve automatically.
          </p>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">Decision history</h2>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No matching decisions</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(({ review, exception, invoice }) => (
              <div key={review.id}>
                <button
                  onClick={() => toggleExpand(review.id)}
                  className="w-full text-left px-6 py-4 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      {expandedIds.has(review.id) ? (
                        <CaretDown size={12} className="text-muted-foreground" />
                      ) : (
                        <CaretRight size={12} className="text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {exception ? (
                        <div className="flex items-center gap-2">
                          <SeverityIcon severity={exception.severity} size={16} />
                          <span className="text-sm font-medium text-foreground">
                            {getExceptionTypeLabel(exception.type)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Exception unavailable</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {invoice ? `${invoice.invoiceNumber} · ${invoice.vendorName}` : '—'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        {(review.status === 'approved' || review.status === 'corrected') && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">
                            Learned
                          </span>
                        )}
                        <StatusBadge status={review.status} />
                      </div>
                      {review.decision && !expandedIds.has(review.id) ? (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                          {review.decision.description}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                        <Clock size={10} />
                        <span className="tabular-nums">
                          {new Date(review.reviewedAt).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </button>

                {expandedIds.has(review.id) && (
                  <div className="px-6 pb-4 border-t border-border/50 animate-slide-up">
                    <div className="pt-4 space-y-3">
                      {invoice && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <DetailItem label="Invoice #" value={invoice.invoiceNumber} />
                          <DetailItem label="Vendor" value={invoice.vendorName} />
                          <DetailItem label="PO" value={invoice.poNumber || 'N/A'} />
                          <DetailItem
                            label="Amount"
                            value={`$${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          />
                        </div>
                      )}

                      {review.decision && (
                        <div className="space-y-2">
                          <DetailItem label="Resolution" value={review.decision.description} />
                          <DetailItem label="Reasoning" value={review.decision.reasoning} />
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">
                              Confidence:{' '}
                              <span className="font-mono text-foreground font-medium">
                                {Math.round(review.decision.confidence * 100)}%
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Action:{' '}
                              <span className="font-medium text-foreground capitalize">
                                {review.decision.action.type}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}

                      {review.correctedBy && (
                        <DetailItem label="Corrected by" value={review.correctedBy} />
                      )}
                      {review.notes && (
                        <DetailItem label="Notes" value={review.notes} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  readonly label: string;
  readonly value: number;
  readonly color: 'success' | 'danger' | 'warning' | 'primary';
  readonly icon: React.ElementType;
}) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
    danger: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' },
    warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  };

  const { bg, text, border } = styles[color];

  return (
    <div className={`bg-card rounded-xl border ${border} p-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${text}`}>
          <Icon size={20} weight="fill" />
        </div>
        <div>
          <p className="text-2xl font-bold font-mono text-foreground tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { readonly status: Review['status'] }) {
  const classes: Record<Review['status'], string> = {
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-danger/10 text-danger border-danger/20',
    corrected: 'bg-warning/10 text-warning border-warning/20',
    pending: 'bg-muted text-muted-foreground border-border',
  };

  const labels: Record<Review['status'], string> = {
    approved: 'Approved',
    rejected: 'Skipped',
    corrected: 'Corrected',
    pending: 'Pending',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
