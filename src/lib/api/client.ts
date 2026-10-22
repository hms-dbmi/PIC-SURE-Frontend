import { browser } from '$app/env';
import { log, createLog, getSessionId } from '#lib/telemetry/logger.ts';
import { config } from '#lib/config/config.svelte.ts';
import { isWafCaptchaResponse, handleWafCaptcha } from '#lib/api/wafCaptcha.ts';
import { joinUrl } from '#lib/api/paths.ts';
import {
  ApiError,
  CONSENT_DENIED_MESSAGE,
  isAbortError,
  type ApiErrorCode,
} from '#lib/api/errors.ts';
import { sessionHooks } from '#lib/api/sessionHooks.ts';
import {
  acceptSessionRefresh,
  forgetOpenSession,
  isSessionKeyError,
  openSessionToken,
  recoverOpenSession,
} from '#lib/api/openSession.ts';

const BEARER = 'Bearer ';

/**
 * Which credentials a request carries:
 * - `user`: the signed-in user's token; without one the request goes keyless.
 * - `open`: for PIC-SURE data that anonymous visitors may read: the user's token when signed in,
 *   otherwise this browser's open-access session.
 * - `none`: no credentials, even when signed in.
 *
 * A 401 on an `open` request that went without the user's token ends nothing.
 */
export type Auth = 'user' | 'open' | 'none';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Appended to the path as search params; undefined values are left out. */
  query?: Record<string, string | number | boolean | undefined>;
  /** Sent as JSON. A string is sent as it is. */
  body?: unknown;
  headers?: Record<string, string>;
  auth?: Auth;
  signal?: AbortSignal;
  /**
   * For a request that must not reach the session or the page (the public banner feed): it is
   * never cached, never refreshes the token, logs nobody out, reloads nothing, and any failure
   * except an abort resolves undefined. It still carries the credentials `auth` asks for.
   */
  softFail?: boolean;
  /**
   * SvelteKit's fetch, when called from a load running in the browser. Requests need the browser:
   * the credentials live in its storage, and the backend is reached through the page's origin.
   */
  fetch?: typeof fetch;
}

/**
 * Resolves with the parsed body (JSON, else text; an `ArrayBuffer` for octet-stream). An HTTP
 * failure rejects with an `ApiError`; a network failure or an abort rejects as fetch did.
 */
export function request<T>(path: string, opts?: RequestOptions & { softFail?: false }): Promise<T>;
export function request<T>(path: string, opts: RequestOptions): Promise<T | undefined>;
export function request<T>(path: string, opts: RequestOptions = {}): Promise<T | undefined> {
  const sent = send(path, opts) as Promise<T>;
  if (!opts.softFail) return sent;
  return sent.catch((e: unknown) => {
    if (isAbortError(e)) throw e;
    return undefined;
  });
}

async function send(path: string, opts: RequestOptions): Promise<unknown> {
  const { method = 'GET', body, auth = 'user', signal, softFail = false } = opts;
  const doFetch = opts.fetch ?? fetch;
  const init: RequestInit = { method };
  const headers: Record<string, string> =
    body === undefined
      ? { ...opts.headers }
      : { 'Content-Type': 'application/json', ...opts.headers };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  if (softFail) init.cache = 'no-store';

  // an anonymous request with the open-access session as its bearer, if it got one
  let openRequest = false;
  let sessionToken: string | null = null;
  let userToken: string | null = null;
  if (browser) {
    const token = auth === 'user' || auth === 'open' ? sessionHooks().getToken() : null;
    if (token) {
      userToken = token;
      headers['Authorization'] = `${BEARER}${token}`;
      headers['request-source'] = 'Authorized';
    } else {
      headers['request-source'] = 'Open';
      if (auth === 'open') {
        openRequest = true;
        sessionToken = await unlessAborted(openSessionToken(), signal);
        if (sessionToken) {
          headers['Authorization'] = `${BEARER}${sessionToken}`;
          // fetch would re-send the key to wherever a redirect points; data paths never redirect
          init.redirect = 'error';
        }
      }
    }
    headers['X-Session-Id'] = getSessionId();
  }
  init.headers = headers;
  if (signal) init.signal = signal;

  const url = joinUrl(window.location.origin, withQuery(path, opts.query));
  let res = await doFetch(url, init);
  if (openRequest) {
    acceptSessionRefresh(res);
    // a rejected session (expired, or the signing secret rotated) is replaced and retried once;
    // a second failure falls through to the error below
    if (sessionToken && res.status === 401 && isSessionKeyError(await errorType(res))) {
      log(createLog('AUTH', 'open_session.rejected', undefined, { status: 401 }));
      const retryToken = await unlessAborted(recoverOpenSession(sessionToken), signal);
      if (retryToken) {
        res = await doFetch(url, {
          ...init,
          headers: { ...headers, Authorization: `${BEARER}${retryToken}` },
          redirect: 'error',
        });
        acceptSessionRefresh(res);
        if (res.status === 401 && isSessionKeyError(await errorType(res))) {
          forgetOpenSession(retryToken);
        }
      }
    }
  }

  return await handleResponse(res, { path, userToken, openRequest, softFail });
}

