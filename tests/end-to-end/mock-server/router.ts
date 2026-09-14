import type { IncomingMessage, ServerResponse } from 'node:http';

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
  // Parsed JSON when the body is valid JSON, otherwise the raw text (see api.ts: some
  // endpoints send a bare string body with a `Content-Type: application/json` header).
  body: unknown;
}

export type Handler = (ctx: RouteContext) => void | Promise<void>;

interface Route {
  method: string;
  source: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

// Turns `/picsure/dictionary/concepts/detail/:dataset` into a matchable regex, capturing
// `:segment` placeholders by name. Everything else is matched literally.
function compile(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = [];
  const body = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { pattern: new RegExp(`^${body}/?$`), keys };
}

export function on(method: string, path: string, handler: Handler): void {
  const { pattern, keys } = compile(path);
  routes.push({ method: method.toUpperCase(), source: path, pattern, keys, handler });
}

export function json(res: ServerResponse, data: unknown, status = 200): void {
  const payload = JSON.stringify(data ?? null);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(payload);
}

export function text(
  res: ServerResponse,
  data: string,
  status = 200,
  contentType = 'text/plain',
): void {
  res.writeHead(status, { 'content-type': contentType });
  res.end(data);
}

export function noContent(res: ServerResponse, status = 200): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end('{}');
}

function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseBody(raw: string): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function dispatch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://mock-server.local');
  const pathname = decodeURIComponent(url.pathname);
  const method = (req.method ?? 'GET').toUpperCase();

  const route = routes.find((r) => r.method === method && r.pattern.test(pathname));
  if (!route) {
    console.warn(`[mock-api] 404 ${method} ${pathname} (not mocked)`);
    json(res, { error: `No mock route for ${method} ${pathname}` }, 404);
    return;
  }

  const match = route.pattern.exec(pathname);
  const params = Object.fromEntries(
    route.keys.map((key, i) => [key, decodeURIComponent(match?.[i + 1] ?? '')]),
  );

  const raw = await readRawBody(req);
  const body = parseBody(raw);

  try {
    console.log(`[mock-api] ${method} ${pathname}`);
    await route.handler({ req, res, params, query: url.searchParams, body });
  } catch (e) {
    console.error(`[mock-api] handler error for ${method} ${pathname}:`, e);
    if (!res.headersSent) json(res, { error: String(e) }, 500);
  }
}
