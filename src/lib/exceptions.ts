/**
 * Exception Detection Engine
 * Deterministic rules for detecting invoice exceptions
 * No LLM calls — pure logic for speed and reliability
 */

import type { Invoice, Exception, ExceptionType, ExceptionSeverity } from '../types/index.ts';

/** Configuration for exception detection thresholds */
const THRESHOLDS = {
  /** Amount mismatch tolerance (in dollars) */
  AMOUNT_TOLERANCE: 0.01,
  /** Tax rate tolerance (percentage points) */
  TAX_RATE_TOLERANCE: 0.001,
  /** Future date tolerance (days) */
  FUTURE_DATE_TOLERANCE: 0,
  /** Minimum invoice number length */
  MIN_INVOICE_NUMBER_LENGTH: 3,
} as const;

/** Known vendor IDs (simulating master vendor list) */
const KNOWN_VENDOR_IDS = new Set(['v1', 'v2', 'v3', 'v4', 'v5']);

/** Exception detection result */
interface DetectionResult {
  readonly type: ExceptionType;
  readonly severity: ExceptionSeverity;
  readonly message: string;
  readonly details: Record<string, unknown>;
}

/** Check if invoice has a missing PO number */
function detectMissingPO(invoice: Invoice): DetectionResult | null {
  if (!invoice.poNumber || invoice.poNumber.trim() === '') {
    return {
      type: 'missing_po',
      severity: 'high',
      message: 'Purchase order number is missing',
      details: {
        vendorName: invoice.vendorName,
        invoiceNumber: invoice.invoiceNumber,
      },
    };
  }
  return null;
}

/** Check if invoice is a duplicate (by invoice number) */
function detectDuplicate(
  invoice: Invoice,
  existingInvoices: readonly Invoice[]
): DetectionResult | null {
  const duplicate = existingInvoices.find(
    (inv) => inv.id !== invoice.id && inv.invoiceNumber === invoice.invoiceNumber
  );

  if (duplicate) {
    return {
      type: 'duplicate_invoice',
      severity: 'critical',
      message: `Duplicate invoice number detected: ${invoice.invoiceNumber}`,
      details: {
        originalInvoiceId: duplicate.id,
        duplicateInvoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        originalVendor: duplicate.vendorName,
        duplicateVendor: invoice.vendorName,
      },
    };
  }
  return null;
}

/** Check if invoice total matches subtotal + tax */
function detectAmountMismatch(invoice: Invoice): DetectionResult | null {
  const expectedTotal = Math.round((invoice.subtotal + invoice.taxTotal) * 100) / 100;
  const actualTotal = Math.round(invoice.total * 100) / 100;
  const difference = Math.abs(expectedTotal - actualTotal);

  if (difference > THRESHOLDS.AMOUNT_TOLERANCE) {
    return {
      type: 'amount_mismatch',
      severity: 'high',
      message: 'Invoice total does not match subtotal + tax',
      details: {
        expected: expectedTotal,
        actual: actualTotal,
        difference: Math.round(difference * 100) / 100,
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
      },
    };
  }
  return null;
}

/** Check if tax calculation is correct */
function detectTaxError(invoice: Invoice): DetectionResult | null {
  const expectedTax = invoice.lineItems.reduce(
    (sum, item) => sum + item.amount * item.taxRate,
    0
  );
  const roundedExpected = Math.round(expectedTax * 100) / 100;
  const actualTax = Math.round(invoice.taxTotal * 100) / 100;
  const difference = Math.abs(roundedExpected - actualTax);

  if (difference > THRESHOLDS.AMOUNT_TOLERANCE) {
    return {
      type: 'tax_calculation_error',
      severity: 'medium',
      message: 'Tax calculation does not match expected rate',
      details: {
        expectedTax: roundedExpected,
        actualTax,
        difference: Math.round(difference * 100) / 100,
        lineItems: invoice.lineItems.map((item) => ({
          description: item.description,
          amount: item.amount,
          taxRate: item.taxRate,
          expectedTax: Math.round(item.amount * item.taxRate * 100) / 100,
        })),
      },
    };
  }
  return null;
}

