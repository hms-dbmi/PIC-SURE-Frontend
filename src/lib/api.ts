import { error, type NumericRange } from '@sveltejs/kit';
import { logout, login } from '$lib/stores/User';
import { browser } from '$app/environment';
import { get as getStore } from 'svelte/store';
import { page } from '$app/stores';

const BEARER = 'Bearer ';

// TODO: fix any types
/* eslint-disable @typescript-eslint/no-explicit-any */
async function send({
  method,
  path,
  data,
  headers,
}: {
  method: string;
  path: string;
  data?: any; //TODO: Change this
  headers?: any;
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

  if (browser) {
    const token = localStorage.getItem('token');
    if (token) {
      opts.headers['Authorization'] = `${BEARER}${token}`;
      opts.headers['request-source'] = 'Authorized';
    }
    if (getStore(page).url.pathname.includes('/discover')) {
      opts.headers['request-source'] = 'Open';
    }
  }

  const res = await fetch(`${window.location.origin}/${path}`, opts);

  return await handleResponse(res);
}

export function get(path: string, headers?: any) {
  return send({ method: 'GET', path, headers });
}

export function del(path: string, headers?: any) {
  return send({ method: 'DELETE', path, headers });
}

export function post(path: string, data: any, headers?: any) {
  return send({ method: 'POST', path, data, headers });
}

export function put(path: string, data: any, headers?: any) {
  return send({ method: 'PUT', path, data, headers });
}

async function handleResponse(res: Response) {
  if (res.ok || res.status === 422) {
    refreshToken(res);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text; //TODO: Change this
    }
  } else if (res.status === 401) {
    logout();
    throw error(401, 'Unauthorized');
  }

  throw error(res.status as NumericRange<400, 599>, await res.text());
}

function refreshToken(res: Response) {
  let newAuthToken = res.headers.get('Authorization');
  if (newAuthToken) {
    newAuthToken = newAuthToken.replace(BEARER, '');
    login(newAuthToken)
  }
}