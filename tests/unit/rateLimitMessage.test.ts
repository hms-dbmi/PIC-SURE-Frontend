import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/stores/User', () => ({ logout: vi.fn(), login: vi.fn() }));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn((...args: unknown[]) => args),
  getSessionId: () => 'test-session-id',
}));

vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { wafCaptchaRecovery: false } },
}));

vi.mock('$lib/wafCaptcha', () => ({
  isWafCaptchaResponse: () => false,
  handleWafCaptcha: () => true,
}));

// @sveltejs/kit is left unmocked on purpose: error() must throw a real HttpError.
import { get, rateLimitMessage } from '$lib/api';

describe('rateLimitMessage', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  async function rejectionFrom(response: Response): Promise<unknown> {
    fetchMock.mockResolvedValue(response);
    try {
      await get('picsure/test');
    } catch (e) {
      return e;
    }
    throw new Error('expected the request to reject');
  }

  it("returns a 429's wait message", async () => {
    const e = await rejectionFrom(
      new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '30' } }),
    );
    expect(rateLimitMessage(e)).toBe("You've made too many requests. Try again in 30 seconds.");
  });

  it('ignores other HTTP errors', async () => {
    const e = await rejectionFrom(new Response('Internal Server Error', { status: 500 }));
    expect(rateLimitMessage(e)).toBeUndefined();
  });

  it('ignores an ordinary Error and values that are not errors', () => {
    expect(rateLimitMessage(new Error('429: slow down'))).toBeUndefined();
    expect(rateLimitMessage(undefined)).toBeUndefined();
    expect(rateLimitMessage('a string')).toBeUndefined();
  });
});
