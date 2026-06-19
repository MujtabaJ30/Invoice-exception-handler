import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { LocalDatabase } from './local';
import type { Invoice, Exception } from '../../types/index.ts';

const COMPANY_ID = 'test_co';
const DATA_FILE = join(process.cwd(), '.local-data', 'db.json');

function makeInvoice(id: string, vendorName = 'Acme'): Invoice {
  return {
    id,
    invoiceNumber: `INV-${id}`,
    vendorId: 'v1',
    vendorName,
    invoiceDate: '2026-06-15',
    dueDate: '2026-07-15',
    poNumber: null,
    subtotal: 100,
    taxTotal: 10,
    total: 110,
    lineItems: [],
    status: 'exception',
  };
}

function makeException(invoiceId: string): Exception {
  return {
    id: `exc_${invoiceId}`,
    invoiceId,
    type: 'missing_po',
    severity: 'high',
    message: 'Missing PO',
    details: { vendorName: 'Acme' },
    detectedAt: new Date().toISOString(),
  };
}

describe('LocalDatabase', () => {
  let db: LocalDatabase;

  beforeEach(() => {
    if (existsSync(DATA_FILE)) {
      rmSync(DATA_FILE);
    }
    db = new LocalDatabase();
  });

  it('creates and finds a rule', async () => {
    await db.createOrUpdateRule({
      companyId: COMPANY_ID,
      exceptionType: 'missing_po',
      pattern: 'missing_po:{"vendorName":"Acme"}',
      resolution: 'Add PO from requisition',
      confidence: 0.9,
    });

    const found = await db.findRule(COMPANY_ID, 'missing_po', 'missing_po:{"vendorName":"Acme"}');
    expect(found).not.toBeNull();
    expect(found?.resolution).toBe('Add PO from requisition');
  });

  it('creates invoices and reviews', async () => {
    const invoice = makeInvoice('inv_1');
    const exception = makeException('inv_1');

    await db.createInvoice({ companyId: COMPANY_ID, payload: invoice, exceptions: [exception] });
    const invoices = await db.getInvoices(COMPANY_ID);
    expect(invoices).toHaveLength(1);

    await db.createReview({
      companyId: COMPANY_ID,
      exceptionId: exception.id,
      invoiceId: invoice.id,
      proposalId: 'prop_1',
      status: 'approved',
      decision: null,
      correctedBy: null,
      notes: null,
    });

    const reviews = await db.getReviews(COMPANY_ID);
    expect(reviews).toHaveLength(1);
  });
});
