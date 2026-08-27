import { error, type NumericRange } from '@sveltejs/kit';
import { logout, login } from '$lib/stores/User';
import { browser } from '$app/environment';
import { log, createLog, getSessionId } from '$lib/logger';
import { config } from '$lib/configuration.svelte';
import { isWafCaptchaResponse, handleWafCaptcha } from '$lib/wafCaptcha';

const BEARER = 'Bearer ';

export type RequestOptions = { signal?: AbortSignal };

export function isAbortError(e: unknown): boolean {
  return (e as Error | undefined)?.name === 'AbortError';
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

  if (browser) {
    const token = authenticate ? localStorage.getItem('token') : null;
    if (token) {
      opts.headers['Authorization'] = `${BEARER}${token}`;
      opts.headers['request-source'] = 'Authorized';
    } else {
      opts.headers['request-source'] = 'Open';
    }
    opts.headers['X-Session-Id'] = getSessionId();
  }

  if (options?.signal) {
    opts.signal = options.signal;
  }

  const res = await fetch(`${window.location.origin}/${path}`, opts);

  return await handleResponse(res);
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

async function handleResponse(res: Response) {
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
  } else if (res.status === 401) {
    log(createLog('AUTH', 'session.unauthorized', undefined, { status: 401 }));
    browser &&
      sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in.');
    logout(undefined, true);
    return;
  } else if (res.status === 403) {
    log(createLog('AUTH', 'session.forbidden', undefined, { status: 403 }));
    if (browser) {
      sessionStorage.removeItem('logout-reason');
      sessionStorage.removeItem('filters');
    }
    logout(undefined, false);
  }
  const resText = await res.text();
  log(
    createLog('ERROR', 'error.unknown', undefined, {
      status: res.status,
      error: { message: resText },
    }),
  );
  error(res.status as NumericRange<400, 599>, resText);
}

function refreshToken(res: Response) {
  let newAuthToken = res.headers.get('Authorization');
  if (newAuthToken) {
    newAuthToken = newAuthToken.replace(BEARER, '');
    login(newAuthToken);
  }
}
