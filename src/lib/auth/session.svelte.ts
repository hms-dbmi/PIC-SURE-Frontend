import { untrack } from 'svelte';
import { browser } from '$app/env';
import { ApiError } from '#lib/api/errors.ts';
import * as psamaUser from '#lib/api/psama/user.ts';
import { registerSessionHooks } from '#lib/api/sessionHooks.ts';
import { asksForTerms, awaitsTerms } from '#lib/auth/access.ts';
import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
import { isTopAdmin, type ConsentsMap, type User } from '#lib/auth/model/user.ts';
import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import {
  LOGOUT_REASON_KEY,
  OKTA_ID_TOKEN_KEY,
  USER_KEY,
  clearToken,
  isTokenExpired,
  onTokenChange,
  readToken,
  tokenSubject,
  tokenValidity,
  writeToken,
} from '#lib/auth/token.ts';
import { config } from '#lib/config/config.svelte.ts';
import { log, createLog, registerSignedInUser } from '#lib/telemetry/logger.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

/** What the session needs from the app around it. `hooks.client.ts` connects it at startup. */
export interface SessionShell {
  /**
   * Navigates within the app to a path such as `/login?redirectTo=%2Fexplorer`. Settles once the
   * navigation has, or never when it falls back to loading the page.
   */
  navigate(path: string): Promise<void>;
  /** The page on screen, so a user whose session timed out can come back to it. */
  currentUrl(): { pathname: string; search: string };
  /** Tells the user that the studies they may see could not be loaded. */
  showAccessUnavailable(): void;
}

const disconnected: SessionShell = {
  navigate: async () => {},
  currentUrl: () => ({ pathname: '/', search: '' }),
  showAccessUnavailable: () => {},
};

// A 401 has already started a logout, which navigates to /login. Callers that retried, toasted
// or navigated on top of it would race that logout.
const sessionEndedBy = (error: unknown) =>
  error instanceof ApiError && error.code === 'unauthorized';

