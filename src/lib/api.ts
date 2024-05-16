import { error, type NumericRange } from '@sveltejs/kit';
import { get as getStore } from 'svelte/store';
import { user as userStore, expired, logout } from '$lib/stores/User';

// TODO: fix any types
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function send({
  method,
  path,
  data,
  token,
}: {
  method: string;
  path: string;
  data?: any; //TODO: Change this
  token?: string
}) {
  if(expired()) {
    logout();
    throw Promise.reject('User session has expired. Please login again.');
  }

  const opts: { method: string; headers: { [key: string]: string }; body?: string } = {
    method,
    headers: {},
  };

  if (data) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }

  const user = getStore(userStore);
  if(token){
    opts.headers['Authorization'] = `Token ${token}`;
  } else if (user?.token) {
    opts.headers['Authorization'] = `Token ${user.token}`;
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

export function get(path: string,) {
  return send({ method: 'GET', path });
}

export function del(path: string) {
  return send({ method: 'DELETE', path });
}

export function post(path: string, data: any) {
  return send({ method: 'POST', path, data });
}

export function put(path: string, data: any) {
  return send({ method: 'PUT', path, data });
}
