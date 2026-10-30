import { LOGIN_STATE_KEY } from '#lib/auth/token.ts';

/**
 * A login callback that doesn't belong to a login this tab started. `missing`: the tab has no
 * login in progress (an old tab, or a callback opened in a new one), so the visitor starts again.
 * `mismatch`: the callback carries another attempt's `state`, or a forged one (login CSRF).
 */
export class LoginStateError extends Error {
  constructor(readonly problem: 'missing' | 'mismatch') {
    super(`Login state ${problem}`);
    this.name = 'LoginStateError';
  }
}

const STATE_BYTES = 32;
// Okta and RAS used to keep one state in localStorage for every login until logout.
const LEGACY_LOCAL_STATE_KEYS = ['oauthState', 'state'];

/** A fresh `state` for the authorize URL of a new login, kept in this tab until its callback. */
export function newLoginState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(STATE_BYTES));
  const state = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(LOGIN_STATE_KEY, state);
  try {
    for (const key of LEGACY_LOCAL_STATE_KEYS) localStorage.removeItem(key);
  } catch {
    // Without localStorage there is no old state to remove, and the login goes on.
  }
  return state;
}

/**
 * Throws `LoginStateError` unless `received` is the `state` of the login this tab started. That
 * login ends either way, so its callback can't be used twice.
 */
export function verifyLoginState(received: string | undefined): void {
  const expected = sessionStorage.getItem(LOGIN_STATE_KEY);
  sessionStorage.removeItem(LOGIN_STATE_KEY);
  if (!expected) throw new LoginStateError('missing');
  if (!received || !sameString(expected, received)) throw new LoginStateError('mismatch');
}

// Looks at every character, so the time taken doesn't tell how much of the state matched.
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
