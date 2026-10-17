// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));

import AuthProvider, { type AuthData, findLoginProvider } from '#lib/models/AuthProvider.ts';

// Records the login state the way every real provider does before it leaves for the IdP.
class TestProvider extends AuthProvider {
  login = async (redirectTo: string, type: string) => this.saveState(redirectTo, type);
}

const okta = (name: string, idp: string): AuthData => ({
  name,
  idp,
  type: 'OKTA',
  description: name,
  enabled: true,
  alt: false,
});
const providers = [okta('OKTA', 'ras'), okta('ERA', 'era')];

afterEach(() => sessionStorage.clear());

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
