/**
 * The session's exports from before the Session class (`#lib/auth/session.svelte.ts`), kept for
 * the importers that haven't moved to it yet. Each feature PR moves its own readers; the last one
 * deletes this module.
 */
import { untrack } from 'svelte';
import { toStore, type Readable, type Updater, type Writable } from 'svelte/store';
import type { User } from '#lib/auth/model/user.ts';
import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import { session } from '#lib/auth/session.svelte.ts';

export { getConsents } from '#lib/auth/session.svelte.ts';
export { getTokenExpiration, getTokenExpirationAsDate, isTokenExpired } from '#lib/auth/token.ts';
export { ACCESS_UNAVAILABLE_MESSAGE, showAccessUnavailable } from '#lib/auth/accessUnavailable.ts';

/**
 * A store over session state. Every subscription gets its own `toStore`: a shared one keeps the
 * value from its previous subscription, and a new subscriber would see that stale value if the
 * state had since gone back to what it was when the store was made. Changes reach subscribers
 * when Svelte flushes its effects, not synchronously. Like the functions below, subscribing
 * (and so `get()`) doesn't make the calling effect depend on the session, as stores never did.
 */
function bridge<T>(read: () => T): Readable<T>;
function bridge<T>(read: () => T, write: (value: T) => void): Writable<T>;
function bridge<T>(read: () => T, write?: (value: T) => void): Readable<T> | Writable<T> {
  const subscribe: Readable<T>['subscribe'] = (run, invalidate) =>
    untrack(() => toStore(read).subscribe(run, invalidate));
  if (!write) return { subscribe };
  const update = (updater: Updater<T>) => untrack(() => write(updater(read())));
  return { subscribe, set: write, update };
}

export const tokenStatus: Readable<boolean> = bridge(() => session.isLoggedIn);
export const hasValidToken: Readable<boolean> = bridge(() => session.hasValidToken);
export const user: Writable<User> = bridge(
  () => session.user,
  (value) => (session.user = value),
);
export const isTopAdmin: Readable<boolean> = bridge(() => session.isTopAdmin);
export const consentedStudies: Readable<string[]> = bridge(() => session.consentedStudies);
export const accessUnavailable: Readable<boolean> = bridge(() => session.accessUnavailable);

export function setToken(token: string) {
  session.setToken(token);
}

export function getToken(): string {
  return untrack(() => session.token);
}

export function removeToken() {
  session.removeToken();
}

export function isUserLoggedIn() {
  return untrack(() => session.isLoggedIn);
}

export function getUser(force?: boolean, hasToken = false) {
  return session.loadUser(force, hasToken);
}

export function refreshLongTermToken() {
  return session.refreshLongTermToken();
}

export function consentsSettled() {
  return session.consentsSettled();
}

export function loadConsents() {
  return session.loadConsents();
}

export function ensureConsentsLoaded() {
  return session.ensureConsentsLoaded();
}

export function login(token: string) {
  return session.login(token);
}

export function logout(authProvider?: AuthProvider, redirect = false) {
  return session.logout(authProvider, redirect);
}
