import { joinUrl, Psama } from '$lib/paths';
import { log, createLog, getSessionId } from '$lib/logger';

/**
 * Open-access sessions: a short-lived PSAMA-signed token each anonymous browser gets for itself and
 * sends as its bearer token, so anonymous traffic never carries the deployment's PLATFORM key. The token
 * lives in localStorage and is read fresh on every call, so a refresh in one tab reaches the others.
 */

export const SESSION_REFRESH_HEADER = 'X-PICSURE-Session-Refresh';
// the gateway's 401 error codes for "the key was the problem"; any other 401 is the access rules
const KEY_ERRORS = new Set(['api_key_invalid', 'api_key_missing']);

const STORAGE_KEY = 'open-session';
const TOKEN_PREFIX = 'picsure_s_';

interface SessionClaims {
  sub: string;
  exp: number;
  iat?: number;
}

let acquisition: Promise<string | null> | undefined;
// set when PSAMA answers 404: sessions are off here, or PSAMA predates them. Lasts for the page
let unavailable = false;
// PSAMA's clock minus this browser's, learned from the iat of the last token PSAMA handed over. A
// browser clock running fast would otherwise see every fresh token as already expired
let clockSkewMs = 0;

// decoded without verification, only to decide whether to renew or keep a refresh; PSAMA verifies
export function decodeSession(token: string | null | undefined): SessionClaims | undefined {
  if (!token?.startsWith(TOKEN_PREFIX)) return undefined;
  const payload = token.slice(TOKEN_PREFIX.length).split('.')[1];
  if (!payload) return undefined;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as Partial<SessionClaims>;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') return undefined;
    return {
      sub: claims.sub,
      exp: claims.exp,
      iat: typeof claims.iat === 'number' ? claims.iat : undefined,
    };
  } catch {
    return undefined;
  }
}

function storedToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

// storage can refuse a write (quota, a locked-down browser); the request then just goes without
function store(token: string, claims: SessionClaims) {
  if (claims.iat !== undefined) clockSkewMs = claims.iat * 1000 - Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    log(createLog('AUTH', 'open_session.storage_failed'));
  }
}

function isLive(token: string | null): token is string {
  const claims = decodeSession(token);
  return !!claims && claims.exp * 1000 > Date.now() + clockSkewMs;
}

/**
 * The token to send with an anonymous data request, acquiring one first if none is stored or the
 * stored one has expired. Null when sessions are unavailable or acquisition failed; the request then
 * goes out keyless, as before sessions existed.
 */
export async function openSessionToken(): Promise<string | null> {
  if (unavailable) return null;
  const token = storedToken();
  if (isLive(token)) return token;
  return acquire();
}

// single-flight: every caller waiting on a new session shares one POST
function acquire(): Promise<string | null> {
  acquisition ??= requestSession().finally(() => {
    acquisition = undefined;
  });
  return acquisition;
}

async function requestSession(): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(joinUrl(window.location.origin, Psama.Open.Session), {
      method: 'POST',
      headers: { 'request-source': 'Open', 'X-Session-Id': getSessionId() },
      redirect: 'error',
    });
  } catch {
    log(createLog('AUTH', 'open_session.unreachable'));
    return null;
  }
  if (res.status === 404) {
    unavailable = true;
    return null;
  }
  if (!res.ok) {
    log(createLog('AUTH', 'open_session.refused', undefined, { status: res.status }));
    return null;
  }
  const token = ((await res.json().catch(() => undefined)) as { token?: unknown } | undefined)
    ?.token;
  const claims = typeof token === 'string' ? decodeSession(token) : undefined;
  if (typeof token !== 'string' || !claims) return null;
  store(token, claims);
  return token;
}

/**
 * Keeps a refreshed token from the gateway only if it continues the stored session: same session id
 * and a later expiry. A delayed refresh for a session already replaced, or one older than what is
 * stored, is dropped. With nothing stored it is dropped too; the next request acquires.
 */
export function acceptSessionRefresh(res: Response): void {
  const refreshed = res.headers.get(SESSION_REFRESH_HEADER);
  const next = decodeSession(refreshed);
  const current = decodeSession(storedToken());
  if (!refreshed || !next || !current) return;
  if (next.sub !== current.sub || next.exp <= current.exp) return;
  store(refreshed, next);
}

export function isSessionKeyError(errorType: unknown): boolean {
  return typeof errorType === 'string' && KEY_ERRORS.has(errorType);
}

/**
 * After a key-caused 401 for a request that sent `sent`: the token to retry with, or null to
 * give up. Deletes the stored token only if it is still the one that failed, so a late 401 never
 * wipes a session another request has just acquired; if a different live token is stored, that one
 * is reused without acquiring.
 */
export async function recoverOpenSession(sent: string): Promise<string | null> {
  const current = storedToken();
  if (current !== sent && isLive(current)) return current;
  if (current === sent) localStorage.removeItem(STORAGE_KEY);
  if (unavailable) return null;
  return acquire();
}

/**
 * The retry's own token was rejected too. Forget it (if still stored) so the next request acquires
 * instead of sending a token already known to fail.
 */
export function forgetOpenSession(rejected: string): void {
  if (storedToken() === rejected) localStorage.removeItem(STORAGE_KEY);
}
