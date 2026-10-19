import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth0Calls = vi.hoisted(() => ({
  constructor: vi.fn(),
  authorize: vi.fn(),
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/api', () => ({ post: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({ auth: { auth0Tenant: 'existing-tenant' } }));
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

import Auth0 from '$lib/auth/AUTH0';

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
    vi.clearAllMocks();
    vi.stubGlobal('window', {
      location: { protocol: 'https:', hostname: 'localhost', port: '' },
    });
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
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
    });
  });
});
