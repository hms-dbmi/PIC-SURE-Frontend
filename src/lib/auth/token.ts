import { browser } from '$app/env';
import { createSubscriber } from 'svelte/reactivity';
import { log, createLog } from '#lib/telemetry/logger.ts';

// Storage keys are contracts: renaming one signs every user out, and the e2e fixtures seed them.
/** localStorage: the session JWT. In localStorage so a new tab starts signed in. */
export const TOKEN_KEY = 'token';
/** localStorage: the Okta ID token, which the Okta logout URL sends as its `id_token_hint`. */
export const OKTA_ID_TOKEN_KEY = 'oktaIdToken';
/** sessionStorage: the user profile without its long-term token, scoped to the tab. */
export const USER_KEY = 'user';
/** sessionStorage: why the user was sent to the login page, shown there once. */
export const LOGOUT_REASON_KEY = 'logout-reason';

/** The stored session token, or `''` when there is none (always on the server). */
export function readToken(): string {
  if (!browser) return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function writeToken(token: string): void {
  if (browser) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (browser) localStorage.removeItem(TOKEN_KEY);
}

/** Calls `listener` with the stored token whenever another tab stores, removes or clears it. */
export function onTokenChange(listener: (token: string) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    // a null key means the other tab cleared all of localStorage
    if (event.key === TOKEN_KEY || event.key === null) listener(readToken());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/**
 * The claims of a JWT, read without verifying the signature (the server verifies). Segments are
 * unpadded base64url over UTF-8: atob accepts the missing padding but not `-` or `_`, and returns
 * one character per byte, hence the alphabet translation and the TextDecoder.
 * Throws if the payload is missing or isn't base64url-encoded JSON.
 */
export function decodeJwtPayload(token: string): unknown {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Token has no payload.');
  const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** The token's `sub` claim: who it signs in. `undefined` when it has none or can't be read. */
export function tokenSubject(token: string): string | undefined {
  try {
    const payload = decodeJwtPayload(token);
    return payload && typeof payload === 'object' && 'sub' in payload
      ? String((payload as { sub: unknown }).sub)
      : undefined;
  } catch {
    return undefined;
  }
}

/** When the token expires, in epoch milliseconds. Throws if it has no finite `exp` claim. */
export function getTokenExpiration(token: string) {
  if (!token) {
    throw new Error('No token provided.');
  }
  let payload: unknown;
  try {
    payload = decodeJwtPayload(token);
  } catch (error) {
    throw new Error('Error parsing token: ' + error, { cause: error });
  }

  const expirationSeconds =
    payload && typeof payload === 'object' && 'exp' in payload
      ? (payload as { exp: unknown }).exp
      : undefined;
  if (typeof expirationSeconds !== 'number' || !Number.isFinite(expirationSeconds)) {
    throw new Error('Token expiration must be a finite number.');
  }

  const expirationMilliseconds = expirationSeconds * 1000;
  if (!Number.isFinite(expirationMilliseconds)) {
    throw new Error('Token expiration must be a finite number.');
  }
  return expirationMilliseconds;
}

/** True for an expired token, and for one that can't be read. */
export function isTokenExpired(token: string) {
  try {
    return getTokenExpiration(token) < new Date().getTime();
  } catch (error) {
    console.error('Error checking token expiration: ' + error);
    log(createLog('AUTH', 'token.parse_error', { error: String(error) }));
    return true;
  }
}

export function getTokenExpirationAsDate(token: string) {
  try {
    return new Date(getTokenExpiration(token));
  } catch (error) {
    console.error('Error getting token expiration as date: ' + error);
    return undefined;
  }
}

// setTimeout overflows and fires at once past this many milliseconds (about 24.8 days)
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Whether `token` is present and unexpired. Reactive: an effect that reads `valid` runs again
 * when the token expires. The expiry timer runs only while an effect reads it.
 */
export function tokenValidity(token: string): { readonly valid: boolean } {
  const expiresAt = token && !isTokenExpired(token) ? getTokenExpiration(token) : undefined;
  const watchExpiry = createSubscriber((expired) => {
    if (expiresAt === undefined) return;
    let timer: ReturnType<typeof setTimeout>;
    const wait = () => {
      const remaining = expiresAt - Date.now() + 1;
      timer = setTimeout(
        () => (Date.now() > expiresAt ? expired() : wait()),
        Math.min(Math.max(remaining, 1), MAX_TIMEOUT_MS),
      );
    };
    wait();
    return () => clearTimeout(timer);
  });

  return {
    get valid() {
      watchExpiry();
      return expiresAt !== undefined && Date.now() <= expiresAt;
    },
  };
}
