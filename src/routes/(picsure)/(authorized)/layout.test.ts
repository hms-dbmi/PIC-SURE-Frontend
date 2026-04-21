import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redirect } from '@sveltejs/kit';

function makeToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'test', exp }));
  return `${header}.${payload}.fake-signature`;
}

const expiredToken = makeToken(Math.floor(Date.now() / 1000) - 3600);
const validToken = makeToken(Math.floor(Date.now() / 1000) + 3600);

let mockUserStoreValue: { privileges?: string[] } = {};

function isRedirect(e: unknown): e is Redirect {
  return typeof e === 'object' && e !== null && 'status' in e && 'location' in e;
}

async function captureRedirect(fn: () => unknown): Promise<Redirect | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (isRedirect(e)) return e;
    throw e;
  }
}

function mockUserModule(overrides: Record<string, unknown> = {}) {
  vi.doMock('$lib/stores/User', () => ({
    isTokenExpired: (token: string) => {
      try {
        const exp = JSON.parse(atob(token.split('.')[1])).exp * 1000;
        return exp < Date.now();
      } catch {
        return true;
      }
    },
    clearSession: vi.fn(),
    hydrateUserFromToken: vi.fn().mockResolvedValue(undefined),
    user: {
      subscribe: (fn: (v: unknown) => void) => {
        fn(mockUserStoreValue);
        return () => {};
      },
    },
    ...overrides,
  }));
}

function mockOtherModules() {
  vi.doMock('$app/environment', () => ({ browser: true }));
  vi.doMock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn(() => ({})) }));
  vi.doMock('$lib/configuration', () => ({
    features: { analyzeApi: false, analyzeAnalysis: false },
  }));
  vi.doMock('$lib/models/Privilege', () => ({
    PicsurePrivileges: { QUERY: 'PRIV_QUERY' },
    BDCPrivileges: { AUTHORIZED_ACCESS: 'PRIV_AUTHORIZED_ACCESS' },
  }));
}

describe('authorized layout load — check order', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    mockUserStoreValue = {};
    mockOtherModules();
  });

  it('redirects to /login and clears session when token is missing', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const clearSessionSpy = vi.fn();
    mockUserModule({ clearSession: clearSessionSpy });
    const { load } = await import('./+layout.ts');

    const result = await captureRedirect(() =>
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]),
    );

    expect(result).not.toBeNull();
    expect(result!.location).toContain('/login');
    expect(clearSessionSpy).toHaveBeenCalled();
  });

  it('redirects to /login (not /) and clears session when token is expired', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(expiredToken);
    mockUserStoreValue = { privileges: [] };
    const clearSessionSpy = vi.fn();
    mockUserModule({ clearSession: clearSessionSpy });
    const { load } = await import('./+layout.ts');

    const result = await captureRedirect(() =>
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]),
    );

    expect(result).not.toBeNull();
    expect(result!.location).toContain('/login');
    expect(result!.location).not.toBe('/');
    // Regression: the old code redirected but left admin/privileged user data in the
    // store, causing the admin sitemap to show after timeout. clearSession must fire.
    expect(clearSessionSpy).toHaveBeenCalled();
  });

  it('hydrates the user from PSAMA when token is valid but user store is empty', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(validToken);
    mockUserStoreValue = {};
    const hydrateSpy = vi.fn().mockImplementation(async () => {
      mockUserStoreValue = { privileges: ['PRIV_QUERY'] };
    });
    mockUserModule({
      isTokenExpired: () => false,
      hydrateUserFromToken: hydrateSpy,
    });
    const { load } = await import('./+layout.ts');

    const result = await captureRedirect(() =>
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]),
    );

    expect(hydrateSpy).toHaveBeenCalled();
    // User was hydrated with QUERY privilege, so no redirect should fire.
    expect(result).toBeNull();
  });

  it('redirects to /login and clears session when hydration fails', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(validToken);
    mockUserStoreValue = {};
    const clearSessionSpy = vi.fn();
    mockUserModule({
      isTokenExpired: () => false,
      hydrateUserFromToken: vi.fn().mockRejectedValue(new Error('network')),
      clearSession: clearSessionSpy,
    });
    const { load } = await import('./+layout.ts');

    const result = await captureRedirect(() =>
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]),
    );

    expect(result).not.toBeNull();
    expect(result!.location).toContain('/login');
    expect(clearSessionSpy).toHaveBeenCalled();
  });

  it('redirects to / when token is valid and hydrated user lacks privileges', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(validToken);
    mockUserStoreValue = { privileges: [] };
    mockUserModule({ isTokenExpired: () => false });
    const { load } = await import('./+layout.ts');

    const result = await captureRedirect(() =>
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]),
    );

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });
});
