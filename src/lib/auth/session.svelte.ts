import { browser } from '$app/env';
import { ApiError } from '#lib/api/errors.ts';
import * as psamaUser from '#lib/api/psama/user.ts';
import { registerSessionHooks } from '#lib/api/sessionHooks.ts';
import { isTopAdmin } from '#lib/auth/access.ts';
import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
import type { ConsentsMap, User } from '#lib/auth/model/user.ts';
import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import {
  LOGOUT_REASON_KEY,
  OKTA_ID_TOKEN_KEY,
  USER_KEY,
  clearToken,
  isTokenExpired,
  onTokenChange,
  readToken,
  tokenValidity,
  writeToken,
} from '#lib/auth/token.ts';
import { log, createLog, registerSignedInUser } from '#lib/telemetry/logger.ts';

/** What the session needs from the app around it. `hooks.client.ts` connects it at startup. */
export interface SessionShell {
  /** Navigates within the app to a path such as `/login?redirectTo=%2Fexplorer`. */
  navigate(path: string): void;
  /** The page on screen, so a user whose session timed out can come back to it. */
  currentUrl(): { pathname: string; search: string };
  /** Tells the user that the studies they may see could not be loaded. */
  showAccessUnavailable(): void;
}

const disconnected: SessionShell = {
  navigate: () => {},
  currentUrl: () => ({ pathname: '/', search: '' }),
  showAccessUnavailable: () => {},
};

// A 401 has already started a logout, which navigates to /login. Callers that retried, toasted
// or navigated on top of it would race that logout.
const sessionEndedBy = (error: unknown) =>
  error instanceof ApiError && error.code === 'unauthorized';

/** Delay before each attempt. Retry once straight away, then back off for a real outage. */
const CONSENTS_RETRY_DELAYS_MS = [0, 0, 3_000];

/**
 * Requires PSAMA to answer 200 with an empty map when a user has no consents; its 500 is
 * indistinguishable from a transient failure. Throws once attempts are exhausted rather than
 * returning `{}` - the dictionary treats an empty list as no filter and returns everything.
 */
export async function getConsents(): Promise<ConsentsMap> {
  for (const [attempt, delay] of CONSENTS_RETRY_DELAYS_MS.entries()) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const res = await psamaUser.consents();
      return res?.consents || {};
    } catch (error) {
      if (sessionEndedBy(error)) throw error;
      if (attempt === CONSENTS_RETRY_DELAYS_MS.length - 1) {
        console.error(`Error fetching user consents after ${attempt + 1} attempts: ` + error);
        throw error;
      }
    }
  }
  throw new Error('unreachable');
}

function restoreUser(): User {
  try {
    const stored = JSON.parse(sessionStorage.getItem(USER_KEY) || '{}');
    if (!stored || Object.keys(stored).length === 0) return {};
    console.log('Restored user from session storage: ', stored);
    return stored;
  } catch (error) {
    console.error('Error reading user from session storage: ' + error);
    return {};
  }
}

/**
 * The signed-in user: their token, profile, privileges and study consents, and logging in and
 * out. Browser-only: on the server it stays signed out.
 */
export class Session {
  #token = $state.raw('');
  #user = $state.raw<User>({});
  #validity = $derived(tokenValidity(this.#token));
  #shell: SessionShell = disconnected;
  #consentsRequest: Promise<void> = Promise.resolve();
  // A 401 or 403 from PSAMA's logout call makes the API client start another logout, which would
  // navigate to /login a second time, so later calls share the logout already running.
  #pendingLogout: Promise<void> | undefined;

