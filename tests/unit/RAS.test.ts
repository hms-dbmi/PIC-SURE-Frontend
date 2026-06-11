import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

let mockBrowser = true;
vi.mock('$app/environment', () => ({
  get browser() {
    return mockBrowser;
  },
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock('$lib/api', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  post: (...args: unknown[]) => mockPost(...args),
}));

import RAS from '$lib/auth/RAS';

const RAS_DATA = {
  name: 'RAS',
  description: 'Login with Researcher Auth Service (RAS)',
  type: 'RAS',
  enabled: true,
  alt: false,
  logouturl: 'https://stsstg.nih.gov/connect/session/logout',
};

function newProvider() {
  return new RAS({ ...RAS_DATA });
}

describe('RAS auth provider (direct OIDC)', () => {
  beforeEach(() => {
    mockBrowser = true;
    vi.clearAllMocks();
    vi.stubGlobal('window', {
      location: { protocol: 'https:', hostname: 'picsure.example.org', port: '', href: '' },
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  describe('login', () => {
    it('fetches the authorize URL from PSAMA and redirects to it', async () => {
      const authorizeUrl =
        'https://stsstg.nih.gov/auth/oauth/v2/authorize?response_type=code&state=abc&nonce=xyz';
      mockGet.mockResolvedValue({ authorizeUrl });

      await newProvider().login('/dashboard', 'RAS');

      expect(mockGet).toHaveBeenCalledWith('psama/authentication/ras/authorize-url');
      expect(window.location.href).toBe(authorizeUrl);
      // The provider type is persisted so the callback page can resolve the provider.
      expect(sessionStorage.setItem).toHaveBeenCalledWith('type', 'RAS');
    });

    it('does not build the authorize URL client-side (no Okta-brokered params)', async () => {
      mockGet.mockResolvedValue({
        authorizeUrl: 'https://stsstg.nih.gov/auth/oauth/v2/authorize?response_type=code',
      });
      await newProvider().login('/', 'RAS');
      // Exactly one network call — the authorize-url fetch — and the redirect is the value PSAMA gave us.
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(window.location.href).not.toContain('client_id');
    });

    it('throws when PSAMA does not return an authorize URL', async () => {
      mockGet.mockResolvedValue({});
      await expect(newProvider().login('/', 'RAS')).rejects.toThrow(/authorize URL/i);
    });
  });

  describe('authenticate', () => {
    it('forwards both code and state to PSAMA and stores the RAS id token', async () => {
      mockPost.mockResolvedValue({ token: 'psama-jwt', idToken: 'ras-id-token' });

      const user = await newProvider().authenticate(['code=auth-code-1', 'state=server-state-1']);

      expect(mockPost).toHaveBeenCalledWith('psama/authentication/ras', {
        code: 'auth-code-1',
        state: 'server-state-1',
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('idToken', 'ras-id-token');
      expect(user?.token).toBe('psama-jwt');
    });

    it('returns undefined when code or state is missing (no POST attempted)', async () => {
      expect(await newProvider().authenticate(['code=only-code'])).toBeUndefined();
      expect(await newProvider().authenticate(['state=only-state'])).toBeUndefined();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('throws when PSAMA response is missing the id token', async () => {
      mockPost.mockResolvedValue({ token: 'psama-jwt' });
      await expect(newProvider().authenticate(['code=c', 'state=s'])).rejects.toThrow(
        /Missing ID token/i,
      );
    });
  });

  describe('logout', () => {
    it('builds the RAS end-session URL with id_token_hint and clears the stored id token', async () => {
      (localStorage.getItem as Mock).mockReturnValue('ras-id-token');

      const url = await newProvider().logout();

      expect(url).toContain('https://stsstg.nih.gov/connect/session/logout');
      expect(url).toContain('id_token_hint=ras-id-token');
      expect(url).toContain('post_logout_redirect_uri=');
      expect(url).toContain('picsure.example.org/login');
      expect(localStorage.removeItem).toHaveBeenCalledWith('idToken');
    });
  });
});
