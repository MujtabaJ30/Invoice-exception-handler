/**
 * Core types for Exception Engine
 * Defines the data models for invoices, exceptions, fixes, and learned rules
 */

/** Severity level for exceptions */
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Status of an exception review */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'corrected';

/** Type of exception detected */
export type ExceptionType =
  | 'missing_po'
  | 'duplicate_invoice'
  | 'amount_mismatch'
  | 'tax_calculation_error'
  | 'vendor_not_found'
  | 'date_in_future'
  | 'negative_amount';

/** An individual line item on an invoice */
export interface InvoiceLineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
  readonly taxRate: number;
  readonly taxAmount: number;
}

/** A vendor in the master list */
export interface Vendor {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly defaultPaymentTerms: number;
}

/** An invoice to be processed */
export interface Invoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly invoiceDate: string;
  readonly dueDate: string;
  readonly poNumber: string | null;
  readonly subtotal: number;
  readonly taxTotal: number;
  readonly total: number;
  readonly lineItems: readonly InvoiceLineItem[];
  readonly status: 'pending' | 'processing' | 'completed' | 'exception';
}

/** A detected exception on an invoice */
export interface Exception {
  readonly id: string;
  readonly invoiceId: string;
  readonly type: ExceptionType;
  readonly severity: ExceptionSeverity;
  readonly message: string;
  readonly details: Record<string, unknown>;
  readonly detectedAt: string;
}

/** A proposed fix for an exception */
export interface FixProposal {
  readonly id: string;
  readonly exceptionId: string;
  readonly description: string;
  readonly confidence: number;
  readonly action: FixAction;
  readonly reasoning: string;
}

/** The action to take for a fix */
export interface FixAction {
  readonly type: 'approve' | 'reject' | 'modify' | 'escalate';
  readonly data: Record<string, unknown>;
}

/** A review decision on a fix proposal */
export interface Review {
  readonly id: string;
  readonly exceptionId: string;
  readonly proposalId: string;
  readonly status: ReviewStatus;
  readonly decision: FixProposal | null;
  readonly correctedBy: string | null;
  readonly reviewedAt: string;
  readonly notes: string | null;
}

/** A learned rule from a review */
export interface LearnedRule {
  readonly id: string;
  readonly exceptionType: ExceptionType;
  readonly pattern: string;
  readonly resolution: string;
  readonly confidence: number;
  readonly appliedCount: number;
  readonly createdAt: string;
  readonly lastAppliedAt: string | null;
}

/** The state of the exception processing engine */
export interface EngineState {
  readonly invoices: readonly Invoice[];
  readonly exceptions: readonly Exception[];
  readonly proposals: readonly FixProposal[];
  readonly reviews: readonly Review[];
  readonly learnedRules: readonly LearnedRule[];
  readonly currentInvoice: Invoice | null;
  readonly currentException: Exception | null;
  readonly isProcessing: boolean;
  readonly error: string | null;
}

/** API request to generate a fix proposal */
export interface GenerateRequest {
  exceptionType: ExceptionType;
  invoice: Invoice;
  exception: Exception;
  learnedRules: LearnedRule[];
}

/** API response with fix proposals */
export interface GenerateResponse {
  proposals: FixProposal[];
  usedLearnedRule: LearnedRule | null;
}