/** Check if vendor exists in master list */
function detectUnknownVendor(invoice: Invoice): DetectionResult | null {
  if (!KNOWN_VENDOR_IDS.has(invoice.vendorId)) {
    return {
      type: 'vendor_not_found',
      severity: 'medium',
      message: 'Vendor not found in master vendor list',
      details: {
        vendorName: invoice.vendorName,
        vendorId: invoice.vendorId,
        knownVendors: Array.from(KNOWN_VENDOR_IDS),
      },
    };
  }
  return null;
}

/** Check if invoice date is in the future */
function detectFutureDate(invoice: Invoice): DetectionResult | null {
  const invoiceDate = new Date(invoice.invoiceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (invoiceDate > today) {
    return {
      type: 'date_in_future',
      severity: 'low',
      message: 'Invoice date is in the future',
      details: {
        invoiceDate: invoice.invoiceDate,
        today: today.toISOString().split('T')[0],
      },
    };
  }
  return null;
}

/** Check if invoice has negative amounts */
function detectNegativeAmount(invoice: Invoice): DetectionResult | null {
  if (invoice.total < 0 || invoice.subtotal < 0) {
    return {
      type: 'negative_amount',
      severity: 'high',
      message: 'Invoice has negative amounts',
      details: {
        total: invoice.total,
        subtotal: invoice.subtotal,
      },
    };
  }
  return null;
}

/** Run all exception detection rules on an invoice */
export function detectExceptions(
  invoice: Invoice,
  existingInvoices: readonly Invoice[] = []
): Exception[] {
  const detectors = [
    detectMissingPO,
    (inv: Invoice) => detectDuplicate(inv, existingInvoices),
    detectAmountMismatch,
    detectTaxError,
    detectUnknownVendor,
    detectFutureDate,
    detectNegativeAmount,
  ];

  const exceptions: Exception[] = [];
  const now = new Date().toISOString();

  for (const detector of detectors) {
    const result = detector(invoice);
    if (result) {
      exceptions.push({
        id: `exc_${Math.random().toString(36).substring(2, 11)}`,
        invoiceId: invoice.id,
        type: result.type,
        severity: result.severity,
        message: result.message,
        details: result.details,
        detectedAt: now,
      });
    }
  }

  return exceptions;
}

/** Get human-readable label for exception type */
export function getExceptionTypeLabel(type: ExceptionType): string {
  const labels: Record<ExceptionType, string> = {
    missing_po: 'Missing PO Number',
    duplicate_invoice: 'Duplicate Invoice',
    amount_mismatch: 'Amount Mismatch',
    tax_calculation_error: 'Tax Calculation Error',
    vendor_not_found: 'Unknown Vendor',
    date_in_future: 'Future Date',
    negative_amount: 'Negative Amount',
  };
  return labels[type];
}

/** Get severity color for UI */
export function getSeverityColor(severity: ExceptionSeverity): string {
  const colors: Record<ExceptionSeverity, string> = {
    low: '#3b82f6',      // blue
    medium: '#f59e0b',   // amber
    high: '#ef4444',     // red
    critical: '#dc2626', // dark red
  };
  return colors[severity];
}

/** Get severity icon name */
export function getSeverityIcon(severity: ExceptionSeverity): string {
  const icons: Record<ExceptionSeverity, string> = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'critical-error',
  };
  return icons[severity];
}

/** Build a deterministic pattern string for an exception to use for learned rule matching */
export function generateExceptionPattern(
  exceptionType: ExceptionType,
  details: Record<string, unknown>
): string {
  const relevantKeys = getExceptionRelevantKeys(exceptionType);
  const relevantDetails: Record<string, unknown> = {};

  for (const key of relevantKeys) {
    if (key in details) {
      relevantDetails[key] = details[key];
    }
  }

  return `${exceptionType}:${JSON.stringify(relevantDetails)}`;
}

function getExceptionRelevantKeys(exceptionType: ExceptionType): string[] {
  switch (exceptionType) {
    case 'missing_po':
      return ['vendorName'];
    case 'duplicate_invoice':
      return ['invoiceNumber'];
    case 'amount_mismatch':
      return ['difference'];
    case 'tax_calculation_error':
      return ['difference'];
    case 'vendor_not_found':
      return ['vendorName'];
    default:
      return [];
  }
}
