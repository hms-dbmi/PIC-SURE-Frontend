import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

let mockBrowser = true;
vi.mock('$app/env', () => ({
  get browser() {
    return mockBrowser;
  },
}));

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn((...args: unknown[]) => args),
  getSessionId: () => 'test-session-id',
}));

vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { wafCaptchaRecovery: false } },
}));

vi.mock('#lib/api/wafCaptcha.ts', () => ({
  isWafCaptchaResponse: () => false,
  handleWafCaptcha: () => true,
}));

import { request } from '#lib/api/client.ts';
import {
  ApiError,
  CONSENT_DENIED_MESSAGE,
  rateLimitMessage,
  userMessage,
} from '#lib/api/errors.ts';
import { registerSessionHooks } from '#lib/api/sessionHooks.ts';

const onForbidden = vi.fn();

const FALLBACK = 'Something went wrong.';

describe('userMessage', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser = true;
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
    registerSessionHooks({
      getToken: () => 'my-token',
      onUnauthorized: vi.fn(),
      onTermsRefusal: vi.fn(),
      onForbidden,
      onTokenRefreshed: vi.fn(),
    });
  });

  async function rejectionFrom(
    body: string,
    status = 403,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    fetchMock.mockResolvedValue(new Response(body, { status, headers }));
    try {
      await request('picsure/test', { auth: 'open' });
    } catch (e) {
      return e;
    }
    throw new Error('expected the request to reject');
  }

  it('identifies a denial that uses the default message', async () => {
    const e = await rejectionFrom(
      JSON.stringify({ errorType: 'consent_denied', message: CONSENT_DENIED_MESSAGE }),
    );
    expect(userMessage(e, FALLBACK)).toBe(CONSENT_DENIED_MESSAGE);
  });

  it('keeps a study-specific message from the server', async () => {
    const e = await rejectionFrom(
      JSON.stringify({
        errorType: 'consent_denied',
        message: 'Consent for phs000007 was withdrawn',
      }),
    );
    expect(userMessage(e, FALLBACK)).toBe('Consent for phs000007 was withdrawn');
  });

  it('falls back to the default message when the server omits one', async () => {
    const e = await rejectionFrom(JSON.stringify({ errorType: 'consent_denied' }));
    expect(userMessage(e, FALLBACK)).toBe(CONSENT_DENIED_MESSAGE);
  });

  it('preserves the session on a denial', async () => {
    await rejectionFrom(JSON.stringify({ errorType: 'consent_denied', message: 'gone' }));
    expect(onForbidden).not.toHaveBeenCalled();
  });

  it('ignores a 403 that is not a consent denial', async () => {
    const e = await rejectionFrom(JSON.stringify({ errorType: 'other', message: 'nope' }));
    expect(userMessage(e, FALLBACK)).toBe(FALLBACK);
  });

  it('ignores a plain-text 403', async () => {
    const e = await rejectionFrom('Forbidden');
    expect(userMessage(e, FALLBACK)).toBe(FALLBACK);
  });

  it("returns a 429's wait message", async () => {
    const e = await rejectionFrom('Too Many Requests', 429, { 'Retry-After': '30' });
    expect(userMessage(e, FALLBACK)).toBe(
      "You've made too many requests. Try again in 30 seconds.",
    );
  });

  it('ignores a 500', async () => {
    const e = await rejectionFrom('Internal Server Error', 500);
    expect(userMessage(e, FALLBACK)).toBe(FALLBACK);
  });

  it('ignores an ordinary Error that happens to quote the consent wording', () => {
    expect(userMessage(new Error(`403: ${CONSENT_DENIED_MESSAGE}`), FALLBACK)).toBe(FALLBACK);
  });

  it('ignores values that are not errors', () => {
    expect(userMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(userMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(userMessage('a string', FALLBACK)).toBe(FALLBACK);
  });
});

describe('rateLimitMessage', () => {
  it('returns only a 429 message', () => {
    const wait = "You've made too many requests. Try again shortly.";
    expect(rateLimitMessage(new ApiError(429, 'rate_limited', '', wait))).toBe(wait);
    expect(rateLimitMessage(new ApiError(403, 'consent_denied', '', 'gone'))).toBeUndefined();
    expect(rateLimitMessage(new Error('429: slow down'))).toBeUndefined();
  });
});
