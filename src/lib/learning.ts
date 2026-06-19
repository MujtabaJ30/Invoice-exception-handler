import type { ExceptionType, FixProposal } from '../types/index.ts';
import type { DbRule } from './db';
import { createRule, fetchRules } from './api';

export class LearningStoreError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'LearningStoreError';
  }
}

export async function getLearnedRules(companyId: string): Promise<DbRule[]> {
  return fetchRules(companyId);
}

export async function getRulesByType(companyId: string, exceptionType: ExceptionType): Promise<DbRule[]> {
  const rules = await fetchRules(companyId);
  return rules.filter((rule) => rule.exceptionType === exceptionType);
}

export async function findMatchingRule(
  companyId: string,
  exceptionType: ExceptionType,
  pattern: string
): Promise<DbRule | null> {
  const rules = await fetchRules(companyId);
  return (
    rules.find(
      (rule) => rule.exceptionType === exceptionType && rule.pattern === pattern
    ) || null
  );
}

export async function addLearnedRule(
  companyId: string,
  exceptionType: ExceptionType,
  pattern: string,
  resolution: string,
  confidence = 0.8
): Promise<DbRule> {
  const rule = await createRule(companyId, exceptionType, pattern, resolution, confidence);
  return rule;
}

export async function recordRuleUsage(
  _companyId: string,
  _ruleId: string
): Promise<void> {
  // Applied count is incremented on the server when a learned proposal is used.
}

export function generatePattern(
  exceptionType: ExceptionType,
  details: Record<string, unknown>
): string {
  const relevantDetails = getRelevantDetails(exceptionType, details);
  return `${exceptionType}:${JSON.stringify(relevantDetails)}`;
}

function getRelevantDetails(
  exceptionType: ExceptionType,
  details: Record<string, unknown>
): Record<string, unknown> {
  switch (exceptionType) {
    case 'missing_po':
      return { vendorName: details.vendorName };
    case 'duplicate_invoice':
      return { invoiceNumber: details.invoiceNumber };
    case 'amount_mismatch':
      return { difference: details.difference };
    case 'tax_calculation_error':
      return { difference: details.difference };
    case 'vendor_not_found':
      return { vendorName: details.vendorName };
    default:
      return details;
  }
}

export function buildLearnedProposal(rule: DbRule, exceptionId: string): FixProposal {
  return {
    id: `learned_${rule.id}`,
    exceptionId,
    description: rule.resolution,
    confidence: rule.confidence,
    reasoning: `Applied learned rule (used ${rule.appliedCount} times)`,
    action: { type: 'approve', data: { learnedRuleId: rule.id } },
  };
}