function withQuery(path: string, query: RequestOptions['query']): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.append(key, String(value));
  }
  const search = params.toString();
  if (!search) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${search}`;
}

// the shared acquisition carries on for other callers; an aborted caller just stops waiting for it
function unlessAborted<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  const aborted = () =>
    signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
  if (signal.aborted) return Promise.reject(aborted());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(aborted());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

// reads a clone, so handleResponse can still read the body
async function errorType(res: Response): Promise<unknown> {
  try {
    return ((await res.clone().json()) as { errorType?: unknown })?.errorType;
  } catch {
    return undefined;
  }
}

async function handleResponse(
  res: Response,
  {
    path,
    userToken,
    openRequest,
    softFail,
  }: { path: string; userToken: string | null; openRequest: boolean; softFail: boolean },
): Promise<unknown> {
  if (res.ok) {
    if (!softFail) refreshToken(res);
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('application/octet-stream')) {
      return await res.arrayBuffer();
    }
    return parseBody(await res.text());
  }
  if (softFail) return undefined;

  const wafCaptcha = browser && config.features.wafCaptchaRecovery && isWafCaptchaResponse(res);
  if (wafCaptcha && handleWafCaptcha(new URL(res.url).pathname)) {
    // Reload is imminent; never settle so callers don't toast/render for a
    // page that's about to be replaced by the WAF interstitial.
    return new Promise(() => {});
  }

  // a WAF challenge comes from the WAF, not the backend, so it says nothing about the session
  if (!wafCaptcha && res.status === 401 && !openRequest) {
    // not for an anonymous open request: it has no login to end, and logging out would only
    // bounce the visitor to the login page
    log(createLog('AUTH', 'session.unauthorized', undefined, { status: 401 }));
    sessionHooks().onUnauthorized();
    const text = await res.text();
    throw new ApiError(401, 'unauthorized', parseBody(text), text);
  }
  const text = await res.text();
  if (!wafCaptcha && res.status === 403) {
    const body = parseBody(text);
    const consentMessage = consentDenial(body);
    if (consentMessage) throw new ApiError(403, 'consent_denied', body, consentMessage);
    if (userToken && termsRefusal(path, text, body) && sessionHooks().onTermsRefusal(userToken)) {
      log(createLog('AUTH', 'session.terms_required', undefined, { status: 403 }));
      throw new ApiError(403, 'terms_not_accepted', body, text);
    }
    log(createLog('AUTH', 'session.forbidden', undefined, { status: 403 }));
    sessionHooks().onForbidden(userToken);
    throw failure(403, 'forbidden', text);
  }
  throw failure(res.status, 'http', text);
}

function failure(status: number, code: ApiErrorCode, text: string): ApiError {
  log(createLog('ERROR', 'error.unknown', undefined, { status, error: { message: text } }));
  return new ApiError(status, code, parseBody(text), text);
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function consentDenial(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const { errorType, message } = body as { errorType?: unknown; message?: unknown };
  if (errorType !== 'consent_denied') return undefined;
  return typeof message === 'string' && message ? message : CONSENT_DENIED_MESSAGE;
}

/**
 * Whether a 403 may be PSAMA's JWTFilter refusing a user who hasn't accepted the latest terms, which
 * it does on every path except `/tos/accept` with `sendError(403, "User must accept terms of
 * service")`. The servlet container forwards that to Spring Boot's `/error` page, which Spring
 * Security refuses as well, so the 403 normally arrives with an empty body; were `/error` reachable,
 * it would be Spring Boot's error JSON (`timestamp`, `path`), with the message only if configured to.
 * The filter's other refusals (an ended session, a deactivated user) reach the browser the same way,
 * so the session decides (`onTermsRefusal`). PSAMA's controllers refuse with `{ message, content }`.
 */
function termsRefusal(path: string, text: string, body: unknown): boolean {
  const [route] = path.replace(/^\/+/, '').split('?');
  if (!route.startsWith('psama/') || route.endsWith('/tos/accept')) return false;
  if (text.trim() === '' || /must accept terms of service/i.test(text)) return true;
  return typeof body === 'object' && body !== null && 'timestamp' in body && 'path' in body;
}

function refreshToken(res: Response) {
  const header = res.headers.get('Authorization');
  if (header) sessionHooks().onTokenRefreshed(header.replace(BEARER, ''));
}
