import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { IncomingMessage, ServerResponse } from 'node:http';

function loadEnvKey(): string {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/^OPENCODE_GO_API_KEY=(.+)$/m);
    const raw = match ? match[1].trim() : '';
    return raw.replace(/^["']|["']$/g, '');
  } catch {
    return process.env.OPENCODE_GO_API_KEY || '';
  }
}

function ensureApiKeyInEnv(): void {
  if (!process.env.OPENCODE_GO_API_KEY) {
    process.env.OPENCODE_GO_API_KEY = loadEnvKey();
  }
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString();
  return text ? JSON.parse(text) : {};
}

function createVercelRequest(req: IncomingMessage, body: Record<string, unknown>): VercelRequest {
  const url = new URL(req.url || '/', 'http://localhost');
  const query: Record<string, string | string[]> = {};
  url.searchParams.forEach((value, key) => {
    const existing = query[key];
    query[key] = existing ? ([] as string[]).concat(existing, value) : value;
  });

  return {
    method: req.method || 'GET',
    url: req.url || '/',
    headers: req.headers as Record<string, string | string[]>,
    body,
    query,
  } as unknown as VercelRequest;
}

function createVercelResponse(res: ServerResponse): VercelResponse {
  const response = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      res.statusCode = code;
      return this;
    },
    setHeader(key: string, value: string | number | readonly string[]) {
      res.setHeader(key, value as string);
      return this;
    },
    json(data: unknown) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(data));
      return this;
    },
    end(data?: string | Buffer) {
      res.end(data);
      return this;
    },
    send(data: unknown) {
      res.end(data as string);
      return this;
    },
  };
  return response as unknown as VercelResponse;
}

function resolveApiPath(name: string): string {
  return resolve(process.cwd(), 'api', name);
}

async function routeApiRequest(req: IncomingMessage, res: ServerResponse, routePath: string): Promise<void> {
  const body = await readBody(req);
  const vercelReq = createVercelRequest(req, body);
  const vercelRes = createVercelResponse(res);

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const module = await import(pathToFileURL(routePath).href);
  await module.default(vercelReq, vercelRes);
}

function devApiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use('/api/generate', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, CORS_HEADERS);
          res.end();
          return;
        }

        ensureApiKeyInEnv();
        if (!process.env.OPENCODE_GO_API_KEY && req.method === 'POST') {
          sendJson(res, 500, { error: 'OPENCODE_GO_API_KEY not found in .env file' });
          return;
        }

        try {
          await routeApiRequest(req, res, resolveApiPath('generate.ts'));
        } catch (error) {
          console.error('Dev API /generate error:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          sendJson(res, 500, { error: message });
        }
      });

      server.middlewares.use('/api/rules', async (req, res, next) => {
        try {
          await routeApiRequest(req, res, resolveApiPath('rules.ts'));
        } catch (error) {
          console.error('Dev API /rules error:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          sendJson(res, 500, { error: message });
        }
      });

      server.middlewares.use('/api/reviews', async (req, res, next) => {
        try {
          await routeApiRequest(req, res, resolveApiPath('reviews.ts'));
        } catch (error) {
          console.error('Dev API /reviews error:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          sendJson(res, 500, { error: message });
        }
      });

      server.middlewares.use('/api/invoices', async (req, res, next) => {
        try {
          await routeApiRequest(req, res, resolveApiPath('invoices.ts'));
        } catch (error) {
          console.error('Dev API /invoices error:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          sendJson(res, 500, { error: message });
        }
      });

      server.middlewares.use('/api/metrics', async (req, res, next) => {
        try {
          await routeApiRequest(req, res, resolveApiPath('metrics.ts'));
        } catch (error) {
          console.error('Dev API /metrics error:', error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          sendJson(res, 500, { error: message });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