// PSAMA refuses the user until they accept the terms, and the terms dialog is asking them to.
// Retrying or reporting the failure won't help before then.
const awaitingTerms = (error: unknown) =>
  error instanceof ApiError && error.code === 'terms_not_accepted';

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
      if (sessionEndedBy(error) || awaitingTerms(error)) throw error;
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
  /** Tokens of this session that a refresh has replaced since it began. */
  #refreshedFrom: string[] = [];
  #user = $state.raw<User>({});
  #validity = $derived(tokenValidity(this.#token));
  #shell: SessionShell = disconnected;
  #consentsRequest: Promise<void> = Promise.resolve();
  // Bumped when the session ends, so profile and long-term token responses requested before
  // then are dropped.
  #generation = 0;
  // The bootstrap for one token: a profile request, or nothing when the tab had what it needed.
  #boot: { token: string; done: Promise<void>; failed: boolean } | undefined;
  // A 401 or 403 from PSAMA's logout call makes the API client start another logout, which would
  // navigate to /login a second time, so later calls share the logout already running.
  #pendingLogout: Promise<void> | undefined;
  #endListeners: (() => void)[] = [];
  #deniedListeners: (() => (() => void) | void)[] = [];
  // From a forbidden request until its logout has navigated: what the listeners returned.
  #denial: (() => void)[] | undefined;
  #navigations = 0;

  constructor() {
    if (!browser) return;

    const token = readToken();
    if (token && isTokenExpired(token)) {
      console.log('Clearing expired token from storage.');
      this.clear();
      log(createLog('AUTH', 'session.expired'));
    } else {
      this.#assignToken(token);
      this.user = restoreUser();
    }
    onTokenChange((stored) => {
      // Another tab signed out, or signed in as someone else: this tab's profile isn't theirs.
      // A refresh keeps the subject, and the profile.
      if (!stored || tokenSubject(stored) !== tokenSubject(this.#token)) {
        this.#forgetPendingRequests();
        this.user = {};
      }
      this.#assignToken(stored);
      if (stored) this.bootstrap();
    });
  }

  /**
   * Runs `listener` each time the session ends or another user's token replaces it, so caches of
   * what the user could see (admin lists, counts, datasets) are dropped before someone else signs
   * in. Returns the unsubscribe.
   */
  onEnd(listener: () => void): () => void {
    this.#endListeners.push(listener);
    return () => {
      this.#endListeners = this.#endListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Runs `listener` when a request sent with the session's token is forbidden and logs the user
   * out, before that logout navigates. What they asked for mustn't outlive the session: restored
   * at the next login, the same request would be refused and log them out again. A listener added
   * before that logout has navigated runs at once. The function the listener returns runs once the
   * logout has navigated, or failed to. Returns the unsubscribe.
   */
  onAccessDenied(listener: () => (() => void) | void): () => void {
    this.#deniedListeners.push(listener);
    // Untracked: an effect that subscribes must not re-run when the listener reads state.
    if (this.#denial) untrack(() => this.#notifyDenied(listener));
    return () => {
      this.#deniedListeners = this.#deniedListeners.filter((l) => l !== listener);
    };
  }

  /** A request sent with `token` was forbidden. See `onAccessDenied`. */
  denyAccess(token: string) {
    assertNoSsrWrite('session');
    // A 403 during a logout already under way, or for a token the session has dropped, didn't
    // start the logout. It's most likely PSAMA refusing an expired token (the logout call itself,
    // or a request that outlasted the logout), which says nothing about what was asked for.
    // A token a refresh has replaced since the request is still this session's.
    const sameSession = token === untrack(() => this.#token) || this.#refreshedFrom.includes(token);
    if (this.#denial || this.#pendingLogout || !sameSession) return;
    this.#denial = [];
    for (const listener of this.#deniedListeners) this.#notifyDenied(listener);
  }

  #notifyDenied(listener: () => (() => void) | void) {
    const lift = listener();
    if (lift) this.#denial?.push(lift);
  }

  connect(shell: SessionShell) {
    assertNoSsrWrite('session');
    this.#shell = shell;
  }

  /** The session JWT; `''` when signed out. */
  get token() {
    return this.#token;
  }

  get isLoggedIn() {
    return this.#token !== '';
  }

  /** The signed-in user's profile, or `undefined` when nobody is signed in. */
  get signedInUser(): User | undefined {
    return this.isLoggedIn ? this.#user : undefined;
  }

  /** Signed in with a token that hasn't expired yet. */
  get hasValidToken() {
    return this.#validity.valid;
  }

  // The profile lives in sessionStorage, so each tab has its own and a logout or a privilege
  // change in one tab can't leave stale admin data in another.
  get user() {
    return this.#user;
  }

  set user(user: User) {
    assertNoSsrWrite('session');
    this.#user = user;
    if (!browser) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _, ...userWithoutToken } = user;
    sessionStorage.setItem(USER_KEY, JSON.stringify(userWithoutToken));
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
    assertNoSsrWrite('session');
    // Signing in as someone else without signing out ends the first user's session.
    if (this.#token && tokenSubject(token) !== tokenSubject(this.#token)) {
      this.#forgetPendingRequests();
    }
    writeToken(token);
    this.#assignToken(token);
  }

  removeToken() {
    assertNoSsrWrite('session');
    clearToken();
    this.#assignToken('');
  }

  #assignToken(token: string) {
    const current = untrack(() => this.#token);
    const subject = current && tokenSubject(current);
    if (token && subject && token !== current && tokenSubject(token) === subject) {
      this.#refreshedFrom.push(current);
    } else if (token !== current) {
      this.#refreshedFrom = [];
    }
    this.#token = token;
  }

  clear() {
    assertNoSsrWrite('session');
    this.#forgetPendingRequests();
    this.removeToken();
    localStorage.removeItem(OKTA_ID_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.user = {};
  }

  // The methods that send requests read state untracked: an effect or {#await} that calls them
  // must not re-run, and send them again, whenever the session changes.

  /** Fetches the profile when forced, or while it lacks privileges or the long-term token. */
  loadUser(force?: boolean, hasToken = false): Promise<void> {
    return untrack(async () => {
      if (!force && this.#user.privileges && this.#user.token) return;
      const generation = this.#generation;
      try {
        const res = await psamaUser.me({ hasToken });
        if (generation === this.#generation) this.user = { ...this.#user, ...res };
      } catch (error) {
        if (!sessionEndedBy(error)) throw error;
      }
    });
  }

  async refreshLongTermToken() {
    const generation = this.#generation;
    const response = await psamaUser.refreshLongTermToken();
    if (!response.userLongTermToken) {
      throw new Error('No user token was returned.');
    }
    if (generation === this.#generation) {
      this.user = { ...this.#user, token: response.userLongTermToken };
    }
    return response.userLongTermToken;
  }

  /**
   * Resolves once the in-flight access fetch has succeeded or given up, including the one a
   * bootstrap in flight starts once the profile is in. Never rejects.
   */
  async consentsSettled(): Promise<void> {
    await this.#boot?.done;
    return this.#consentsRequest;
  }

  /** Leaves `consents` undefined on failure - see `accessUnavailable`. */
  loadConsents(): Promise<void> {
    return untrack(() => {
      this.user = { ...this.#user, consents: undefined };
      const request: Promise<void> = getConsents()
        .then((consents) => {
          if (this.#consentsRequest === request) this.user = { ...this.#user, consents };
        })
        .catch((error: unknown) => {
          if (
            this.#consentsRequest === request &&
            !sessionEndedBy(error) &&
            !awaitingTerms(error)
          ) {
            this.#shell.showAccessUnavailable();
          }
        });
      this.#consentsRequest = request;
      return request;
    });
  }

  /** Waits for or starts the consent request when access has not been loaded yet. */
  ensureConsentsLoaded(): Promise<ConsentsMap | undefined> {
    return untrack(async () => {
      await this.consentsSettled();
      if (this.#user.consents !== undefined) return this.#user.consents;
      // PSAMA refuses the request until the user accepts the terms; accepting loads them.
      if (awaitsTerms(this.#user, config.features)) return undefined;

      await this.loadConsents();
      return this.#user.consents;
    });
  }

  #forgetPendingRequests() {
    this.#generation++;
    this.#consentsRequest = Promise.resolve();
    for (const listener of this.#endListeners) listener();
  }

  /**
   * Loads the profile for the stored token when this tab doesn't have it: a fresh tab (the profile
   * is in sessionStorage), or another tab signing in. Once per token, so every load may call it.
   * Leaves a user the terms dialog holds (`awaitsTerms`) to it: PSAMA refuses them until they
   * accept, and a refusal opens the dialog. Never rejects; `profileFailed` says whether the profile
   * request failed for another reason.
   */
  bootstrap(): Promise<void> {
    if (!browser) return Promise.resolve();
    return untrack(() => {
      if (this.#boot?.token === this.#token) return this.#boot.done;
      const boot = { token: this.#token, done: Promise.resolve(), failed: false };
      if (
        this.hasValidToken &&
        !this.#user.privileges &&
        !awaitsTerms(this.#user, config.features)
      ) {
        boot.done = this.hydrate().catch((error: unknown) => {
          if (awaitingTerms(error)) return;
          boot.failed = true;
          console.error('Failed to hydrate user from token:', error);
          log(createLog('AUTH', 'auth.hydrate_failed', { error: String(error) }));
        });
      }
      this.#boot = boot;
      return boot.done;
    });
  }

  /**
   * PSAMA refused a request sent with `token` in a way that may mean the user has yet to accept the
   * terms. Where the app asks for them, holds the user for the dialog unless they have already
   * accepted: records it in the profile, which opens the dialog, and accepting reloads the profile.
   * A refusal for a replaced token changes nothing. Returns false when the refusal ends the session
   * instead.
   */
  holdForTerms(token: string): boolean {
    assertNoSsrWrite('session');
    return untrack(() => {
      if (!asksForTerms(config.features)) return false;
      if (token !== this.#token) return true;
      if (this.#user.acceptedTOS === true) return false;
      if (this.#user.acceptedTOS !== false) this.user = { ...this.#user, acceptedTOS: false };
      return true;
    });
  }

  /** The bootstrap couldn't load the profile for the current token, and nothing has since. */
  get profileFailed() {
    return this.#boot?.token === this.#token && this.#boot.failed && !this.#user.privileges;
  }

  /** Fills in the profile from PSAMA for the stored token. Used by the login flow and `bootstrap`. */
  async hydrate() {
    const generation = this.#generation;
    await this.loadUser(true, false);
    if (generation !== this.#generation) return;
    // Not awaited: see loadConsents. Consumers wait on consentsSettled() instead.
    this.loadConsents();
  }

  async login(token: string) {
    if (browser && token) {
      this.setToken(token);
      await this.hydrate();
    }
  }

  /** Takes a refreshed token for the signed-in user. One that arrives after a logout is ignored. */
  refresh(token: string): Promise<void> {
    if (!untrack(() => this.isLoggedIn)) return Promise.resolve();
    return this.login(token);
  }

  logout(authProvider?: AuthProvider, redirect = false): Promise<void> {
    this.#pendingLogout ??= untrack(() => this.#endSession(authProvider, redirect)).finally(() => {
      this.#pendingLogout = undefined;
    });
    return this.#pendingLogout;
  }

  async #endSession(authProvider: AuthProvider | undefined, redirect: boolean) {
    this.#forgetPendingRequests();
    const logError = (error: unknown) => console.error('Error logging out: ' + error);

    if (browser && this.#token) {
      // Log only: the logout always finishes below, so handling this failure too would
      // navigate to /login twice.
      await psamaUser.logout().catch(logError);
      this.removeToken();
    }

    // Okta and RAS return their IdP's logout URL; without one, the logout ends here. Not
    // `.catch()`: their logout isn't async, so a failure building the URL throws right away.
    let idpLogout: string | undefined;
    try {
      idpLogout = (await authProvider?.logout()) || undefined;
    } catch (error) {
      logError(error);
    }
    if (idpLogout) {
      log(createLog('AUTH', 'logout.success'));
      this.user = {};
      location.replace(idpLogout);
    } else {
      this.#leave(redirect);
    }
    // Only after the provider's logout: the Okta providers read it for id_token_hint.
    if (browser) localStorage.removeItem(OKTA_ID_TOKEN_KEY);
  }

  #leave(redirect: boolean) {
    this.user = {};
    log(createLog('AUTH', 'logout.success'));
    void this.#navigateAway(redirect ? loginRedirectPath(this.#shell.currentUrl()) : '/login');
  }

  async #navigateAway(path: string) {
    const navigation = ++this.#navigations;
    try {
      await this.#shell.navigate(path);
    } finally {
      // A later logout superseded this navigation, so the denied page is still mounted: leave
      // lifting the denial to that one.
      if (navigation === this.#navigations) this.#liftDenial();
    }
  }

  #liftDenial() {
    const lifts = this.#denial;
    this.#denial = undefined;
    lifts?.forEach((lift) => lift());
  }
}

export const session = new Session();

// Untracked for the same reason as the methods that send requests: requests and logs read these.
registerSignedInUser(() => untrack(() => session.signedInUser));

registerSessionHooks({
  getToken: () => untrack(() => session.token),
  onUnauthorized: () => {
    if (browser) {
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'Your session has timed out. Please log in.');
    }
    session.logout(undefined, true);
  },
  onTermsRefusal: (token) => session.holdForTerms(token),
  onForbidden: (token) => {
    if (browser) sessionStorage.removeItem(LOGOUT_REASON_KEY);
    if (token) session.denyAccess(token);
    session.logout(undefined, false);
  },
  onTokenRefreshed: (token) => {
    // The API client doesn't wait for this, so a failure here would be an unhandled rejection.
    session.refresh(token).catch((error: unknown) => {
      console.error('Error reloading the user after a token refresh: ' + error);
    });
  },
});
