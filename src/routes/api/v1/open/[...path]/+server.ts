import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/**
 * Server-side proxy for anonymous (token-less) open-access data requests. api.ts routes them
 * here so the deployment's PLATFORM API key can be attached without the key ever reaching the
 * browser. Only the PIC-SURE data API is reachable through it — this must not become an open
 * relay carrying the platform key to arbitrary upstream paths.
 */
// warn once, not per request: with the key unset every anonymous request would repeat it
let warnedMissingKey = false;

const forward: RequestHandler = async ({ request, params, url, getClientAddress }) => {
  // multi-host deployments don't serve the API from the frontend host over plain HTTP,
  // so the internal origin must be wireable per deployment
  const upstreamOrigin = env.PICSURE_INTERNAL_API_ORIGIN || 'http://localhost';
  // Resolve the target first, then validate its NORMALIZED pathname: checking the raw param
  // while fetching a string-concatenated URL is a parser differential — "picsure/../psama" (or
  // its %2e%2e form, which SvelteKit decodes) passes a raw startsWith check but resolves to a
  // non-picsure upstream, letting a caller reach other internal services with the platform key.
  const target = new URL(`${upstreamOrigin}/${params.path}`);
  if (target.pathname !== '/picsure' && !target.pathname.startsWith('/picsure/')) {
    error(404, 'Not found');
  }
  target.search = url.search;

  if (!env.PICSURE_PLATFORM_API_KEY && !warnedMissingKey) {
    warnedMissingKey = true;
    console.error('[open-proxy] PICSURE_PLATFORM_API_KEY not set; forwarding without an API key');
  }

  const headers: Record<string, string> = {};
  // forward only the trusted client address: the incoming X-Forwarded-For header is
  // caller-controlled, and preserving it would let requests falsify their audit attribution
  headers['X-Forwarded-For'] = getClientAddress();
  headers['X-Forwarded-Host'] = url.host;
  const contentType = request.headers.get('Content-Type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const accept = request.headers.get('Accept');
  if (accept) {
    headers['Accept'] = accept;
  }
  const sessionId = request.headers.get('X-Session-Id');
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  const requestSource = request.headers.get('request-source');
  if (requestSource) {
    headers['request-source'] = requestSource;
  }
  if (env.PICSURE_PLATFORM_API_KEY) {
    headers['X-PICSURE-API-Key'] = env.PICSURE_PLATFORM_API_KEY;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
      // never auto-follow: fetch re-sends X-PICSURE-API-Key on redirects, even cross-origin,
      // which would hand the platform key to an arbitrary Location target
      redirect: 'manual',
    });
  } catch (err) {
    console.error('[open-proxy] Network error reaching upstream:', err);
    error(502, 'Upstream unavailable');
  }

  // open-access data endpoints do not redirect; a 3xx here is unexpected and the key was not
  // re-sent, so surface it as a gateway error rather than a broken Location-less response
  if (upstream.status >= 300 && upstream.status < 400) {
    console.error(`[open-proxy] Unexpected upstream redirect (${upstream.status}); not following`);
    error(502, 'Upstream unavailable');
  }

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get('Content-Type');
  if (upstreamContentType) {
    responseHeaders.set('Content-Type', upstreamContentType);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};

// only the methods token-less UI traffic actually uses; widening this widens the credentialed surface
export const GET = forward;
export const POST = forward;
