// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/client.ts', () => ({ request }));

import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';
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
