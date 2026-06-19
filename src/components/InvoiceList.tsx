import type { Invoice, Exception } from '../types/index.ts';
import { getSeverityColor } from '../lib/exceptions.ts';

interface InvoiceListProps {
  readonly invoices: Invoice[];
  readonly exceptions: Exception[];
  readonly reviewedExceptionIds: Set<string>;
  readonly currentInvoice: Invoice | null;
  readonly onSelectInvoice: (invoice: Invoice) => void;
}

const SEVERITY_PRIORITY: Record<Exception['severity'], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

interface InvoiceQueueItem {
  invoice: Invoice;
  pendingExceptions: Exception[];
  maxPendingSeverity: Exception['severity'] | null;
}

export default function InvoiceList({
  invoices,
  exceptions,
  reviewedExceptionIds,
  currentInvoice,
  onSelectInvoice,
}: InvoiceListProps) {
  const invoiceMap = new Map<string, InvoiceQueueItem>();

  for (const invoice of invoices) {
    invoiceMap.set(invoice.id, {
      invoice,
      pendingExceptions: [],
      maxPendingSeverity: null,
    });
  }

  for (const exception of exceptions) {
    if (reviewedExceptionIds.has(exception.id)) continue;

    const item = invoiceMap.get(exception.invoiceId);
    if (!item) continue;

    item.pendingExceptions.push(exception);
    const currentMax = item.maxPendingSeverity;
    if (
      !currentMax ||
      SEVERITY_PRIORITY[exception.severity] > SEVERITY_PRIORITY[currentMax]
    ) {
      item.maxPendingSeverity = exception.severity;
    }
  }

  const queueItems = Array.from(invoiceMap.values()).sort((a, b) => {
    const aPending = a.pendingExceptions.length;
    const bPending = b.pendingExceptions.length;
    if (aPending === 0 && bPending > 0) return 1;
    if (aPending > 0 && bPending === 0) return -1;

    const aPriority = a.maxPendingSeverity ? SEVERITY_PRIORITY[a.maxPendingSeverity] : 0;
    const bPriority = b.maxPendingSeverity ? SEVERITY_PRIORITY[b.maxPendingSeverity] : 0;
    return bPriority - aPriority;
  });

  const pendingCount = queueItems.filter((i) => i.pendingExceptions.length > 0).length;

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Queue</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {invoices.length} total &middot; {pendingCount} to review
        </p>
      </div>
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {queueItems.map(({ invoice, pendingExceptions, maxPendingSeverity }) => {
          const pendingCountForInvoice = pendingExceptions.length;
          const isActive = currentInvoice?.id === invoice.id;
          const isResolved = pendingCountForInvoice === 0;

          return (
            <button
              key={invoice.id}
              onClick={() => onSelectInvoice(invoice)}
              className={`w-full text-left px-4 py-3 transition-colors duration-150 ${
                isActive
                  ? 'bg-primary/10 border-l-[3px] border-l-primary'
                  : 'border-l-[3px] border-l-transparent hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-foreground text-sm truncate">
                      {invoice.invoiceNumber}
                    </span>
                    {isResolved ? (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap bg-success/15 text-success border border-success/20">
                        Resolved
                      </span>
                    ) : maxPendingSeverity ? (
                      <span
                        className="px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: getSeverityColor(maxPendingSeverity) + '1A',
                          color: getSeverityColor(maxPendingSeverity),
                        }}
                      >
                        {pendingCountForInvoice} {pendingCountForInvoice === 1 ? 'issue' : 'issues'}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {invoice.vendorName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-medium text-foreground">
                    ${invoice.total.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                    {invoice.invoiceDate}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
