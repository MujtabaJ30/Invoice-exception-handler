import type { Invoice, Exception } from '../types';
import { getExceptionTypeLabel, getSeverityColor } from '../lib/exceptions';

interface InvoiceDetailProps {
  readonly invoice: Invoice;
  readonly exceptions: Exception[];
  readonly reviewedExceptionIds: ReadonlySet<string>;
}

export default function InvoiceDetail({
  invoice,
  exceptions,
  reviewedExceptionIds,
}: InvoiceDetailProps) {
  const hasExceptions = exceptions.length > 0;

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-mono font-semibold text-foreground truncate">
              {invoice.invoiceNumber}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {invoice.vendorName}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono text-foreground">
              ${invoice.total.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {invoice.invoiceDate} &rarr; {invoice.dueDate}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-border">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            PO Number
          </p>
          <p className="text-sm text-foreground mt-1 font-mono">
            {invoice.poNumber ?? (
              <span className="text-danger italic">Missing</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Status
          </p>
          <p className="text-sm text-foreground mt-1 capitalize">
            {invoice.status}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Subtotal
          </p>
          <p className="text-sm text-foreground mt-1 font-mono">
            ${invoice.subtotal.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Tax
          </p>
          <p className="text-sm text-foreground mt-1 font-mono">
            ${invoice.taxTotal.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Line Items
        </h3>
        <div className="space-y-2">
          {invoice.lineItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2.5 px-3 bg-surface rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.quantity} &times; ${item.unitPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-sm font-mono text-foreground">
                  ${item.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tax: ${item.taxAmount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasExceptions && (
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Detected Exceptions
          </h3>
          <div className="space-y-2">
            {exceptions.map((exception) => {
              const isResolved = reviewedExceptionIds.has(exception.id);
              return (
                <div
                  key={exception.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
                  style={{
                    backgroundColor: isResolved ? '#10b98114' : getSeverityColor(exception.severity) + '14',
                    borderLeft: `3px solid ${isResolved ? '#10b981' : getSeverityColor(exception.severity)}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground font-medium">
                        {getExceptionTypeLabel(exception.type)}
                      </p>
                      {isResolved && (
                        <span className="text-success text-xs">{'\u2713'}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {exception.message}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-medium capitalize shrink-0"
                    style={{
                      backgroundColor: isResolved ? '#10b9811A' : getSeverityColor(exception.severity) + '1A',
                      color: isResolved ? '#10b981' : getSeverityColor(exception.severity),
                    }}
                  >
                    {isResolved ? 'resolved' : exception.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
