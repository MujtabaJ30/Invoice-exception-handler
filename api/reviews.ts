/**
 * Serverless function for review decisions.
 * GET  /api/reviews?companyId=... — list reviews
 * POST /api/reviews — record a review
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
      const reviews = await db.getReviews(companyId);
      res.status(200).json({ reviews });
      return;
    }

    if (req.method === 'POST') {
      const { companyId, exceptionId, invoiceId, proposalId, status, decision, correctedBy, notes } = req.body;
      if (!companyId || !exceptionId || !invoiceId || !proposalId || !status) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      const review = await db.createReview({
        companyId,
        exceptionId,
        invoiceId,
        proposalId,
        status,
        decision: decision ?? null,
        correctedBy: correctedBy ?? null,
        notes: notes ?? null,
      });
      res.status(200).json({ review });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Reviews handler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
