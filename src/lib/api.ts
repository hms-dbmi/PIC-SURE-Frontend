import { error, type NumericRange } from '@sveltejs/kit';

async function send({
  method,
  path,
  token,
  data
}: {
  method: string;
  path: string;
  token: string;
  data?: any; //TODO: Change this
}) {
  const opts: { method: string; headers: { [key: string]: string }; body?: string } = {
    method,
    headers: {}
  };

  if (data) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }

  if (sessionStorage.token) {
    token = sessionStorage.token;
  }

  if (token) {
    opts.headers['Authorization'] = `Token ${token}`;
  }

  console.debug('fetching', `${window.location.origin}/${path}`, opts);
  const res = await fetch(`${window.location.origin}${path}`, opts);
  if (res.ok || res.status === 422) {
    const text = await res.text();
    console.log('text', text);
    try {
      return JSON.parse(text);
    } catch (e) {
      return text; //TODO: Change this
    }
  }

  throw error(res.status as NumericRange<400, 599>, await res.text());
}

export function get(path: string, token: string) {
  return send({ method: 'GET', path, token });
}

export function del(path: string, token: string) {
  return send({ method: 'DELETE', path, token });
}

export function post(path: string, token: string, data: any) {
  return send({ method: 'POST', path, token, data });
}

export function put(path: string, token: string, data: any) {
  return send({ method: 'PUT', path, token, data });
}
