/**
 * Serverless function for learned rules.
 * GET  /api/rules?companyId=... — list rules
 * POST /api/rules — create or update a rule
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../src/lib/db/index.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

  const db = getDatabase();
  await db.initialize();

  try {
    if (req.method === 'GET') {
      const companyId = req.query.companyId as string | undefined;
      if (!companyId) {
        res.status(400).json({ error: 'companyId query param is required' });
        return;
      }
      const rules = await db.getRules(companyId);
      res.status(200).json({ rules });
      return;
    }

    if (req.method === 'POST') {
      const { companyId, exceptionType, pattern, resolution, confidence } = req.body;
      if (!companyId || !exceptionType || !pattern || !resolution) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      const rule = await db.createOrUpdateRule({
        companyId,
        exceptionType,
        pattern,
        resolution,
        confidence: typeof confidence === 'number' ? confidence : 0.8,
      });
      res.status(200).json({ rule });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Rules handler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
