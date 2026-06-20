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
