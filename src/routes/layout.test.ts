import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({
  browser: true,
  token: 'valid-token',
  hydrate: vi.fn(),
  clear: vi.fn(),
  expired: vi.fn(() => false),
}));
vi.mock('$app/environment', () => ({
  get browser() {
    return mocks.browser;
  },
}));
vi.mock('$lib/stores/User', () => ({
  hydrateUserFromToken: mocks.hydrate,
  clearSession: mocks.clear,
  getToken: () => mocks.token,
  isTokenExpired: mocks.expired,
}));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  applyConfig: vi.fn(),
  config: { features: { login: { open: true } } },
}));
import { load } from './+layout';
const event = (path = '/') =>
  ({
    url: new URL(`http://localhost${path}`),
    data: { configCache: {} },
    fetch: vi.fn().mockResolvedValue({ status: 200 }),
  }) as unknown as Parameters<typeof load>[0];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.browser = true;
  mocks.token = 'valid-token';
  mocks.expired.mockReturnValue(false);
  mocks.hydrate.mockResolvedValue(undefined);
  vi.stubGlobal('localStorage', { getItem: () => mocks.token });
});
describe('shared session restoration', () => {
  it.each(['/', '/discover', '/explorer', '/dashboard', '/analyze/api'])(
    'restores a session at %s',
    async (path) => {
      await load(event(path));
      expect(mocks.hydrate).toHaveBeenCalledOnce();
    },
  );
  it.each(['/login', '/login/loading'])(
    'leaves the login callback in charge at %s',
    async (path) => {
      await load(event(path));
      expect(mocks.hydrate).not.toHaveBeenCalled();
    },
  );
  it('does not initialize client access during SSR', async () => {
    mocks.browser = false;
    await load(event());
    expect(mocks.hydrate).not.toHaveBeenCalled();
  });
  it('leaves public users anonymous', async () => {
    mocks.token = '';
    await load(event());
    expect(mocks.hydrate).not.toHaveBeenCalled();
  });
  it('clears an expired session before rendering a public page', async () => {
    mocks.expired.mockReturnValue(true);
    await load(event());
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(mocks.hydrate).not.toHaveBeenCalled();
  });
  it('clears a failed profile restoration and redirects to login', async () => {
    mocks.hydrate.mockRejectedValue(new Error('profile unavailable'));
    await expect(load(event('/dashboard'))).rejects.toMatchObject({
      status: 302,
      location: expect.stringContaining('/login'),
    });
    expect(mocks.clear).toHaveBeenCalledOnce();
  });
});
