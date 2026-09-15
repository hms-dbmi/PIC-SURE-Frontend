import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type { LogEvent } from '$lib/models/Log';

const ACCEPTED = 202;

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

// LOGGING_TARGET carries the client's bearer token and X-API-Key, so only loopback
// destinations (the local mock-api or a same-host gateway) may use plaintext HTTP -
// anything else must be HTTPS or an attacker on the network path can read both.
function isSecureLoggingTarget(target: string): boolean {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return false;
  }
  return url.protocol === 'https:' || LOOPBACK_HOSTNAMES.has(url.hostname);
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (!env.LOGGING_API_KEY) {
    console.error('[log] Logging API Key not set!');
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
  if (authorization && /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/i.test(authorization)) {
    headers['Authorization'] = authorization;
  }

  if (env.LOGGING_API_KEY) {
    headers['X-API-Key'] = env.LOGGING_API_KEY;
  }

  try {
    // Overridable for local dev, where nothing listens on localhost:80 - point this at
    // the mock-api server (or a real backend) instead. Unset in deployed environments,
    // where the gateway sidecar on localhost is always present.
    const target = env.LOGGING_TARGET || 'http://localhost/picsure/logging/audit';
    if (!isSecureLoggingTarget(target)) {
      console.error(
        `[log] Refusing to forward to insecure LOGGING_TARGET (plaintext HTTP to a non-loopback host): ${target}`,
      );
      return json({ result: 'accepted' }, { status: ACCEPTED });
    }

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
