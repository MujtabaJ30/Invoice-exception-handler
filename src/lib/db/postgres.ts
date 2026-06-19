import { neon } from '@neondatabase/serverless';
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
import type { ExceptionType, ReviewStatus } from '../../types/index.ts';

const MANUAL_COST_PER_INVOICE = 13.5;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(url);
}

export class PostgresDatabase implements Database {
  async initialize(): Promise<void> {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS exception_rules (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        exception_type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        resolution TEXT NOT NULL,
        confidence REAL NOT NULL,
        applied_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_applied_at TIMESTAMPTZ
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_rules_lookup
      ON exception_rules (company_id, exception_type, pattern)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS exception_reviews (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        exception_id TEXT NOT NULL,
        invoice_id TEXT NOT NULL,
        proposal_id TEXT NOT NULL,
        status TEXT NOT NULL,
        decision JSONB,
        corrected_by TEXT,
        notes TEXT,
        reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_reviews_company
      ON exception_reviews (company_id, reviewed_at)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS exception_invoices (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        exceptions JSONB NOT NULL DEFAULT '[]',
        detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending'
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_company
      ON exception_invoices (company_id, detected_at)
    `;
  }

  async getRules(companyId: string, exceptionType?: ExceptionType): Promise<DbRule[]> {
    const sql = getSql();
    const rows = exceptionType
      ? await sql`SELECT * FROM exception_rules WHERE company_id = ${companyId} AND exception_type = ${exceptionType} ORDER BY last_applied_at DESC NULLS LAST`
      : await sql`SELECT * FROM exception_rules WHERE company_id = ${companyId} ORDER BY last_applied_at DESC NULLS LAST`;
    return rows.map(mapRuleRow);
  }

  async findRule(
    companyId: string,
    exceptionType: ExceptionType,
    pattern: string
  ): Promise<DbRule | null> {
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM exception_rules
      WHERE company_id = ${companyId} AND exception_type = ${exceptionType} AND pattern = ${pattern}
      LIMIT 1
    `;
    return rows.length > 0 ? mapRuleRow(rows[0]) : null;
  }

  async createOrUpdateRule(input: CreateRuleInput): Promise<DbRule> {
    const sql = getSql();
    const existing = await this.findRule(input.companyId, input.exceptionType, input.pattern);

    if (existing) {
      const rows = await sql`
        UPDATE exception_rules
        SET resolution = ${input.resolution},
            confidence = ${Math.max(existing.confidence, input.confidence)},
            applied_count = applied_count + 1,
            last_applied_at = NOW()
        WHERE id = ${existing.id}
        RETURNING *
      `;
      return mapRuleRow(rows[0]);
    }

    const id = `rule_${generateId()}`;
    const rows = await sql`
      INSERT INTO exception_rules (id, company_id, exception_type, pattern, resolution, confidence, applied_count, created_at, last_applied_at)
      VALUES (${id}, ${input.companyId}, ${input.exceptionType}, ${input.pattern}, ${input.resolution}, ${input.confidence}, 1, NOW(), NOW())
      RETURNING *
    `;
    return mapRuleRow(rows[0]);
  }

  async incrementRuleAppliedCount(ruleId: string): Promise<void> {
    const sql = getSql();
    await sql`
      UPDATE exception_rules
      SET applied_count = applied_count + 1, last_applied_at = NOW()
      WHERE id = ${ruleId}
    `;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const sql = getSql();
    const result = await sql`DELETE FROM exception_rules WHERE id = ${ruleId}`;
    return (result as unknown as { count: number }).count > 0;
  }

  async createReview(input: CreateReviewInput): Promise<DbReview> {
    const sql = getSql();
    const id = `review_${generateId()}`;
    const rows = await sql`
      INSERT INTO exception_reviews (id, company_id, exception_id, invoice_id, proposal_id, status, decision, corrected_by, notes, reviewed_at)
      VALUES (${id}, ${input.companyId}, ${input.exceptionId}, ${input.invoiceId}, ${input.proposalId}, ${input.status}, ${JSON.stringify(input.decision)}, ${input.correctedBy}, ${input.notes}, NOW())
      RETURNING *
    `;

    if (input.status === 'approved' || input.status === 'corrected') {
      await this.updateInvoiceStatus(input.companyId, input.invoiceId, 'resolved');
    }

    return mapReviewRow(rows[0]);
  }

  async getReviews(companyId: string): Promise<DbReview[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM exception_reviews WHERE company_id = ${companyId} ORDER BY reviewed_at DESC`;
    return rows.map(mapReviewRow);
  }

  async createInvoice(input: CreateInvoiceInput): Promise<DbInvoice> {
    const sql = getSql();
    const id = input.payload.id;
    const status = input.exceptions.length > 0 ? 'exception' : 'pending';
    const rows = await sql`
      INSERT INTO exception_invoices (id, company_id, payload, exceptions, detected_at, status)
      VALUES (${id}, ${input.companyId}, ${JSON.stringify(input.payload)}, ${JSON.stringify(input.exceptions)}, NOW(), ${status})
      RETURNING *
    `;
    return mapInvoiceRow(rows[0]);
  }

  async getInvoices(companyId: string): Promise<DbInvoice[]> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM exception_invoices WHERE company_id = ${companyId} ORDER BY detected_at DESC`;
    return rows.map(mapInvoiceRow);
  }

  async getInvoice(companyId: string, invoiceId: string): Promise<DbInvoice | null> {
    const sql = getSql();
    const rows = await sql`SELECT * FROM exception_invoices WHERE company_id = ${companyId} AND id = ${invoiceId} LIMIT 1`;
    return rows.length > 0 ? mapInvoiceRow(rows[0]) : null;
  }

  async updateInvoiceStatus(
    companyId: string,
    invoiceId: string,
    status: DbInvoice['status']
  ): Promise<void> {
    const sql = getSql();
    await sql`
      UPDATE exception_invoices
      SET status = ${status}
      WHERE company_id = ${companyId} AND id = ${invoiceId}
    `;
  }

  async getMetrics(companyId: string): Promise<MetricsSnapshot> {
    const sql = getSql();

    const [invoiceCountResult, ruleCountResult, reviewRows, invoiceRows] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM exception_invoices WHERE company_id = ${companyId}`,
      sql`SELECT COUNT(*)::int as count FROM exception_rules WHERE company_id = ${companyId}`,
      sql`SELECT status, decision FROM exception_reviews WHERE company_id = ${companyId}`,
      sql`SELECT exceptions FROM exception_invoices WHERE company_id = ${companyId}`,
    ]);

    const totalInvoices = (invoiceCountResult[0] as { count: number }).count;
    const learnedRulesCount = (ruleCountResult[0] as { count: number }).count;

    let totalExceptions = 0;
    for (const row of invoiceRows) {
      const exceptions = (row as { exceptions: unknown }).exceptions;
      const parsed = Array.isArray(exceptions) ? exceptions : JSON.parse(exceptions as string);
      totalExceptions += parsed.length;
    }

    const reviews = reviewRows.map(mapReviewRow);
    const resolvedExceptions = reviews.filter((r) => r.status !== 'rejected').length;
    const autoResolvedCount = reviews.filter(
      (r) => r.status === 'approved' && r.decision?.id.startsWith('learned_')
    ).length;

    const touchlessDenominator = totalExceptions || 1;
    const touchlessRate = totalExceptions > 0 ? autoResolvedCount / touchlessDenominator : 0;

    const laborHoursSaved = (resolvedExceptions * 12) / 60;
    const costSaved = laborHoursSaved * 45;
    const costPerInvoice = totalInvoices > 0 ? Math.max(0, MANUAL_COST_PER_INVOICE - costSaved / (totalInvoices || 1)) : MANUAL_COST_PER_INVOICE;

    return {
      totalInvoices,
      totalExceptions,
      resolvedExceptions,
      pendingExceptions: totalExceptions - resolvedExceptions,
      autoResolvedCount,
      avgResolutionTimeSeconds: null,
      learnedRulesCount,
      touchlessRate,
      costPerInvoice,
    };
  }
}

function mapRuleRow(row: Record<string, unknown>): DbRule {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    exceptionType: row.exception_type as ExceptionType,
    pattern: row.pattern as string,
    resolution: row.resolution as string,
    confidence: row.confidence as number,
    appliedCount: row.applied_count as number,
    createdAt: (row.created_at as Date).toISOString(),
    lastAppliedAt: row.last_applied_at ? (row.last_applied_at as Date).toISOString() : null,
  };
}

function mapReviewRow(row: Record<string, unknown>): DbReview {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    exceptionId: row.exception_id as string,
    invoiceId: row.invoice_id as string,
    proposalId: row.proposal_id as string,
    status: row.status as ReviewStatus,
    decision: row.decision ? (typeof row.decision === 'string' ? JSON.parse(row.decision) : row.decision) : null,
    correctedBy: row.corrected_by as string | null,
    notes: row.notes as string | null,
    reviewedAt: (row.reviewed_at as Date).toISOString(),
  };
}

function mapInvoiceRow(row: Record<string, unknown>): DbInvoice {
  const payloadRaw = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  const exceptionsRaw = typeof row.exceptions === 'string' ? JSON.parse(row.exceptions) : row.exceptions;

  return {
    id: row.id as string,
    companyId: row.company_id as string,
    payload: payloadRaw as DbInvoice['payload'],
    exceptions: exceptionsRaw as DbInvoice['exceptions'],
    detectedAt: (row.detected_at as Date).toISOString(),
    status: row.status as DbInvoice['status'],
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
