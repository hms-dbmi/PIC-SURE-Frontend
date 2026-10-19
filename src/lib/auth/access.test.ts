// @vitest-environment happy-dom
// Mirrors the browser run: kit's client redirect() reads window.location.origin.
import { isRedirect } from '@sveltejs/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '#lib/auth/model/user.ts';

const env = vi.hoisted(() => ({ browser: true }));
const fakeSession = vi.hoisted(() => ({
  isLoggedIn: false,
  hasValidToken: false,
  user: {} as User,
  profileFailed: false,
  bootstrap: vi.fn(() => Promise.resolve()),
}));
const fakeConfig = vi.hoisted(() => ({ features: {} as Record<string, unknown> }));

vi.mock('$app/env', () => ({
  get browser() {
    return env.browser;
  },
}));
vi.mock('#lib/auth/session.svelte.ts', () => ({ session: fakeSession }));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: fakeConfig }));
vi.mock('#lib/telemetry/logger.ts', () => ({ log: vi.fn(), createLog: vi.fn(() => ({})) }));

import { ACCESS, type Access } from '#lib/auth/access.ts';
import { requireAccess } from '#lib/auth/guard.ts';
import { log } from '#lib/telemetry/logger.ts';

function makeToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'test', exp }));
  return `${header}.${payload}.fake-signature`;
}

const VALID = makeToken(Math.floor(Date.now() / 1000) + 3600);
const EXPIRED = makeToken(Math.floor(Date.now() / 1000) - 3600);

const QUERY = 'PIC_SURE_ANY_QUERY';
const AUTHORIZED_ACCESS = 'AUTHORIZED_ACCESS';

function features(overrides: Record<string, unknown> = {}) {
  return {
    login: { open: true },
    explorer: { open: false },
    discover: true,
    analyzeApi: true,
    dashboard: true,
    ...overrides,
  };
}

interface Row {
  policy: keyof typeof ACCESS;
  url: string;
  token?: string;
  user?: User;
  profileFailed?: boolean;
  features?: Record<string, unknown>;
  server?: boolean;
  /** Where the guard redirects, or `null` to let the visitor in. */
  to: string | null;
}

const signedIn = (...privileges: string[]) => ({ token: VALID, user: { privileges } });
const closed = { login: { open: false } };

/** Puts the session in the state a row describes. */
function signIn(token = '', user: User = {}, profileFailed = false) {
  Object.assign(fakeSession, {
    isLoggedIn: token !== '',
    hasValidToken: token === VALID,
    user,
    profileFailed,
  });
}

async function guard(
  policy: Access,
  url: string,
  parent: () => Promise<Record<string, unknown>> = async () => ({}),
): Promise<string | null> {
  try {
    await requireAccess({ url: new URL(url, 'http://localhost'), parent }, policy);
    return null;
  } catch (error) {
    if (isRedirect(error)) return error.location;
    throw error;
  }
}

