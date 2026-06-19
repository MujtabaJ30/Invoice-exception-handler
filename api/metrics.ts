/**
 * Serverless function for metrics dashboard.
 * GET /api/metrics?companyId=...
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../src/lib/db/index.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
    return;
  }

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const companyId = req.query.companyId as string | undefined;
  if (!companyId) {
    res.status(400).json({ error: 'companyId query param is required' });
    return;
  }

  try {
    const db = getDatabase();
    await db.initialize();
    const metrics = await db.getMetrics(companyId);
    res.status(200).json({ metrics });
  } catch (error) {
    console.error('Metrics handler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
