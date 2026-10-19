// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));

import AuthProvider, {
  type AuthData,
  findLoginProvider,
  findSessionProvider,
  saveSessionProvider,
} from '#lib/auth/providers/AuthProvider.ts';
import { clearToken } from '#lib/auth/token.ts';

// Records the login state the way every real provider does before it leaves for the IdP.
class TestProvider extends AuthProvider {
  login = async (redirectTo: string, type: string) => this.saveState(redirectTo, type);
}

const okta = (name: string, idp: string): AuthData & { idp: string } => ({
  name,
  idp,
  type: 'OKTA',
  description: name,
  enabled: true,
  alt: false,
});
const providers = [okta('OKTA', 'ras'), okta('ERA', 'era')];

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe('findLoginProvider', () => {
  it('finds the provider the login started with when several share its type', async () => {
    const started = providers[1];
    await new TestProvider(started).login('/explorer', started.type);

    expect(findLoginProvider(providers)).toBe(started);
  });

  it('falls back to the type for a login started before the name was saved', () => {
    sessionStorage.setItem('type', 'OKTA');

    expect(findLoginProvider(providers)).toBe(providers[0]);
  });

  it('finds nothing when no login was started or its provider is gone', () => {
    expect(findLoginProvider(providers)).toBeUndefined();

    sessionStorage.setItem('providerName', 'REMOVED');
    sessionStorage.setItem('type', 'OKTA');
    expect(findLoginProvider(providers)).toBeUndefined();
  });
});

describe('findSessionProvider', () => {
  it('finds the provider the login went through in a tab that did not start it', () => {
    saveSessionProvider(providers[1]);

    expect(findSessionProvider(providers)).toBe(providers[1]);
  });

  it("follows the token rather than this tab's own login", async () => {
    await new TestProvider(providers[0]).login('/', providers[0].type);
    saveSessionProvider(providers[1]);

    expect(findSessionProvider(providers)).toBe(providers[1]);
  });

  it("falls back to this tab's login for a session from before the provider was saved", async () => {
    await new TestProvider(providers[1]).login('/', providers[1].type);

    expect(findSessionProvider(providers)).toBe(providers[1]);
  });

  it('forgets the provider with the token', () => {
    saveSessionProvider(providers[1]);
    clearToken();

    expect(findSessionProvider(providers)).toBeUndefined();
  });
});