beforeEach(() => {
  env.browser = true;
  signIn();
  fakeSession.bootstrap.mockClear();
  fakeConfig.features = features();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('requireAccess', () => {
  // prettier-ignore
  const rows: [string, Row][] = [
    ['a closed deployment sends a signed-out visitor to log in, keeping the deep link',
      { policy: 'app', url: '/help?section=faq', features: closed, to: '/login?redirectTo=%2Fhelp%3Fsection%3Dfaq' }],
    ['a closed deployment admits a signed-in visitor', { policy: 'app', url: '/', features: closed, ...signedIn(), to: null }],
    ['a closed deployment sends a token that expired to log in again',
      { policy: 'app', url: '/help', features: closed, token: EXPIRED, to: '/login?redirectTo=%2Fhelp&reason=expired' }],
    ['an open deployment admits a signed-out visitor', { policy: 'app', url: '/', to: null }],
    ['the server never sees a session, so it leaves login to the browser',
      { policy: 'app', url: '/', features: closed, server: true, to: null }],

    ['authorized: a signed-out visitor goes to log in',
      { policy: 'authorized', url: '/dataset', to: '/login?redirectTo=%2Fdataset&reason=no_token' }],
    ['authorized: an expired token goes to log in again',
      { policy: 'authorized', url: '/dataset', token: EXPIRED, user: { privileges: [QUERY] }, to: '/login?redirectTo=%2Fdataset&reason=expired' }],
    ['authorized: a profile that failed to load goes to log in',
      { policy: 'authorized', url: '/dataset', token: VALID, profileFailed: true, to: '/login?redirectTo=%2Fdataset&reason=hydrate_failed' }],
    ['authorized: PIC_SURE_ANY_QUERY alone admits', { policy: 'authorized', url: '/dataset', ...signedIn(QUERY), to: null }],
    ['authorized: AUTHORIZED_ACCESS alone admits', { policy: 'authorized', url: '/dataset', ...signedIn(AUTHORIZED_ACCESS), to: null }],
    ['authorized: privileges matching neither arm go home with the reason',
      { policy: 'authorized', url: '/dataset?x=1', ...signedIn('MANAGED_PRIV_OPEN_ACCESS', 'MANAGED_PRIV_DICTIONARY'), to: '/?reason=no_privilege&from=%2Fdataset%3Fx%3D1' }],
    ['authorized: a profile without privileges goes home',
      { policy: 'authorized', url: '/dataset', token: VALID, user: {}, to: '/?reason=no_privilege&from=%2Fdataset' }],
    ['authorized: a user who has not accepted the terms is left to the terms dialog',
      { policy: 'authorized', url: '/dataset', token: VALID, user: { acceptedTOS: false }, to: null }],
    ['authorized: the server leaves every check to the browser', { policy: 'authorized', url: '/dataset', server: true, to: null }],

    ['admin: ADMIN with query access admits', { policy: 'admin', url: '/admin/users', ...signedIn(QUERY, 'ADMIN'), to: null }],
    ['admin: SUPER_ADMIN with query access admits', { policy: 'admin', url: '/admin/users', ...signedIn(QUERY, 'SUPER_ADMIN'), to: null }],
    ['admin: an admin without query access is turned away by the authorized rule (D3)',
      { policy: 'admin', url: '/admin/users', ...signedIn('ADMIN'), to: '/?reason=no_privilege&from=%2Fadmin%2Fusers' }],
    ['admin: query access alone goes home', { policy: 'admin', url: '/admin/users', ...signedIn(QUERY), to: '/' }],

    ['topAdmin: SUPER_ADMIN admits',
      { policy: 'topAdmin', url: '/admin/configuration/role/new', ...signedIn(QUERY, 'SUPER_ADMIN'), to: null }],
    ['topAdmin: a plain admin goes back to the configuration page',
      { policy: 'topAdmin', url: '/admin/configuration/role/new', ...signedIn(QUERY, 'ADMIN'), to: '/admin/configuration' }],

    ['dataset: PIC-SURE NAMED_DATASET admits', { policy: 'dataset', url: '/dataset', ...signedIn(QUERY, 'NAMED_DATASET'), to: null }],
    ['dataset: BDC MANUAL_PRIV_NAMED_DATASET admits',
      { policy: 'dataset', url: '/dataset', ...signedIn(AUTHORIZED_ACCESS, 'MANUAL_PRIV_NAMED_DATASET'), to: null }],
    ['dataset: neither goes home', { policy: 'dataset', url: '/dataset', ...signedIn(QUERY), to: '/' }],

    ['explorer: an open explorer admits a signed-out visitor',
      { policy: 'explorer', url: '/explorer', features: { explorer: { open: true } }, to: null }],
    ['explorer: a closed explorer sends a signed-out visitor to log in, saying why',
      { policy: 'explorer', url: '/explorer?search=age', to: '/login?redirectTo=%2Fexplorer%3Fsearch%3Dage&reason=explore' }],
    ['explorer: an expired token goes to log in again',
      { policy: 'explorer', url: '/explorer', token: EXPIRED, to: '/login?redirectTo=%2Fexplorer&reason=expired' }],
    ['explorer: any signed-in user is admitted', { policy: 'explorer', url: '/explorer', ...signedIn(), to: null }],

    ['discover: off sends the visitor to the explorer', { policy: 'discover', url: '/discover', features: { discover: false }, to: '/explorer' }],
    ['discover: off is enforced on the server too',
      { policy: 'discover', url: '/discover', features: { discover: false }, server: true, to: '/explorer' }],
    ['discover: on admits', { policy: 'discover', url: '/discover', to: null }],
    ['api: off goes home, on the server too', { policy: 'api', url: '/api', features: { analyzeApi: false }, server: true, to: '/' }],
    ['dashboard: off goes home', { policy: 'dashboard', url: '/dashboard', features: { dashboard: false }, to: '/' }],
  ];

  it.each(rows)('%s', async (_, row) => {
    env.browser = !row.server;
    signIn(row.token, row.user, row.profileFailed);
    fakeConfig.features = features(row.features);

    expect(await guard(ACCESS[row.policy], row.url)).toBe(row.to);
  });

  // The profile comes from the session bootstrap, which runs once per token; session.svelte.test.ts
  // shows guards sharing it.
  it('only reads: no log, no storage write and no request, whatever it decides', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const writes = [localStorage, sessionStorage].flatMap((storage) =>
      (['setItem', 'removeItem', 'clear'] as const).map((method) => vi.spyOn(storage, method)),
    );

    for (const [, row] of rows) {
      env.browser = !row.server;
      signIn(row.token, row.user, row.profileFailed);
      fakeConfig.features = features(row.features);
      await guard(ACCESS[row.policy], row.url);
    }

    expect(log).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    for (const write of writes) expect(write).not.toHaveBeenCalled();
  });

  it('decides with the config the parent layouts applied', async () => {
    const parent = async () => {
      fakeConfig.features = features({ discover: false });
      return {};
    };

    expect(await guard(ACCESS.discover, '/discover', parent)).toBe('/explorer');
  });

  it('waits for the session bootstrap before checking privileges', async () => {
    // A fresh tab: the token is stored, the profile isn't loaded yet.
    signIn(VALID);
    fakeSession.bootstrap.mockImplementationOnce(async () => {
      fakeSession.user = { privileges: [QUERY, 'NAMED_DATASET'] };
    });

    expect(await guard(ACCESS.dataset, '/dataset')).toBeNull();
    expect(fakeSession.bootstrap).toHaveBeenCalledOnce();
  });

  it('does not wait for the profile when only the login matters', async () => {
    signIn(VALID);
    fakeConfig.features = features(closed);

    await guard(ACCESS.app, '/');
    await guard(ACCESS.explorer, '/explorer');

    expect(fakeSession.bootstrap).not.toHaveBeenCalled();
  });
});
