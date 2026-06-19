/**
 * Mock Invoice Data Generator
 * Generates realistic invoices with various exceptions for demo purposes
 */

import type { Invoice, InvoiceLineItem, Vendor, Exception } from '../types/index.ts';
import { detectExceptions } from './exceptions';

/** Seed data for realistic vendor names */
const VENDORS: readonly Vendor[] = [
  { id: 'v1', name: 'Acme Corp', email: 'billing@acme.com', defaultPaymentTerms: 30 },
  { id: 'v2', name: 'TechFlow Solutions', email: 'ap@techflow.io', defaultPaymentTerms: 45 },
  { id: 'v3', name: 'Global Supplies Inc', email: 'invoices@globalsupplies.com', defaultPaymentTerms: 30 },
  { id: 'v4', name: 'DataSync Partners', email: 'finance@datasync.co', defaultPaymentTerms: 60 },
  { id: 'v5', name: 'CloudNine Services', email: 'billing@cloudnine.dev', defaultPaymentTerms: 30 },
] as const;

/** Seed data for realistic line item descriptions */
const LINE_ITEM_DESCRIPTIONS: readonly string[] = [
  'Software License - Annual',
  'Cloud Hosting - Monthly',
  'Consulting Services - Q1',
  'API Access - Enterprise Tier',
  'Support Package - Premium',
  'Hardware - Server Rack',
  'Training - On-site',
  'Integration Services',
  'Data Migration',
  'Custom Development',
] as const;

/** Generate a random ID */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/** Generate a random date within a range */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/** Format date to ISO string */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Generate a random number within a range */
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate a random amount with cents */
function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/** Generate a single line item */
function generateLineItem(): InvoiceLineItem {
  const description = LINE_ITEM_DESCRIPTIONS[randomNumber(0, LINE_ITEM_DESCRIPTIONS.length - 1)];
  const quantity = randomNumber(1, 10);
  const unitPrice = randomAmount(100, 5000);
  const amount = Math.round(quantity * unitPrice * 100) / 100;
  const taxRate = randomNumber(0, 1) ? 0.1 : 0.08; // 10% or 8% tax
  const taxAmount = Math.round(amount * taxRate * 100) / 100;

  return {
    id: generateId(),
    description,
    quantity,
    unitPrice,
    amount,
    taxRate,
    taxAmount,
  };
}

/** Generate a clean invoice (no exceptions) */
function generateCleanInvoice(): Invoice {
  const vendor = VENDORS[randomNumber(0, VENDORS.length - 1)];
  const invoiceDate = randomDate(new Date('2024-01-01'), new Date('2024-06-30'));
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + vendor.defaultPaymentTerms);

  const lineItems = Array.from({ length: randomNumber(1, 4) }, () => generateLineItem());
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = Math.round((subtotal + taxTotal) * 100) / 100;

  return {
    id: generateId(),
    invoiceNumber: `INV-${randomNumber(1000, 9999)}`,
    vendorId: vendor.id,
    vendorName: vendor.name,
    invoiceDate: formatDate(invoiceDate),
    dueDate: formatDate(dueDate),
    poNumber: `PO-${randomNumber(1000, 9999)}`,
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    total,
    lineItems,
    status: 'pending',
  };
}

/** Generate an invoice with a missing PO number */
function generateMissingPOInvoice(): Invoice {
  const invoice = generateCleanInvoice();
  return { ...invoice, poNumber: null };
}

/** Generate a duplicate invoice (same invoice number as another) */
function generateDuplicateInvoice(originalInvoice: Invoice): Invoice {
  const invoice = generateCleanInvoice();
  return { ...invoice, invoiceNumber: originalInvoice.invoiceNumber };
}

/** Generate an invoice with amount mismatch */
function generateAmountMismatchInvoice(): Invoice {
  const invoice = generateCleanInvoice();
  // Deliberately set total to not match subtotal + tax
  const wrongTotal = invoice.subtotal + invoice.taxTotal + randomNumber(100, 500);
  return { ...invoice, total: Math.round(wrongTotal * 100) / 100 };
}

/** Generate an invoice with tax calculation error */
function generateTaxErrorInvoice(): Invoice {
  const invoice = generateCleanInvoice();
  // Deliberately set tax to wrong amount
  const wrongTax = invoice.taxTotal * randomNumber(2, 3);
  return { ...invoice, taxTotal: Math.round(wrongTax * 100) / 100 };
}

/** Generate an invoice with vendor not in master list */
function generateUnknownVendorInvoice(): Invoice {
  const invoice = generateCleanInvoice();
  return {
    ...invoice,
    vendorId: 'v_unknown',
    vendorName: 'Unknown Vendor LLC',
  };
}

/** Generate a set of demo invoices with various exceptions */
export function generateDemoInvoices(): {
  invoices: Invoice[];
  exceptions: Exception[];
} {
  const cleanInvoice = generateCleanInvoice();
  const missingPOInvoice = generateMissingPOInvoice();
  const duplicateInvoice = generateDuplicateInvoice(cleanInvoice);
  const amountMismatchInvoice = generateAmountMismatchInvoice();
  const taxErrorInvoice = generateTaxErrorInvoice();
  const unknownVendorInvoice = generateUnknownVendorInvoice();

  const invoices = [
    cleanInvoice,
    missingPOInvoice,
    duplicateInvoice,
    amountMismatchInvoice,
    taxErrorInvoice,
    unknownVendorInvoice,
  ];

  const exceptions = invoices.flatMap((invoice) =>
    detectExceptions(invoice, invoices)
  );

  return { invoices, exceptions };
}

/** Get a vendor by ID */
export function getVendorById(vendorId: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === vendorId);
}

/** Get all vendors */
export function getAllVendors(): readonly Vendor[] {
  return VENDORS;
}