  constructor() {
    if (!browser) return;

    const token = readToken();
    if (token && isTokenExpired(token)) {
      console.log('Clearing expired token from storage.');
      clearToken();
      localStorage.removeItem(OKTA_ID_TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      log(createLog('AUTH', 'session.expired'));
    } else {
      this.#token = token;
      this.#user = restoreUser();
    }
    this.#saveUser();
    onTokenChange((stored) => (this.#token = stored));
  }

  connect(shell: SessionShell) {
    this.#shell = shell;
  }

  /** The session JWT; `''` when signed out. */
  get token() {
    return this.#token;
  }

  get isLoggedIn() {
    return this.#token !== '';
  }

  /** Signed in with a token that hasn't expired yet. */
  get hasValidToken() {
    return this.#validity.valid;
  }

  // The profile lives in sessionStorage, so each tab has its own and a logout or a privilege
  // change in one tab can't leave stale admin data in another. The token is in localStorage
  // because a new tab needs to know the user is already signed in.
  get user() {
    return this.#user;
  }

  set user(user: User) {
    this.#user = user;
    this.#saveUser();
  }

  get privileges(): string[] {
    return this.#user.privileges ?? [];
  }

  get isTopAdmin() {
    return isTopAdmin(this.#user);
  }

  /**
   * `\_consents\` is the complete grant list; the harmonized and topmed keys are subsets the
   * backend uses to authorize queries. Token-gated, so a logout in another tab cannot leave a
   * restored sessionStorage blob reporting access the user no longer has.
   */
  get consentedStudies(): string[] {
    return this.isLoggedIn ? (this.#user.consents?.['\\_consents\\'] ?? []) : [];
  }

  /**
   * Unknown access, not absent access: `{}` is loaded-with-none, missing is unknown.
   * Derived from the profile because it persists to sessionStorage and a flag would not: a
   * reload skips re-hydrating, so a flag would reset to "fine" and fail open again.
   */
  get accessUnavailable() {
    return this.isLoggedIn && this.#user.consents === undefined;
  }

  setToken(token: string) {
    writeToken(token);
    this.#token = token;
  }

  removeToken() {
    clearToken();
    this.#token = '';
  }

  /** Clears all client-side session state. */
  clear() {
    this.#discardPendingConsents();
    this.removeToken();
    localStorage.removeItem(OKTA_ID_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.user = {};
  }

  /** Fetches the profile unless it's already here; `hasToken` also refreshes the long-term token. */
  async loadUser(force?: boolean, hasToken = false) {
    if (force || !this.#user.privileges || !this.#user.token) {
      try {
        const res = await psamaUser.me({ hasToken });
        this.user = { ...this.#user, ...res };
      } catch (error) {
        if (!sessionEndedBy(error)) throw error;
      }
    }
  }

  async refreshLongTermToken() {
    const response = await psamaUser.refreshLongTermToken();
    if (!response.userLongTermToken) {
      throw new Error('No user token was returned.');
    }
    this.user = { ...this.#user, token: response.userLongTermToken };
    return response.userLongTermToken;
  }

  /** Resolves once the in-flight access fetch has succeeded or given up. Never rejects. */
  consentsSettled(): Promise<void> {
    return this.#consentsRequest;
  }

  /** Leaves `consents` undefined on failure - see `accessUnavailable`. */
  loadConsents(): Promise<void> {
    this.user = { ...this.#user, consents: undefined };
    const request: Promise<void> = getConsents()
      .then((consents) => {
        if (this.#consentsRequest === request) this.user = { ...this.#user, consents };
      })
      .catch((error: unknown) => {
        if (this.#consentsRequest === request && !sessionEndedBy(error)) {
          this.#shell.showAccessUnavailable();
        }
      });
    this.#consentsRequest = request;
    return request;
  }

  /** Waits for or starts the consent request when access has not been loaded yet. */
  async ensureConsentsLoaded(): Promise<ConsentsMap | undefined> {
    if (this.#user.consents !== undefined) return this.#user.consents;

    await this.consentsSettled();
    if (this.#user.consents === undefined) await this.loadConsents();
    return this.#user.consents;
  }

  #discardPendingConsents() {
    this.#consentsRequest = Promise.resolve();
  }

  /**
   * Fills in the profile from PSAMA for the stored token. Used by the login flow and by the
   * authorized layout when a fresh tab has a valid token but no profile in sessionStorage.
   */
  async hydrate() {
    await this.loadUser(true, false);
    // Not awaited: see loadConsents. Consumers wait on consentsSettled() instead.
    this.loadConsents();
  }

  async login(token: string) {
    if (browser && token) {
      this.setToken(token);
      await this.hydrate();
    }
  }

  logout(authProvider?: AuthProvider, redirect = false): Promise<void> {
    this.#pendingLogout ??= this.#endSession(authProvider, redirect).finally(() => {
      this.#pendingLogout = undefined;
    });
    return this.#pendingLogout;
  }

  async #endSession(authProvider: AuthProvider | undefined, redirect: boolean) {
    this.#discardPendingConsents();
    const logError = (error: unknown) => console.error('Error logging out: ' + error);
    const handleErrors = (error: unknown) => {
      logError(error);
      this.#leave(redirect);
    };

    if (browser && this.#token) {
      // Log only: the provider/redirect handling below always finishes the logout, so
      // handling this failure too would navigate to /login twice.
      await psamaUser.logout().catch(logError);
      this.removeToken();
    }

    if (authProvider) {
      await authProvider
        .logout()
        .then((redirectURL) => {
          log(createLog('AUTH', 'logout.success'));
          if (typeof redirectURL === 'string') {
            this.user = {};
            location.replace(redirectURL);
          } else {
            // If no redirect is provided, go to the login page
            handleErrors(redirectURL);
          }
        })
        .catch(handleErrors);
    } else {
      this.#leave(redirect);
    }
    // Only after the provider's logout: the Okta providers read it for id_token_hint.
    if (browser) localStorage.removeItem(OKTA_ID_TOKEN_KEY);
  }

  #leave(redirect: boolean) {
    this.user = {};
    log(createLog('AUTH', 'logout.success'));
    this.#shell.navigate(redirect ? loginRedirectPath(this.#shell.currentUrl()) : '/login');
  }

  #saveUser() {
    if (!browser) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _, ...userWithoutToken } = this.#user;
    sessionStorage.setItem(USER_KEY, JSON.stringify(userWithoutToken));
  }
}

export const session = new Session();

registerSignedInUser(() => (session.isLoggedIn ? session.user : undefined));

registerSessionHooks({
  getToken: () => session.token,
  onUnauthorized: () => {
    if (browser)
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'Your session has timed out. Please log in.');
    session.logout(undefined, true);
  },
  onForbidden: () => {
    if (browser) sessionStorage.removeItem(LOGOUT_REASON_KEY);
    session.logout(undefined, false);
  },
  onTokenRefreshed: (token) => {
    // Nobody awaits this: the response that carried the token has already been handled.
    session.login(token).catch((error: unknown) => {
      console.error('Error reloading the user after a token refresh: ' + error);
    });
  },
});
