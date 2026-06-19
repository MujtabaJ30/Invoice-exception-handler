import type { Invoice, Exception } from '../types';
import { getSeverityColor } from '../lib/exceptions';

interface InvoiceListProps {
  readonly invoices: Invoice[];
  readonly exceptions: Exception[];
  readonly currentInvoice: Invoice | null;
  readonly onSelectInvoice: (invoice: Invoice) => void;
}

const SEVERITY_PRIORITY: Record<Exception['severity'], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export default function InvoiceList({
  invoices,
  exceptions,
  currentInvoice,
  onSelectInvoice,
}: InvoiceListProps) {
  const exceptionCounts = new Map<string, number>();
  const maxSeverityMap = new Map<string, Exception['severity']>();

  for (const exception of exceptions) {
    exceptionCounts.set(
      exception.invoiceId,
      (exceptionCounts.get(exception.invoiceId) || 0) + 1
    );

    const currentMax = maxSeverityMap.get(exception.invoiceId);
    if (
      !currentMax ||
      SEVERITY_PRIORITY[exception.severity] > SEVERITY_PRIORITY[currentMax]
    ) {
      maxSeverityMap.set(exception.invoiceId, exception.severity);
    }
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Invoices</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {invoices.length} total &middot; {exceptionCounts.size} with exceptions
        </p>
      </div>
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {invoices.map((invoice) => {
          const exceptionCount = exceptionCounts.get(invoice.id) || 0;
          const maxSeverity = maxSeverityMap.get(invoice.id);
          const isActive = currentInvoice?.id === invoice.id;

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
                    {exceptionCount > 0 && maxSeverity ? (
                      <span
                        className="px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: getSeverityColor(maxSeverity) + '1A',
                          color: getSeverityColor(maxSeverity),
                        }}
                      >
                        {exceptionCount} {exceptionCount === 1 ? 'issue' : 'issues'}
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">
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
