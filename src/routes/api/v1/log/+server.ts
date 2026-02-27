import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type { LogEvent } from '$lib/models/Log';

const ACCEPTED = 202;

function getOrigin(request: Request): string | undefined {
  const origin = import.meta.env.VITE_ORIGIN;
  if (origin) return origin;
  console.warn('[log] VITE_ORIGIN not configured; falling back to reverse proxy headers');
  const proto = request.headers.get('X-Forwarded-Proto') || 'https';
  const host = request.headers.get('X-Forwarded-Host') || request.headers.get('Host');
  if (host) return `${proto}://${host}/`;
  return undefined;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const AUDIT_API_KEY = env.AUDIT_API_KEY;
  const origin = getOrigin(request);

  if (!origin) {
    console.warn('[log] RESOURCE_LOG or origin not configured; dropping event');
    return json({ result: 'dropped' }, { status: ACCEPTED });
  }

  let body: LogEvent;
  try {
    body = await request.json();
  } catch {
    console.warn('[log] Invalid JSON in log request; dropping event');
    return json({ result: 'dropped' }, { status: ACCEPTED });
  }

  body.src_ip = getClientAddress();

  if (!body.event_type) {
    console.warn('[log] Missing event_type in log request; dropping event');
    return json({ result: 'dropped' }, { status: ACCEPTED });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authorization = request.headers.get('Authorization');
  if (authorization) {
    headers['Authorization'] = authorization;
  }

  if (AUDIT_API_KEY) {
    headers['X-API-Key'] = AUDIT_API_KEY;
  }

  try {
    const target = new URL('picsure/proxy/pic-sure-logging/audit', origin).toString();
    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      console.error(
        `[log] Upstream returned ${upstream.status}: ${await upstream.text().catch(() => '(no body)')}`,
      );
    }
    console.debug(`[log] Forwarded to logging service: ${upstream.status}`);
  } catch (err) {
    console.error('[log] Network error forwarding to logging service:', err);
  }

  return json({ result: 'accepted' }, { status: ACCEPTED });
};
