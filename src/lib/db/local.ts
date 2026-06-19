import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type {
  Database,
  DbRule,
  DbReview,
  DbInvoice,
  CreateRuleInput,
  CreateReviewInput,
  CreateInvoiceInput,
  MetricsSnapshot,
} from './types.ts';
import type { ExceptionType } from '../../types/index.ts';

const DATA_DIR = join(process.cwd(), '.local-data');
const DATA_FILE = join(DATA_DIR, 'db.json');
const MANUAL_COST_PER_INVOICE = 13.5;

interface LocalDbSnapshot {
  rules: DbRule[];
  reviews: DbReview[];
  invoices: DbInvoice[];
}

function readDb(): LocalDbSnapshot {
  if (!existsSync(DATA_FILE)) {
    return { rules: [], reviews: [], invoices: [] };
  }
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as LocalDbSnapshot;
  } catch {
    return { rules: [], reviews: [], invoices: [] };
  }
}

function writeDb(snapshot: LocalDbSnapshot): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2));
}

export class LocalDatabase implements Database {
  async initialize(): Promise<void> {
    readDb();
  }

  async getRules(companyId: string, exceptionType?: ExceptionType): Promise<DbRule[]> {
    const db = readDb();
    return db.rules
      .filter((r) => r.companyId === companyId && (!exceptionType || r.exceptionType === exceptionType))
      .sort((a, b) => (b.lastAppliedAt ?? '').localeCompare(a.lastAppliedAt ?? ''));
  }

  async findRule(
    companyId: string,
    exceptionType: ExceptionType,
    pattern: string
  ): Promise<DbRule | null> {
    const db = readDb();
    return (
      db.rules.find(
        (r) => r.companyId === companyId && r.exceptionType === exceptionType && r.pattern === pattern
      ) || null
    );
  }

  async createOrUpdateRule(input: CreateRuleInput): Promise<DbRule> {
    const db = readDb();
    const existingIndex = db.rules.findIndex(
      (r) =>
        r.companyId === input.companyId &&
        r.exceptionType === input.exceptionType &&
        r.pattern === input.pattern
    );

    if (existingIndex >= 0) {
      const existing = db.rules[existingIndex];
      const updated: DbRule = {
        ...existing,
        resolution: input.resolution,
        confidence: Math.max(existing.confidence, input.confidence),
        appliedCount: existing.appliedCount + 1,
        lastAppliedAt: new Date().toISOString(),
      };
      db.rules[existingIndex] = updated;
      writeDb(db);
      return updated;
    }

    const newRule: DbRule = {
      id: `rule_${generateId()}`,
      companyId: input.companyId,
      exceptionType: input.exceptionType,
      pattern: input.pattern,
      resolution: input.resolution,
      confidence: input.confidence,
      appliedCount: 1,
      createdAt: new Date().toISOString(),
      lastAppliedAt: new Date().toISOString(),
    };
    db.rules.push(newRule);
    writeDb(db);
    return newRule;
  }

  async incrementRuleAppliedCount(ruleId: string): Promise<void> {
    const db = readDb();
    const index = db.rules.findIndex((r) => r.id === ruleId);
    if (index >= 0) {
      db.rules[index] = {
        ...db.rules[index],
        appliedCount: db.rules[index].appliedCount + 1,
        lastAppliedAt: new Date().toISOString(),
      };
      writeDb(db);
    }
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const db = readDb();
    const initialLength = db.rules.length;
    db.rules = db.rules.filter((r) => r.id !== ruleId);
    if (db.rules.length < initialLength) {
      writeDb(db);
      return true;
    }
    return false;
  }

  async createReview(input: CreateReviewInput): Promise<DbReview> {
    const db = readDb();
    const review: DbReview = {
      id: `review_${generateId()}`,
      companyId: input.companyId,
      exceptionId: input.exceptionId,
      invoiceId: input.invoiceId,
      proposalId: input.proposalId,
      status: input.status,
      decision: input.decision,
      correctedBy: input.correctedBy,
      notes: input.notes,
      reviewedAt: new Date().toISOString(),
    };
    db.reviews.push(review);

      if (input.status === 'approved' || input.status === 'corrected') {
        const index = db.invoices.findIndex(
          (i) => i.companyId === input.companyId && i.id === input.invoiceId
        );
        if (index >= 0) {
          db.invoices[index] = { ...db.invoices[index], status: 'resolved' };
        }
      }

    writeDb(db);
    return review;
  }

  async getReviews(companyId: string): Promise<DbReview[]> {
    const db = readDb();
    return db.reviews
      .filter((r) => r.companyId === companyId)
      .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));
  }

  async createInvoice(input: CreateInvoiceInput): Promise<DbInvoice> {
    const db = readDb();
    const invoice: DbInvoice = {
      id: input.payload.id,
      companyId: input.companyId,
      payload: input.payload,
      exceptions: input.exceptions,
      detectedAt: new Date().toISOString(),
      status: input.exceptions.length > 0 ? 'exception' : 'pending',
    };
    db.invoices.push(invoice);
    writeDb(db);
    return invoice;
  }

  async getInvoices(companyId: string): Promise<DbInvoice[]> {
    const db = readDb();
    return db.invoices
      .filter((i) => i.companyId === companyId)
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  }

  async getInvoice(companyId: string, invoiceId: string): Promise<DbInvoice | null> {
    const db = readDb();
    return db.invoices.find((i) => i.companyId === companyId && i.id === invoiceId) || null;
  }

  async updateInvoiceStatus(
    companyId: string,
    invoiceId: string,
    status: DbInvoice['status']
  ): Promise<void> {
    const db = readDb();
    const index = db.invoices.findIndex((i) => i.companyId === companyId && i.id === invoiceId);
    if (index >= 0) {
      db.invoices[index] = { ...db.invoices[index], status };
      writeDb(db);
    }
  }

  async getMetrics(companyId: string): Promise<MetricsSnapshot> {
    const db = readDb();
    const invoices = db.invoices.filter((i) => i.companyId === companyId);
    const reviews = db.reviews.filter((r) => r.companyId === companyId);
    const rules = db.rules.filter((r) => r.companyId === companyId);

    const totalInvoices = invoices.length;
    const totalExceptions = invoices.reduce((sum, i) => sum + i.exceptions.length, 0);
    const resolvedExceptions = reviews.filter((r) => r.status !== 'rejected').length;
    const autoResolvedCount = reviews.filter(
      (r) => r.status === 'approved' && r.decision?.id.startsWith('learned_')
    ).length;

    const touchlessDenominator = totalExceptions || 1;
    const touchlessRate = totalExceptions > 0 ? autoResolvedCount / touchlessDenominator : 0;

    const laborHoursSaved = (resolvedExceptions * 12) / 60;
    const costSaved = laborHoursSaved * 45;
    const costPerInvoice =
      totalInvoices > 0
        ? Math.max(0, MANUAL_COST_PER_INVOICE - costSaved / (totalInvoices || 1))
        : MANUAL_COST_PER_INVOICE;

    return {
      totalInvoices,
      totalExceptions,
      resolvedExceptions,
      pendingExceptions: totalExceptions - resolvedExceptions,
      autoResolvedCount,
      avgResolutionTimeSeconds: null,
      learnedRulesCount: rules.length,
      touchlessRate,
      costPerInvoice,
    };
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
