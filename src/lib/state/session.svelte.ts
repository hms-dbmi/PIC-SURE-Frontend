import { browser } from '$app/environment';

let token = $state(browser ? localStorage.getItem('token') || '' : '');
let revision = $state(0);
// Lifecycle callbacks do not participate in rendering.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const listeners = new Set<() => void>();

export const session = {
  get authenticated() {
    return !!token;
  },
  get revision() {
    return revision;
  },
};

export function onSessionChange(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function replaceToken(next: string) {
  if (token === next) return;
  token = next;
  revision++;
  listeners.forEach((listener) => listener());
}

export function getToken() {
  return browser ? localStorage.getItem('token') || '' : '';
}

export function setToken(next: string) {
  localStorage.setItem('token', next);
  replaceToken(next);
}

export function removeToken() {
  localStorage.removeItem('token');
  replaceToken('');
}

// A renewed token belongs to the same session. A late response from an old session
// must not replace the token of someone who has since logged in.
export function renewToken(next: string, previous: string) {
  if (!previous || getToken() !== previous) return;
  localStorage.setItem('token', next);
  token = next;
}

function tokenIdentity(value: string): string | undefined {
  try {
    const payload = value.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const { sub, iss, sid } = JSON.parse(atob(payload));
    if (typeof sub !== 'string' || !sub) return;
    // Include sid when available so another login by the same user still resets access.
    return JSON.stringify([iss, sub, sid]);
  } catch {
    return undefined;
  }
}

if (browser) {
  window.addEventListener('storage', (event) => {
    if (event.key === 'token' || event.key === null) {
      const next = localStorage.getItem('token') || '';
      const identity = tokenIdentity(token);
      if (identity && identity === tokenIdentity(next)) {
        token = next;
      } else {
        replaceToken(next);
      }
    }
  });
}
