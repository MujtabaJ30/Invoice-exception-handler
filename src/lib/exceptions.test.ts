import { describe, it, expect } from 'vitest';
import { detectExceptions } from './exceptions';
import type { Invoice } from '../types/index.ts';

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const base: Invoice = {
    id: 'inv_1',
    invoiceNumber: 'INV-001',
    vendorId: 'v1',
    vendorName: 'Acme Corp',
    invoiceDate: '2026-06-15',
    dueDate: '2026-07-15',
    poNumber: 'PO-123',
    subtotal: 100,
    taxTotal: 10,
    total: 110,
    lineItems: [
      {
        id: 'li_1',
        description: 'Widget',
        quantity: 1,
        unitPrice: 100,
        amount: 100,
        taxRate: 0.1,
        taxAmount: 10,
      },
    ],
    status: 'pending',
  };
  return { ...base, ...overrides };
}

describe('detectExceptions', () => {
  it('detects missing PO number', () => {
    const invoice = makeInvoice({ poNumber: '' });
    const exceptions = detectExceptions(invoice);
    expect(exceptions.some((e) => e.type === 'missing_po')).toBe(true);
  });

  it('detects duplicate invoice numbers', () => {
    const first = makeInvoice({ id: 'inv_1', invoiceNumber: 'INV-DUP' });
    const second = makeInvoice({ id: 'inv_2', invoiceNumber: 'INV-DUP' });
    const exceptions = detectExceptions(second, [first]);
    expect(exceptions.some((e) => e.type === 'duplicate_invoice')).toBe(true);
  });

  it('detects amount mismatch', () => {
    const invoice = makeInvoice({ total: 999 });
    const exceptions = detectExceptions(invoice);
    expect(exceptions.some((e) => e.type === 'amount_mismatch')).toBe(true);
  });

  it('detects tax calculation error', () => {
    const invoice = makeInvoice({ taxTotal: 99 });
    const exceptions = detectExceptions(invoice);
    expect(exceptions.some((e) => e.type === 'tax_calculation_error')).toBe(true);
  });

  it('detects unknown vendor', () => {
    const invoice = makeInvoice({ vendorId: 'unknown' });
    const exceptions = detectExceptions(invoice);
    expect(exceptions.some((e) => e.type === 'vendor_not_found')).toBe(true);
  });

  it('detects future invoice date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const invoice = makeInvoice({ invoiceDate: future.toISOString().split('T')[0] });
    const exceptions = detectExceptions(invoice);
    expect(exceptions.some((e) => e.type === 'date_in_future')).toBe(true);
  });

  it('detects negative amount', () => {
    const invoice = makeInvoice({ total: -50 });
    const exceptions = detectExceptions(invoice);
    expect(exceptions.some((e) => e.type === 'negative_amount')).toBe(true);
  });

  it('returns no exceptions for a clean invoice', () => {
    const invoice = makeInvoice();
    const exceptions = detectExceptions(invoice);
    expect(exceptions).toHaveLength(0);
  });
});
