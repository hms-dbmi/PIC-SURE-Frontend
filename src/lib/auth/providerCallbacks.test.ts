// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/client.ts', () => ({ request }));
vi.mock('auth0-js', () => ({
  default: {
    // Leaves for Auth0 with the state it was given, as auth0-js does.
    WebAuth: class {
      authorize({ state }: { state: string }) {
        location.href = `https://tenant.auth0.com/authorize?response_type=token&state=${state}`;
      }
    },
  },
}));

import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import AUTH0 from '#lib/auth/providers/AUTH0.ts';
import FENCE from '#lib/auth/providers/FENCE.ts';
import MOCK from '#lib/auth/providers/MOCK.ts';
import OKTA from '#lib/auth/providers/OKTA.ts';
import RAS from '#lib/auth/providers/RAS.ts';
import { Psama } from '#lib/api/paths.ts';

const common = { description: 'Log in', enabled: true, alt: false };
const okta = {
  ...common,
  name: 'OKTA',
  type: 'OKTA',
  uri: 'https://okta.example.org/oauth2/v1/authorize',
  clientid: 'client',
  idp: 'era',
  oktaidpid: 'okta-idp',
  oktalogouturl: 'https://okta.example.org/oauth2/v1/logout',
};

const codeCallback = (state?: string) => ['code=abc123', ...(state ? [`state=${state}`] : [])];
const auth0 = () =>
  new AUTH0({ ...common, name: 'AUTH0', type: 'AUTH0', clientid: 'client', connection: 'google' });
const auth0Callback = (state?: string) => [
  '#access_token=auth0-token',
  'token_type=Bearer',
  'expires_in=7200',
  ...(state ? [`state=${state}`] : []),
];
const providers: {
  name: string;
  create: () => AuthProvider;
  callback: (state?: string) => string[];
  psama: string;
}[] = [
  { name: 'OKTA', create: () => new OKTA(okta), callback: codeCallback, psama: 'era' },
  {
    name: 'RAS',
    create: () =>
      new RAS({ ...okta, name: 'RAS', type: 'RAS', logouturl: 'https://ras.example.org/out' }),
    callback: codeCallback,
    psama: 'ras',
  },
  {
    name: 'FENCE',
    create: () =>
      new FENCE({
        ...common,
        name: 'FENCE',
        type: 'FENCE',
        uri: 'https://fence.example.org',
        clientid: 'client',
        idp: 'google',
      }),
    callback: codeCallback,
    psama: 'fence',
  },
  { name: 'AUTH0', create: auth0, callback: auth0Callback, psama: 'auth0' },
  {
    name: 'MOCK',
    create: () => new MOCK({ ...common, name: 'MOCK', type: 'MOCK' }),
    callback: (state) => [
      '#access_token=mock-token',
      'token_type=Bearer',
      ...(state ? [`state=${state}`] : []),
    ],
    psama: 'mock',
  },
];

let location: { href: string; protocol: string; hostname: string; port: string };

beforeEach(() => {
  location = { href: 'http://localhost/login', protocol: 'http:', hostname: 'localhost', port: '' };
  vi.stubGlobal('location', location);
  request.mockResolvedValue({ token: 'session-jwt', oktaIdToken: 'okta-id-token' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  request.mockReset();
  sessionStorage.clear();
  localStorage.clear();
});

/** Starts a login and returns the `state` it sent to the IdP. */
async function startLogin(provider: AuthProvider): Promise<string | null> {
  await provider.login('/explorer', provider.type);
  const url = new URL(location.href);
  return url.searchParams.get('state') ?? new URLSearchParams(url.hash.slice(1)).get('state');
}

describe.each(providers)('$name', ({ create, callback, psama }) => {
  it('sends a new random state with every login', async () => {
    const provider = create();

    const first = await startLogin(provider);
    const second = await startLogin(provider);

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toMatch(/^[0-9a-f]{64}$/);
    expect(second).not.toBe(first);
  });

  // The callback page builds a new provider instance, so the state can't live on the one that left.
  it('signs in with the callback of the login this tab started, once', async () => {
    const state = (await startLogin(create())) ?? undefined;

    await expect(create().authenticate(callback(state))).resolves.toMatchObject({
      token: 'session-jwt',
    });
    expect(request).toHaveBeenCalledExactlyOnceWith(`${Psama.Auth}/${psama}`, expect.anything());

    await expect(create().authenticate(callback(state))).rejects.toMatchObject({
      problem: 'missing',
    });
    expect(request).toHaveBeenCalledOnce();
  });

  it.each([
    ['another state', 'f'.repeat(64)],
    ['no state', undefined],
  ])('refuses a callback with %s without asking PSAMA', async (_, received) => {
    await startLogin(create());

    await expect(create().authenticate(callback(received))).rejects.toMatchObject({
      problem: 'mismatch',
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('asks for a new login when this tab started none', async () => {
    await expect(create().authenticate(callback('f'.repeat(64)))).rejects.toMatchObject({
      problem: 'missing',
    });
    expect(request).not.toHaveBeenCalled();
  });
});

describe('AUTH0', () => {
  it('reads the callback wherever Auth0 puts the state, and decodes it', async () => {
    const state = await startLogin(auth0());

    await auth0().authenticate([`#state=${state}`, 'access_token=a%2Bb', 'token_type=Bearer']);

    expect(request).toHaveBeenCalledExactlyOnceWith(`${Psama.Auth}/auth0`, {
      method: 'POST',
      body: { access_token: 'a+b', redirectURI: 'http://localhost/login/loading/' },
    });
  });

  it("fails with Auth0's reason when Auth0 refuses the login", async () => {
    const state = await startLogin(auth0());

    await expect(
      auth0().authenticate([
        '#error=access_denied',
        'error_description=User%20did%20not%20authorize%20the%20request',
        `state=${state}`,
      ]),
    ).rejects.toThrow('access_denied: User did not authorize the request');
    expect(request).not.toHaveBeenCalled();
  });

  it('fails with just the error when Auth0 gives no description', async () => {
    const state = await startLogin(auth0());

    await expect(auth0().authenticate(['#error=login_required', `state=${state}`])).rejects.toThrow(
      /^Auth0 login failed: login_required$/,
    );
  });
});
