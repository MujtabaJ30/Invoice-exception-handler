/**
 * Serverless function for invoice ingestion and listing.
 * GET  /api/invoices?companyId=... — list ingested invoices
 * POST /api/invoices — ingest one or more invoices
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../src/lib/db/index.ts';
import { detectExceptions } from '../src/lib/exceptions.ts';
import type { Invoice } from '../src/types/index.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  const db = getDatabase();
  await db.initialize();

  try {
    if (req.method === 'GET') {
      const companyId = req.query.companyId as string | undefined;
      if (!companyId) {
        res.status(400).json({ error: 'companyId query param is required' });
        return;
      }
      const dbInvoices = await db.getInvoices(companyId);
      res.status(200).json({
        invoices: dbInvoices.map((i) => i.payload),
        exceptions: dbInvoices.flatMap((i) => i.exceptions),
      });
      return;
    }

    if (req.method === 'POST') {
      const { companyId, invoices } = req.body;
      if (!companyId || !Array.isArray(invoices)) {
        res.status(400).json({ error: 'Missing companyId or invoices array' });
        return;
      }

      const existing = await db.getInvoices(companyId);
      const existingIds = new Set(existing.map((i) => i.id));

      const results = [];
      for (const raw of invoices) {
        const invoice = raw as Invoice;
        if (existingIds.has(invoice.id)) {
          continue;
        }
        const exceptions = detectExceptions(invoice, existing.map((i) => i.payload));
        const record = await db.createInvoice({ companyId, payload: invoice, exceptions });
        results.push(record);
        existing.push(record);
        existingIds.add(invoice.id);
      }

      res.status(200).json({
        ingested: results.length,
        invoices: results.map((r) => r.payload),
        exceptions: results.flatMap((r) => r.exceptions),
      });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Invoices handler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
