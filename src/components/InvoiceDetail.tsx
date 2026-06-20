import { Check, Calendar, Receipt, FileText } from '@phosphor-icons/react';
import type { Invoice, Exception } from '../types/index.ts';
import { getExceptionTypeLabel, getSeverityColor } from '../lib/exceptions.ts';
import SeverityIcon from './SeverityIcon.tsx';

interface InvoiceDetailProps {
  readonly invoice: Invoice;
  readonly exceptions: Exception[];
  readonly reviewedExceptionIds: ReadonlySet<string>;
  readonly currentException: Exception | null;
  readonly onSelectException: (exception: Exception) => void;
}

export default function InvoiceDetail({
  invoice,
  exceptions,
  reviewedExceptionIds,
  currentException,
  onSelectException,
}: InvoiceDetailProps) {
  const pendingExceptions = exceptions.filter((e) => !reviewedExceptionIds.has(e.id));
  const hasExceptions = exceptions.length > 0;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-muted-foreground shrink-0" weight="regular" />
              <h2 className="font-mono font-semibold text-foreground text-lg truncate">
                {invoice.invoiceNumber}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{invoice.vendorName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">
              ${invoice.total.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
              <Calendar size={12} />
              <span className="tabular-nums">Due {invoice.dueDate}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border bg-surface/50">
        <Metadata label="Invoice date" value={invoice.invoiceDate} mono />
        <Metadata label="PO number" value={invoice.poNumber ?? 'Missing'} mono highlight={!invoice.poNumber} />
        <Metadata label="Subtotal" value={`$${invoice.subtotal.toFixed(2)}`} mono />
        <Metadata label="Tax" value={`$${invoice.taxTotal.toFixed(2)}`} mono />
      </div>

      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <FileText size={13} />
          Line items
        </h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/80 text-xs text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-2">Description</th>
                <th className="text-right font-medium px-4 py-2">Qty</th>
                <th className="text-right font-medium px-4 py-2">Unit</th>
                <th className="text-right font-medium px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="bg-card">
                  <td className="px-4 py-2.5 text-foreground">{item.description}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasExceptions ? (
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Detected exceptions ({pendingExceptions.length} pending)
          </h3>
          <div className="space-y-2">
            {exceptions.map((exception) => {
              const isResolved = reviewedExceptionIds.has(exception.id);
              const severityColor = getSeverityColor(exception.severity);
              return (
                <button
                  key={exception.id}
                  onClick={() => onSelectException(exception)}
                  className={`w-full text-left flex items-center gap-3 py-3 px-4 rounded-lg border transition-colors ${
                    currentException?.id === exception.id
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card border-border hover:bg-accent/50'
                  }`}
                  style={{ borderLeftWidth: '4px', borderLeftColor: isResolved ? '#10b981' : severityColor }}
                >
                  {isResolved ? (
                    <Check size={18} weight="bold" className="text-success shrink-0" />
                  ) : (
                    <SeverityIcon severity={exception.severity} size={18} className="shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {getExceptionTypeLabel(exception.type)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{exception.message}</p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium capitalize shrink-0"
                    style={{
                      backgroundColor: isResolved ? '#10b9811A' : severityColor + '1A',
                      color: isResolved ? '#10b981' : severityColor,
                    }}
                  >
                    {isResolved ? 'resolved' : exception.severity}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-6 py-8 text-center">
          <Check size={24} className="text-success mx-auto mb-2" weight="bold" />
          <p className="text-sm text-foreground font-medium">No open exceptions on this invoice.</p>
        </div>
      )}
    </div>
  );
}

function Metadata({
  label,
  value,
  mono,
  highlight,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
  readonly highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p
        className={`text-sm mt-1 ${mono ? 'font-mono tabular-nums' : ''} ${
          highlight ? 'text-danger italic' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
