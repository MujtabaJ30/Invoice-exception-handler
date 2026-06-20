import type { Invoice, Exception, FixProposal, ReviewStatus, ExceptionType } from '../../types/index.ts';

export interface DbRule {
  readonly id: string;
  readonly companyId: string;
  readonly exceptionType: ExceptionType;
  readonly pattern: string;
  readonly resolution: string;
  readonly confidence: number;
  readonly appliedCount: number;
  readonly createdAt: string;
  readonly lastAppliedAt: string | null;
}

export interface DbReview {
  readonly id: string;
  readonly companyId: string;
  readonly exceptionId: string;
  readonly invoiceId: string;
  readonly proposalId: string;
  readonly status: ReviewStatus;
  readonly decision: FixProposal | null;
  readonly correctedBy: string | null;
  readonly notes: string | null;
  readonly reviewedAt: string;
}

export interface DbInvoice {
  readonly id: string;
  readonly companyId: string;
  readonly payload: Invoice;
  readonly exceptions: Exception[];
  readonly detectedAt: string;
  readonly status: 'pending' | 'exception' | 'resolved';
}

export interface CreateRuleInput {
  readonly companyId: string;
  readonly exceptionType: ExceptionType;
  readonly pattern: string;
  readonly resolution: string;
  readonly confidence: number;
}

export interface CreateReviewInput {
  readonly companyId: string;
  readonly exceptionId: string;
  readonly invoiceId: string;
  readonly proposalId: string;
  readonly status: ReviewStatus;
  readonly decision: FixProposal | null;
  readonly correctedBy: string | null;
  readonly notes: string | null;
}

export interface CreateInvoiceInput {
  readonly companyId: string;
  readonly payload: Invoice;
  readonly exceptions: Exception[];
}

export interface MetricsSnapshot {
  readonly totalInvoices: number;
  readonly totalExceptions: number;
  readonly resolvedExceptions: number;
  readonly pendingExceptions: number;
  readonly autoResolvedCount: number;
  readonly avgResolutionTimeSeconds: number | null;
  readonly learnedRulesCount: number;
  readonly touchlessRate: number;
  readonly costPerInvoice: number;
}

export interface Database {
  initialize(): Promise<void>;

  getRules(companyId: string, exceptionType?: ExceptionType): Promise<DbRule[]>;
  findRule(companyId: string, exceptionType: ExceptionType, pattern: string): Promise<DbRule | null>;
  createOrUpdateRule(input: CreateRuleInput): Promise<DbRule>;

  createReview(input: CreateReviewInput): Promise<DbReview>;
  getReviews(companyId: string): Promise<DbReview[]>;

  createInvoice(input: CreateInvoiceInput): Promise<DbInvoice>;
  getInvoices(companyId: string): Promise<DbInvoice[]>;
  updateInvoiceStatus(companyId: string, invoiceId: string, status: DbInvoice['status']): Promise<void>;

  getMetrics(companyId: string): Promise<MetricsSnapshot>;
}
