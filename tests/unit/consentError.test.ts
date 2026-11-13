import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

let mockBrowser = true;
vi.mock('$app/environment', () => ({
  get browser() {
    return mockBrowser;
  },
}));

const mockLogout = vi.fn();
vi.mock('$lib/stores/User', () => ({
  logout: (...args: unknown[]) => mockLogout(...args),
  login: vi.fn(),
}));

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
import { error } from '@sveltejs/kit';
import {
  get,
  consentDeniedMessage,
  serverErrorMessage,
  CONSENT_DENIED_MESSAGE,
  SERVER_MESSAGE_MAX_LENGTH,
} from '$lib/api';

describe('consentDeniedMessage', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser = true;
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

  async function rejectionFrom(body: string, status = 403): Promise<unknown> {
    fetchMock.mockResolvedValue(new Response(body, { status }));
    try {
      await get('picsure/test');
    } catch (e) {
      return e;
    }
    throw new Error('expected the request to reject');
  }

  it('identifies a denial that uses the default message', async () => {
    const e = await rejectionFrom(
      JSON.stringify({ errorType: 'consent_denied', message: CONSENT_DENIED_MESSAGE }),
    );
    expect(consentDeniedMessage(e)).toBe(CONSENT_DENIED_MESSAGE);
  });

  it('keeps a study-specific message from the server', async () => {
    const e = await rejectionFrom(
      JSON.stringify({
        errorType: 'consent_denied',
        message: 'Consent for phs000007 was withdrawn',
      }),
    );
    expect(consentDeniedMessage(e)).toBe('Consent for phs000007 was withdrawn');
  });

  it('falls back to the default message when the server omits one', async () => {
    const e = await rejectionFrom(JSON.stringify({ errorType: 'consent_denied' }));
    expect(consentDeniedMessage(e)).toBe(CONSENT_DENIED_MESSAGE);
  });

  it('preserves the session on a denial', async () => {
    await rejectionFrom(JSON.stringify({ errorType: 'consent_denied', message: 'gone' }));
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('ignores a 403 that is not a consent denial', async () => {
    const e = await rejectionFrom(JSON.stringify({ errorType: 'other', message: 'nope' }));
    expect(consentDeniedMessage(e)).toBeUndefined();
  });

  it('ignores a plain-text 403', async () => {
    const e = await rejectionFrom('Forbidden');
    expect(consentDeniedMessage(e)).toBeUndefined();
  });

  it('ignores a 500', async () => {
    const e = await rejectionFrom('Internal Server Error', 500);
    expect(consentDeniedMessage(e)).toBeUndefined();
  });

  it('ignores an ordinary Error that happens to quote the consent wording', () => {
    expect(consentDeniedMessage(new Error(`403: ${CONSENT_DENIED_MESSAGE}`))).toBeUndefined();
  });

  it('ignores values that are not errors', () => {
    expect(consentDeniedMessage(undefined)).toBeUndefined();
    expect(consentDeniedMessage(null)).toBeUndefined();
    expect(consentDeniedMessage('a string')).toBeUndefined();
  });
});

describe('serverErrorMessage', () => {
  function httpError(status: 400 | 403 | 404 | 499 | 500 | 502, body: string | App.Error): unknown {
    try {
      error(status, body);
    } catch (e) {
      return e;
    }
  }

  it('reads the message of a JSON error body', () => {
    const e = httpError(400, JSON.stringify({ errorType: 'bad_request', message: 'Not allowed' }));
    expect(serverErrorMessage(e)).toBe('Not allowed');
  });

  it('reads the message of a consent denial', () => {
    const e = httpError(403, { message: 'Consent withdrawn', errorType: 'consent_denied' });
    expect(serverErrorMessage(e)).toBe('Consent withdrawn');
  });

  it.each(['Bad Gateway', '<html></html>', '{}', '{"message":"  "}', '{"message":5}', 'null', ''])(
    'finds no message in the body %j',
    (body) => {
      expect(serverErrorMessage(httpError(400, body))).toBeUndefined();
    },
  );

  it.each([400, 404, 499] as const)('reads the message of a %i', (status) => {
    expect(serverErrorMessage(httpError(status, '{"message":"Not allowed"}'))).toBe('Not allowed');
  });

  it.each([500, 502] as const)('hides the message of a %i', (status) => {
    const body = JSON.stringify({ message: 'HPDS call failed: http://hpds.internal:8080/query' });
    expect(serverErrorMessage(httpError(status, body))).toBeUndefined();
  });

  it('reads a message exactly as long as the limit', () => {
    const message = 'a'.repeat(SERVER_MESSAGE_MAX_LENGTH);
    expect(serverErrorMessage(httpError(400, JSON.stringify({ message })))).toBe(message);
  });

  it('drops a message longer than the limit without cutting it', () => {
    const message = 'a'.repeat(SERVER_MESSAGE_MAX_LENGTH + 1);
    expect(serverErrorMessage(httpError(400, JSON.stringify({ message })))).toBeUndefined();
    expect(
      serverErrorMessage(httpError(403, { message, errorType: 'consent_denied' })),
    ).toBeUndefined();
  });

  it('finds no message in a value that is not an HTTP error', () => {
    expect(serverErrorMessage('Please input a Dataset ID name')).toBeUndefined();
    expect(serverErrorMessage(new Error('{"message":"Not allowed"}'))).toBeUndefined();
    expect(serverErrorMessage(undefined)).toBeUndefined();
  });
});
