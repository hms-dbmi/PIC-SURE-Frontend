import { error, type NumericRange } from '@sveltejs/kit';
import { browser } from '$app/environment';

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
    opts.body = JSON.stringify(data);
  }

  if (headers) {
    opts.headers = { ...opts.headers, ...headers };
  }

  if (browser) {
    const token = sessionStorage.getItem('token');
    if (token) {
      opts.headers['Authorization'] = `Token ${token}`;
    }
  }

  const res = await fetch(`${window.location.origin}/${path}`, opts);
  if (res.ok || res.status === 422) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text; //TODO: Change this
    }
  }

  throw error(res.status as NumericRange<400, 599>, await res.text());
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
