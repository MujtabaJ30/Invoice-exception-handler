import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../src/lib/db/index.ts';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { companyId } = req.body || {};
    if (!companyId || typeof companyId !== 'string') {
      res.status(400).json({ error: 'companyId required' });
      return;
    }

    const db = getDatabase();
    await db.clearAll(companyId);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Reset handler error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
