/**
 * API client for the Exception Engine backend.
 * Handles rules, reviews, invoices, and LLM proposal generation.
 */

import { z } from 'zod';
import type {
  ExceptionType,
  FixProposal,
  GenerateRequest,
  GenerateResponse,
  Invoice,
  Exception,
} from '../types/index.ts';
import type { DbRule, DbReview, MetricsSnapshot } from './db/index.ts';

const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          lastError = new ApiError(`Server error: ${errorText}`, response.status);
          continue;
        }
        throw new ApiError(`Request failed: ${errorText}`, response.status);
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode && error.statusCode >= 500 && attempt < MAX_RETRIES) {
          lastError = error;
          continue;
        }
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new ApiError('Request timed out', 408);
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }

      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt < MAX_RETRIES) continue;
    }
  }

  throw lastError || new ApiError('All retry attempts failed');
}

const ProposalSchema = z.object({
  description: z.string(),
  confidence: z.number(),
  reasoning: z.string(),
});

const GenerateResponseSchema = z.object({
  proposals: z.array(ProposalSchema),
  usedLearnedRule: z.unknown().nullable(),
});

export async function generateFixProposals(
  request: GenerateRequest & { companyId: string }
): Promise<GenerateResponse> {
  const response = await fetchWithRetry('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  const parsed = GenerateResponseSchema.parse(data);

  const proposals: FixProposal[] = parsed.proposals.map((item) => ({
    id: `fix_${generateId()}`,
    exceptionId: request.exception.id,
    description: item.description,
    confidence: Math.max(0, Math.min(1, item.confidence)),
    reasoning: item.reasoning,
    action: { type: 'approve' as const, data: {} },
  }));

  return {
    proposals,
    usedLearnedRule: null,
  };
}

export async function fetchRules(companyId: string): Promise<DbRule[]> {
  const response = await fetchWithRetry(`/api/rules?companyId=${encodeURIComponent(companyId)}`, {
    method: 'GET',
  });
  const data = await response.json();
  return data.rules || [];
}

export async function createRule(
  companyId: string,
  exceptionType: ExceptionType,
  pattern: string,
  resolution: string,
  confidence: number
): Promise<DbRule> {
  const response = await fetchWithRetry('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, exceptionType, pattern, resolution, confidence }),
  });
  const data = await response.json();
  return data.rule;
}

export async function fetchReviews(companyId: string): Promise<DbReview[]> {
  const response = await fetchWithRetry(`/api/reviews?companyId=${encodeURIComponent(companyId)}`, {
    method: 'GET',
  });
  const data = await response.json();
  return data.reviews || [];
}

export async function createReview(
  companyId: string,
  review: {
    exceptionId: string;
    invoiceId: string;
    proposalId: string;
    status: DbReview['status'];
    decision: FixProposal | null;
    correctedBy: string | null;
    notes: string | null;
  }
): Promise<DbReview> {
  const response = await fetchWithRetry('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, ...review }),
  });
  const data = await response.json();
  return data.review;
}

export async function fetchInvoices(
  companyId: string
): Promise<{ invoices: Invoice[]; exceptions: Exception[] }> {
  const response = await fetchWithRetry(`/api/invoices?companyId=${encodeURIComponent(companyId)}`, {
    method: 'GET',
  });
  return response.json();
}

export async function ingestInvoices(
  companyId: string,
  invoices: Invoice[]
): Promise<{ ingested: number; invoices: Invoice[]; exceptions: Exception[] }> {
  const response = await fetchWithRetry('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, invoices }),
  });
  return response.json();
}

export async function fetchMetrics(companyId: string): Promise<MetricsSnapshot> {
  const response = await fetchWithRetry(`/api/metrics?companyId=${encodeURIComponent(companyId)}`, {
    method: 'GET',
  });
  const data = await response.json();
  return data.metrics;
}

export async function resetDatabase(companyId: string): Promise<void> {
  await fetchWithRetry('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId }),
  });
}
