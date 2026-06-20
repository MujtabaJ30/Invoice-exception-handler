/**
 * Vercel Serverless Function — OpenCode Go API Proxy
 * Keeps API key secure on the server side
 * Handles LLM requests for fix proposal generation
 */

import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENCODE_API_URL = 'https://opencode.ai/zen/go/v1/chat/completions';
const OPENCODE_MODEL = 'deepseek-v4-flash';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ProposalSchema = z.object({
  description: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1),
});

const ProposalArraySchema = z.array(ProposalSchema).min(1).max(5);

function handleHealthCheck(res: VercelResponse): void {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: OPENCODE_MODEL,
  });
}

function createSystemPrompt(): string {
  return `You are an AI invoice processing specialist. Your job is to analyze invoice exceptions and propose practical fixes.

When given an exception and invoice details, you MUST respond with a JSON array of 2-3 fix proposals. Each proposal must have:
- description: A clear, actionable description of the fix
- confidence: A number between 0 and 1 indicating confidence level
- reasoning: Brief explanation of why this fix makes sense

Response format (JSON only, no other text):
[
  {
    "description": "Fix description here",
    "confidence": 0.85,
    "reasoning": "Why this fix works"
  }
]

Guidelines:
- Be specific and actionable
- Consider the vendor's history if provided
- Suggest escalation for high-risk fixes
- Confidence should reflect certainty, not optimism
- If a learned rule applies, use it as the primary suggestion`;
}

function createUserPrompt(body: Record<string, unknown>): string {
  const { exceptionType, invoice, exception, learnedRules } = body;

  const invoiceData = invoice as Record<string, unknown>;
  const exceptionData = exception as Record<string, unknown>;
  const rules = (learnedRules || []) as Array<Record<string, unknown>>;

  const relevantRules = rules.filter((rule) => rule.exceptionType === exceptionType);

  let prompt = `## Exception Details
- Type: ${exceptionType}
- Severity: ${exceptionData.severity}
- Message: ${exceptionData.message}

## Invoice Information
- Invoice Number: ${invoiceData.invoiceNumber}
- Vendor: ${invoiceData.vendorName}
- Date: ${invoiceData.invoiceDate}
- Total: $${Number(invoiceData.total).toFixed(2)}
- PO Number: ${invoiceData.poNumber || 'None'}

## Exception Context
${JSON.stringify(exceptionData.details, null, 2)}`;

  if (relevantRules.length > 0) {
    prompt += `\n\n## Learned Rules (from previous corrections)
${relevantRules
      .map(
        (rule) => `- Pattern: ${rule.pattern}
  Resolution: ${rule.resolution}
  Confidence: ${rule.confidence}
  Applied: ${rule.appliedCount} times`
      )
      .join('\n')}`;
  }

  prompt += `\n\nPlease propose 2-3 fixes for this exception. Return ONLY the JSON array.`;

  return prompt;
}

async function callOpenCodeAPI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENCODE_GO_API_KEY;
  if (!apiKey) {
    throw new Error('OPENCODE_GO_API_KEY environment variable is not set');
  }

  const response = await fetch(OPENCODE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENCODE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenCode API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '[]';
}

function parseProposals(responseText: string): Array<{ description: string; confidence: number; reasoning: string }> {
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return ProposalArraySchema.parse(parsed);
}

function buildFallbackProposals() {
  return [
    {
      description: 'Review manually and apply standard resolution',
      confidence: 0.5,
      reasoning: 'Fallback proposal due to processing error',
    },
    {
      description: 'Escalate to senior accountant for review',
      confidence: 0.3,
      reasoning: 'Escalation when automated resolution fails',
    },
  ];
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(200).end();
    return;
  }

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'GET') {
    handleHealthCheck(res);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body;

    if (!body.exceptionType || !body.invoice || !body.exception) {
      res.status(400).json({
        error: 'Missing required fields: exceptionType, invoice, exception',
      });
      return;
    }

    const systemPrompt = createSystemPrompt();
    const userPrompt = createUserPrompt(body);
    const responseText = await callOpenCodeAPI(systemPrompt, userPrompt);

    let proposals;
    try {
      proposals = parseProposals(responseText);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      proposals = buildFallbackProposals();
    }

    const learnedRules = (body.learnedRules || []) as Array<Record<string, unknown>>;
    const relevantRule = learnedRules.find((rule) => rule.exceptionType === body.exceptionType);

    res.status(200).json({
      proposals,
      usedLearnedRule: relevantRule || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(200).json({
      proposals: buildFallbackProposals(),
      usedLearnedRule: null,
      fallback: true,
      error: errorMessage,
    });
  }
}
