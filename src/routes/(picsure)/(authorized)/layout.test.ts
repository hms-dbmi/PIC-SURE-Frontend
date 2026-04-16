import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redirect } from '@sveltejs/kit';

function makeToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'test', exp }));
  return `${header}.${payload}.fake-signature`;
}

const expiredToken = makeToken(Math.floor(Date.now() / 1000) - 3600);
const validToken = makeToken(Math.floor(Date.now() / 1000) + 3600);

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
}));
vi.mock('$lib/configuration', () => ({
  features: { analyzeApi: false, analyzeAnalysis: false },
}));

let mockUserStoreValue: { privileges?: string[] } = {};

vi.mock('$lib/stores/User', () => ({
  isTokenExpired: (token: string) => {
    try {
      const exp = JSON.parse(atob(token.split('.')[1])).exp * 1000;
      return exp < Date.now();
    } catch {
      return true;
    }
  },
  user: {
    subscribe: (fn: (v: unknown) => void) => {
      fn(mockUserStoreValue);
      return () => {};
    },
  },
}));

vi.mock('$lib/models/Privilege', () => ({
  PicsurePrivileges: { QUERY: 'PRIV_QUERY' },
  BDCPrivileges: { AUTHORIZED_ACCESS: 'PRIV_AUTHORIZED_ACCESS' },
}));

function isRedirect(e: unknown): e is Redirect {
  return typeof e === 'object' && e !== null && 'status' in e && 'location' in e;
}

function captureRedirect(fn: () => void): Redirect | null {
  try {
    fn();
    return null;
  } catch (e) {
    if (isRedirect(e)) return e;
    throw e;
  }
}

describe('authorized layout load — check order', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    mockUserStoreValue = {};
  });

  it('redirects to /login when token is missing', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const { load } = await import('./+layout.ts');

    const result = captureRedirect(() => {
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]);
    });

    expect(result).not.toBeNull();
    expect(result!.location).toContain('/login');
  });

  it('redirects to /login (not /) when token is expired and user has no privileges', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(expiredToken);
    mockUserStoreValue = { privileges: [] };

    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: true }));
    vi.doMock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn(() => ({})) }));
    vi.doMock('$lib/configuration', () => ({
      features: { analyzeApi: false, analyzeAnalysis: false },
    }));
    vi.doMock('$lib/models/Privilege', () => ({
      PicsurePrivileges: { QUERY: 'PRIV_QUERY' },
      BDCPrivileges: { AUTHORIZED_ACCESS: 'PRIV_AUTHORIZED_ACCESS' },
    }));
    vi.doMock('$lib/stores/User', () => ({
      isTokenExpired: (token: string) => {
        try {
          const exp = JSON.parse(atob(token.split('.')[1])).exp * 1000;
          return exp < Date.now();
        } catch {
          return true;
        }
      },
      user: {
        subscribe: (fn: (v: unknown) => void) => {
          fn(mockUserStoreValue);
          return () => {};
        },
      },
    }));

    const { load } = await import('./+layout.ts');

    const result = captureRedirect(() => {
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]);
    });

    expect(result).not.toBeNull();
    expect(result!.location).toContain('/login');
    expect(result!.location).not.toBe('/');
  });

  it('redirects to / when token is valid but user lacks privileges', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(validToken);
    mockUserStoreValue = { privileges: [] };

    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: true }));
    vi.doMock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn(() => ({})) }));
    vi.doMock('$lib/configuration', () => ({
      features: { analyzeApi: false, analyzeAnalysis: false },
    }));
    vi.doMock('$lib/models/Privilege', () => ({
      PicsurePrivileges: { QUERY: 'PRIV_QUERY' },
      BDCPrivileges: { AUTHORIZED_ACCESS: 'PRIV_AUTHORIZED_ACCESS' },
    }));
    vi.doMock('$lib/stores/User', () => ({
      isTokenExpired: () => false,
      user: {
        subscribe: (fn: (v: unknown) => void) => {
          fn(mockUserStoreValue);
          return () => {};
        },
      },
    }));

    const { load } = await import('./+layout.ts');

    const result = captureRedirect(() => {
      load({ url: new URL('http://localhost/explorer') } as Parameters<typeof load>[0]);
    });

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });
});
