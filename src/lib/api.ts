import { error, isHttpError, type NumericRange } from '@sveltejs/kit';
import { logout, login } from '$lib/stores/User';
import { browser } from '$app/environment';
import { log, createLog, getSessionId } from '$lib/logger';
import { config } from '$lib/configuration.svelte';
import { isWafCaptchaResponse, handleWafCaptcha } from '$lib/wafCaptcha';
import { joinUrl } from '$lib/paths';
import {
  API_KEY_HEADER,
  acceptSessionRefresh,
  forgetOpenSession,
  isSessionKeyError,
  openSessionToken,
  recoverOpenSession,
} from '$lib/openSession';

const BEARER = 'Bearer ';
const CONSENT_DENIED = 'consent_denied';
export const CONSENT_DENIED_MESSAGE = 'You no longer have consent for this saved result';

export type RequestOptions = { signal?: AbortSignal };

export function isAbortError(e: unknown): boolean {
  return (e as Error | undefined)?.name === 'AbortError';
}

// HttpError carries its text at body.message; it has no message of its own.
export function consentDeniedMessage(e: unknown): string | undefined {
  return isHttpError(e, 403) && e.body.errorType === CONSENT_DENIED ? e.body.message : undefined;
}

// TODO: fix any types
/* eslint-disable @typescript-eslint/no-explicit-any */
async function send({
  method,
  path,
  data,
  headers,
  authenticate = true,
  options,
}: {
  method: string;
  path: string;
  data?: any; //TODO: Change this
  headers?: any;
  authenticate?: boolean;
  options?: RequestOptions;
}) {
  const opts: {
    method: string;
    headers: { [key: string]: string };
    body?: string;
    signal?: AbortSignal;
    redirect?: RequestRedirect;
  } = {
    method,
    headers: {},
  };

  if (data) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  if (headers) {
    opts.headers = { ...opts.headers, ...headers };
  }

  // a token-less data request: no stored token, or authenticate:false (a logged-in user querying
  // the open variant). It carries this browser's open-access session, never a bearer. Non-picsure
  // paths (e.g. psama key generation) get no session
  let openRequest = false;
  let sessionToken: string | null = null;
  if (browser) {
    const token = authenticate ? localStorage.getItem('token') : null;
    if (token) {
      opts.headers['Authorization'] = `${BEARER}${token}`;
      opts.headers['request-source'] = 'Authorized';
    } else {
      opts.headers['request-source'] = 'Open';
      if (path.startsWith('picsure/')) {
        openRequest = true;
        sessionToken = await unlessAborted(openSessionToken(), options?.signal);
        if (sessionToken) {
          opts.headers[API_KEY_HEADER] = sessionToken;
          // fetch would re-send the key to wherever a redirect points; data paths never redirect
          opts.redirect = 'error';
        }
      }
    }
    opts.headers['X-Session-Id'] = getSessionId();
  }

  if (options?.signal) {
    opts.signal = options.signal;
  }

  const url = joinUrl(window.location.origin, path);
  let res = await fetch(url, opts);
  if (openRequest) {
    acceptSessionRefresh(res);
    // a rejected session (expired, or the signing secret rotated) is replaced and retried once;
    // a second failure falls through to the error below
    if (sessionToken && res.status === 401 && isSessionKeyError(await errorType(res))) {
      log(createLog('AUTH', 'open_session.rejected', undefined, { status: 401 }));
      const retryToken = await unlessAborted(recoverOpenSession(sessionToken), options?.signal);
      if (retryToken) {
        res = await fetch(url, {
          ...opts,
          headers: { ...opts.headers, [API_KEY_HEADER]: retryToken },
          redirect: 'error',
        });
        acceptSessionRefresh(res);
        if (res.status === 401 && isSessionKeyError(await errorType(res))) {
          forgetOpenSession(retryToken);
        }
      }
    }
  }

  return await handleResponse(res, openRequest);
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

export function get(path: string, headers?: any, authenticate?: boolean, options?: RequestOptions) {
  return send({ method: 'GET', path, headers, authenticate, options });
}

export function del(path: string, headers?: any, authenticate?: boolean, options?: RequestOptions) {
  return send({ method: 'DELETE', path, headers, authenticate, options });
}

export function post(
  path: string,
  data: any,
  headers?: any,
  authenticate?: boolean,
  options?: RequestOptions,
) {
  return send({ method: 'POST', path, data, headers, authenticate, options });
}

export function put(
  path: string,
  data: any,
  headers?: any,
  authenticate?: boolean,
  options?: RequestOptions,
) {
  return send({ method: 'PUT', path, data, headers, authenticate, options });
}

export function patch(path: string, data: any, headers?: any, authenticate?: boolean) {
  return send({ method: 'PATCH', path, data, headers, authenticate });
}

async function handleResponse(res: Response, openRequest = false) {
  if (res.ok || res.status === 422) {
    refreshToken(res);
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('application/octet-stream')) {
      return await res.arrayBuffer();
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text; //TODO: Change this
    }
  } else if (browser && config.features.wafCaptchaRecovery && isWafCaptchaResponse(res)) {
    if (handleWafCaptcha(new URL(res.url).pathname)) {
      // Reload is imminent; never settle so callers don't toast/render for a
      // page that's about to be replaced by the WAF interstitial.
      return new Promise(() => {});
    }
    // Loop guard tripped: deliberately fall through to the normal error path.
  } else if (res.status === 401 && openRequest) {
    // an anonymous data request has no login to end: logging out would only bounce the visitor to
    // the login page, or sign out a logged-in user querying the open variant
    fail(res.status, await res.text());
  } else if (res.status === 401) {
    log(createLog('AUTH', 'session.unauthorized', undefined, { status: 401 }));
    browser &&
      sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in.');
    logout(undefined, true);
    return;
  } else if (res.status === 403) {
    const resText = await res.text();
    const consentMessage = parseConsentDenial(resText);
    if (consentMessage) {
      error(res.status, { message: consentMessage, errorType: CONSENT_DENIED });
    }
    log(createLog('AUTH', 'session.forbidden', undefined, { status: 403 }));
    if (browser) {
      sessionStorage.removeItem('logout-reason');
      sessionStorage.removeItem('filters');
    }
    logout(undefined, false);
    fail(res.status, resText);
  }

  fail(res.status, await res.text());
}

function fail(status: number, resText: string): never {
  log(createLog('ERROR', 'error.unknown', undefined, { status, error: { message: resText } }));
  error(status as NumericRange<400, 599>, resText);
}

function parseConsentDenial(responseBody: string): string | undefined {
  try {
    const body = JSON.parse(responseBody) as { errorType?: string; message?: string };
    return body.errorType === CONSENT_DENIED ? body.message || CONSENT_DENIED_MESSAGE : undefined;
  } catch {
    return undefined;
  }
}

function refreshToken(res: Response) {
  let newAuthToken = res.headers.get('Authorization');
  if (newAuthToken) {
    newAuthToken = newAuthToken.replace(BEARER, '');
    login(newAuthToken);
  }
}
