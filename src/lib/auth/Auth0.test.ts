// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth0Calls = vi.hoisted(() => ({
  constructor: vi.fn(),
  authorize: vi.fn(),
}));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));
vi.mock('#lib/config/deployment.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#lib/config/deployment.ts')>()),
  AUTH0_TENANT: 'existing-tenant',
}));
vi.mock('auth0-js', () => ({
  default: {
    WebAuth: class {
      constructor(options: unknown) {
        auth0Calls.constructor(options);
      }

      authorize(options: unknown) {
        auth0Calls.authorize(options);
      }
    },
  },
}));

import Auth0 from '#lib/auth/providers/AUTH0.ts';

const provider = {
  name: 'AUTH0',
  description: 'Mock Auth0',
  type: 'AUTH0',
  enabled: true,
  alt: false,
  clientid: 'mock-auth0-client',
  connection: 'mock-auth0',
};

describe('Auth0 login', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { protocol: 'https:', hostname: 'localhost', port: '' });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('uses an explicitly configured Auth0 domain', async () => {
    const auth0 = new Auth0({ ...provider, domain: 'localhost' });

    await auth0.login('/', 'AUTH0');

    expect(auth0Calls.constructor).toHaveBeenCalledWith({
      domain: 'localhost',
      clientID: 'mock-auth0-client',
      redirectUri: 'https://localhost/login/loading/',
      responseType: 'token',
    });
    expect(auth0Calls.authorize).toHaveBeenCalledWith({
      responseType: 'token',
      connection: 'mock-auth0',
      state: expect.any(String),
    });
  });

  it('uses the existing tenant-derived domain when none is configured', async () => {
    const auth0 = new Auth0(provider);

    await auth0.login('/', 'AUTH0');

    expect(auth0Calls.constructor).toHaveBeenCalledWith({
      domain: 'existing-tenant.auth0.com',
      clientID: 'mock-auth0-client',
      redirectUri: 'https://localhost/login/loading/',
      responseType: 'token',
    });
    expect(auth0Calls.authorize).toHaveBeenCalledWith({
      responseType: 'token',
      connection: 'mock-auth0',
      state: expect.any(String),
    });
  });
});
