/**
 * How the API client reaches the signed-in session without importing it. The session module
 * registers these when it loads; until then every request goes as an anonymous visitor.
 */
export interface SessionHooks {
  /** The signed-in user's bearer token; empty or null when nobody is signed in. */
  getToken(): string | null;
  /** A 401 rejected the user's token: end the session and send them back to log in. */
  onUnauthorized(): void;
  /** A 403 that isn't a consent denial: end the session. */
  onForbidden(): void;
  /** A successful response carried a refreshed token in its Authorization header. */
  onTokenRefreshed(token: string): void;
}

const anonymous: SessionHooks = {
  getToken: () => null,
  onUnauthorized: () => {},
  onForbidden: () => {},
  onTokenRefreshed: () => {},
};

let hooks = anonymous;

export function registerSessionHooks(next: SessionHooks): void {
  hooks = next;
}

export function sessionHooks(): SessionHooks {
  return hooks;
}
