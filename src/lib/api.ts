import { error, type NumericRange } from '@sveltejs/kit';
import { logout, login } from '$lib/stores/User';
import { browser } from '$app/environment';
import { log, createLog } from '$lib/logger';

const BEARER = 'Bearer ';

// TODO: fix any types
/* eslint-disable @typescript-eslint/no-explicit-any */
async function send({
  method,
  path,
  data,
  headers,
  authenticate = true,
}: {
  method: string;
  path: string;
  data?: any; //TODO: Change this
  headers?: any;
  authenticate?: boolean;
}) {
  const opts: { method: string; headers: { [key: string]: string }; body?: string } = {
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

  if (authenticate && browser) {
    const token = localStorage.getItem('token');
    if (token) {
      opts.headers['Authorization'] = `${BEARER}${token}`;
      opts.headers['request-source'] = 'Authorized';
    } else {
      opts.headers['request-source'] = 'Open';
    }
  }

  const res = await fetch(`${window.location.origin}/${path}`, opts);

  return await handleResponse(res);
}

export function get(path: string, headers?: any, authenticate?: boolean) {
  return send({ method: 'GET', path, headers, authenticate });
}

export function del(path: string, headers?: any, authenticate?: boolean) {
  return send({ method: 'DELETE', path, headers, authenticate });
}

export function post(path: string, data: any, headers?: any, authenticate?: boolean) {
  return send({ method: 'POST', path, data, headers, authenticate });
}

export function put(path: string, data: any, headers?: any, authenticate?: boolean) {
  return send({ method: 'PUT', path, data, headers, authenticate });
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
    } catch (e) {
      return text; //TODO: Change this
    }
  } else if (res.status === 401) {
    log(createLog('AUTH', 'session.unauthorized'));
    browser &&
      sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in.');
    logout(undefined, true);
    return;
  } else if (res.status === 403) {
    if (browser) {
      sessionStorage.removeItem('logout-reason');
      sessionStorage.removeItem('filters');
    }
    logout(undefined, false);
  }
  const resText = await res.text();
  log(createLog('ERROR', 'error.unknown', undefined, { status: res.status, error: { message: resText}}));
  error(res.status as NumericRange<400, 599>, resText);
}

function refreshToken(res: Response) {
  let newAuthToken = res.headers.get('Authorization');
  if (newAuthToken) {
    newAuthToken = newAuthToken.replace(BEARER, '');
    login(newAuthToken);
  }
}
