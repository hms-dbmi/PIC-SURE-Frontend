import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

let mockBrowser = true;

vi.mock('$app/environment', () => ({
  get browser() {
    return mockBrowser;
  },
}));

const mockLogout = vi.fn();
const mockLogin = vi.fn();
vi.mock('$lib/stores/User', () => ({
  logout: (...args: unknown[]) => mockLogout(...args),
  login: (...args: unknown[]) => mockLogin(...args),
}));

const mockLog = vi.fn();
const mockCreateLog = vi.fn((...args: unknown[]) => args);
const mockGetSessionId = vi.fn(() => 'test-session-id');
vi.mock('$lib/logger', () => ({
  log: (...args: unknown[]) => mockLog(...args),
  createLog: (...args: unknown[]) => mockCreateLog(...args),
  getSessionId: () => mockGetSessionId(),
}));

vi.mock('@sveltejs/kit', () => ({
  error: (status: number, body: string | { message: string }) => {
    throw new Error(`${status}: ${typeof body === 'string' ? body : body.message}`);
  },
  // Unused here; consentError.test.ts covers the real HttpError shape.
  isHttpError: () => false,
}));

let mockWafFlag = false;
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features: {
      get wafCaptchaRecovery() {
        return mockWafFlag;
      },
    },
  },
}));

const mockIsWafCaptchaResponse = vi.fn<(...args: unknown[]) => boolean>(() => false);
const mockHandleWafCaptcha = vi.fn<(...args: unknown[]) => boolean>(() => true);
vi.mock('$lib/wafCaptcha', () => ({
  isWafCaptchaResponse: (...args: unknown[]) => mockIsWafCaptchaResponse(...args),
  handleWafCaptcha: (...args: unknown[]) => mockHandleWafCaptcha(...args),
}));

import { get, post, put, del, isAbortError } from '$lib/api';

function mockFetchResponse(overrides: {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
  body?: string;
  contentType?: string;
  arrayBuffer?: ArrayBuffer;
}) {
  const {
    ok = true,
    status = 200,
    headers = {},
    body = '{}',
    contentType = 'application/json',
  } = overrides;

  const headerMap = new Map(Object.entries({ 'Content-Type': contentType, ...headers }));

  return {
    ok,
    status,
    url: 'https://example.com/picsure/test',
    headers: {
      get: (key: string) => headerMap.get(key) ?? null,
    },
    text: vi.fn().mockResolvedValue(body),
    arrayBuffer: vi.fn().mockResolvedValue(overrides.arrayBuffer ?? new ArrayBuffer(0)),
  };
}

describe('api', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser = true;
    mockWafFlag = false;
    mockIsWafCaptchaResponse.mockReturnValue(false);
    mockHandleWafCaptcha.mockReturnValue(true);
    mockGetSessionId.mockReturnValue('test-session-id');

    fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    vi.stubGlobal('window', {
      location: { origin: 'https://example.com' },
    });

    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    });

    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('HTTP methods', () => {
    it('get() sends a GET request', async () => {
      await get('picsure/query');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/picsure/query',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('post() sends a POST request', async () => {
      await post('picsure/query', { foo: 'bar' });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/picsure/query',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('put() sends a PUT request', async () => {
      await put('picsure/query', { foo: 'bar' });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/picsure/query',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('del() sends a DELETE request', async () => {
      await del('picsure/query');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/picsure/query',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('header logic', () => {
    it('sets Authorization and request-source=Authorized when token exists', async () => {
      (localStorage.getItem as Mock).mockReturnValue('my-token');
      await get('picsure/test');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer my-token');
      expect(headers['request-source']).toBe('Authorized');
    });

    it('sets request-source=Open when no token', async () => {
      (localStorage.getItem as Mock).mockReturnValue(null);
      await get('picsure/test');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
      expect(headers['request-source']).toBe('Open');
    });

    it('always sets X-Session-Id in browser', async () => {
      await get('picsure/test');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['X-Session-Id']).toBe('test-session-id');
    });

    it('uses the value from getSessionId()', async () => {
      mockGetSessionId.mockReturnValue('custom-session-42');
      await get('picsure/test');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['X-Session-Id']).toBe('custom-session-42');
    });
  });

  describe('authenticate=false', () => {
    it('does not send Authorization header even when token exists', async () => {
      (localStorage.getItem as Mock).mockReturnValue('my-token');
      await get('picsure/test', undefined, false);

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
      expect(headers['request-source']).toBe('Open');
    });
  });

  describe('data serialization', () => {
    it('sets Content-Type and stringifies object data', async () => {
      const data = { key: 'value', nested: { a: 1 } };
      await post('picsure/test', data);

      const opts = fetchMock.mock.calls[0][1];
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(opts.body).toBe(JSON.stringify(data));
    });

    it('passes string data through without re-stringifying', async () => {
      const data = 'already a string';
      await post('picsure/test', data);

      const opts = fetchMock.mock.calls[0][1];
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(opts.body).toBe('already a string');
    });

    it('does not set Content-Type or body when no data', async () => {
      await get('picsure/test');

      const opts = fetchMock.mock.calls[0][1];
      expect(opts.headers['Content-Type']).toBeUndefined();
      expect(opts.body).toBeUndefined();
    });
  });

  describe('custom headers', () => {
    it('merges custom headers with generated headers', async () => {
      (localStorage.getItem as Mock).mockReturnValue('my-token');
      await get('picsure/test', { 'X-Custom': 'hello' });

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['X-Custom']).toBe('hello');
      expect(headers['Authorization']).toBe('Bearer my-token');
      expect(headers['X-Session-Id']).toBe('test-session-id');
    });

    it('custom headers override data headers', async () => {
      await post('picsure/test', { foo: 'bar' }, { 'Content-Type': 'text/plain' });

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('text/plain');
    });
  });

  describe('response handling', () => {
    it('parses JSON response', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ body: '{"result": "success"}' }));

      const result = await get('picsure/test');
      expect(result).toEqual({ result: 'success' });
    });

    it('returns text when response is not valid JSON', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ body: 'plain text response' }));

      const result = await get('picsure/test');
      expect(result).toBe('plain text response');
    });

    it('returns ArrayBuffer for octet-stream content type', async () => {
      const buffer = new ArrayBuffer(8);
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          contentType: 'application/octet-stream',
          arrayBuffer: buffer,
        }),
      );

      const result = await get('picsure/test');
      expect(result).toBe(buffer);
    });

    it('handles 422 as a successful response', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ ok: false, status: 422, body: '{"errors": ["invalid"]}' }),
      );

      const result = await get('picsure/test');
      expect(result).toEqual({ errors: ['invalid'] });
    });
  });

  describe('token refresh', () => {
    it('calls login() when response has Authorization header', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          headers: { Authorization: 'Bearer new-token-123' },
        }),
      );

      await get('picsure/test');
      expect(mockLogin).toHaveBeenCalledWith('new-token-123');
    });

    it('does not call login() when no Authorization header in response', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({}));

      await get('picsure/test');
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('calls logout with session message on 401', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ ok: false, status: 401, body: 'Unauthorized' }),
      );

      await get('picsure/test');

      expect(mockLog).toHaveBeenCalled();
      expect(mockCreateLog).toHaveBeenCalledWith('AUTH', 'session.unauthorized', undefined, {
        status: 401,
      });
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'logout-reason',
        'Your session has timed out. Please log in.',
      );
      expect(mockLogout).toHaveBeenCalledWith(undefined, true);
    });

    it('calls logout and clears session on 403 then throws', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 403, body: 'Forbidden' }));

      await expect(get('picsure/test')).rejects.toThrow('403: Forbidden');

      expect(mockCreateLog).toHaveBeenCalledWith('AUTH', 'session.forbidden', undefined, {
        status: 403,
      });
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('logout-reason');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('filters');
      expect(mockLogout).toHaveBeenCalledWith(undefined, false);
    });

    it('reports consent denial without logging out', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 403,
          body: JSON.stringify({
            errorType: 'consent_denied',
            message: 'You no longer have consent for this saved result',
          }),
        }),
      );

      await expect(get('picsure/test')).rejects.toThrow(
        '403: You no longer have consent for this saved result',
      );

      expect(mockLogout).not.toHaveBeenCalled();
      expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    });

    it('throws error with status for other error codes', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ ok: false, status: 500, body: 'Internal Server Error' }),
      );

      await expect(get('picsure/test')).rejects.toThrow('500: Internal Server Error');
    });

    it('logs the error before throwing for non-401/403 errors', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ ok: false, status: 500, body: 'Server Error' }),
      );

      await expect(get('picsure/test')).rejects.toThrow();

      expect(mockCreateLog).toHaveBeenCalledWith('ERROR', 'error.unknown', undefined, {
        status: 500,
        error: { message: 'Server Error' },
      });
    });
  });

  describe('WAF CAPTCHA recovery', () => {
    const wafResponse = () =>
      mockFetchResponse({
        ok: false,
        status: 405,
        headers: { 'x-amzn-waf-action': 'captcha' },
        body: '<html>waf interstitial</html>',
        contentType: 'text/html',
      });

    it('never settles and stays silent when a reload is imminent', async () => {
      mockWafFlag = true;
      mockIsWafCaptchaResponse.mockReturnValue(true);
      mockHandleWafCaptcha.mockReturnValue(true);
      fetchMock.mockResolvedValue(wafResponse());

      const outcome = await Promise.race([
        get('picsure/test').then(
          () => 'settled',
          () => 'settled',
        ),
        new Promise((resolve) => setTimeout(() => resolve('pending'), 10)),
      ]);

      expect(outcome).toBe('pending');
      expect(mockHandleWafCaptcha).toHaveBeenCalledWith('/picsure/test');
      expect(mockCreateLog).not.toHaveBeenCalledWith(
        'ERROR',
        'error.unknown',
        undefined,
        expect.anything(),
      );
    });

    it('falls through to the generic error when the loop guard trips', async () => {
      mockWafFlag = true;
      mockIsWafCaptchaResponse.mockReturnValue(true);
      mockHandleWafCaptcha.mockReturnValue(false);
      fetchMock.mockResolvedValue(wafResponse());

      await expect(get('picsure/test')).rejects.toThrow('405');

      expect(mockCreateLog).toHaveBeenCalledWith('ERROR', 'error.unknown', undefined, {
        status: 405,
        error: { message: '<html>waf interstitial</html>' },
      });
    });

    it('takes the generic error path when the feature flag is off', async () => {
      mockWafFlag = false;
      fetchMock.mockResolvedValue(wafResponse());

      await expect(get('picsure/test')).rejects.toThrow('405');

      expect(mockIsWafCaptchaResponse).not.toHaveBeenCalled();
      expect(mockHandleWafCaptcha).not.toHaveBeenCalled();
    });

    it('takes the generic error path outside the browser', async () => {
      mockBrowser = false;
      mockWafFlag = true;
      fetchMock.mockResolvedValue(wafResponse());

      await expect(get('picsure/test')).rejects.toThrow('405');

      expect(mockHandleWafCaptcha).not.toHaveBeenCalled();
    });

    it('takes the generic error path when the response is not a WAF CAPTCHA', async () => {
      mockWafFlag = true;
      mockIsWafCaptchaResponse.mockReturnValue(false);
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 405, body: 'nope' }));

      await expect(get('picsure/test')).rejects.toThrow('405: nope');

      expect(mockHandleWafCaptcha).not.toHaveBeenCalled();
    });
  });

  describe('non-browser context', () => {
    beforeEach(() => {
      mockBrowser = false;
    });

    it('does not set Authorization, request-source, or X-Session-Id', async () => {
      (localStorage.getItem as Mock).mockReturnValue('my-token');
      await get('picsure/test');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
      expect(headers['request-source']).toBeUndefined();
      expect(headers['X-Session-Id']).toBeUndefined();
    });

    it('does not call getSessionId()', async () => {
      await get('picsure/test');
      expect(mockGetSessionId).not.toHaveBeenCalled();
    });

    it('does not set sessionStorage on 401', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ ok: false, status: 401, body: 'Unauthorized' }),
      );

      await get('picsure/test');

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('does not clear sessionStorage on 403', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 403, body: 'Forbidden' }));

      await expect(get('picsure/test')).rejects.toThrow('403');

      expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('URL construction', () => {
    it('constructs URL from window.location.origin and path', async () => {
      await get('picsure/query/sync');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/picsure/query/sync',
        expect.any(Object),
      );
    });
  });

  describe('abort signal', () => {
    it('forwards a signal to fetch when one is given', async () => {
      const controller = new AbortController();

      await post('picsure/query', { foo: 'bar' }, undefined, undefined, {
        signal: controller.signal,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/picsure/query',
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it.each([
      ['get', () => get('picsure/query', undefined, undefined, { signal: makeSignal() })],
      ['del', () => del('picsure/query', undefined, undefined, { signal: makeSignal() })],
      ['put', () => put('picsure/query', {}, undefined, undefined, { signal: makeSignal() })],
    ])('%s() forwards a signal', async (_name, call) => {
      await call();
      expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });

    it('omits signal entirely when none is given, so existing callers are unaffected', async () => {
      await post('picsure/query', { foo: 'bar' });

      const opts = fetchMock.mock.calls[0][1];
      expect('signal' in opts).toBe(false);
    });

    it('omits signal when an options object is passed without one', async () => {
      await post('picsure/query', { foo: 'bar' }, undefined, undefined, {});

      expect('signal' in fetchMock.mock.calls[0][1]).toBe(false);
    });

    it('rejects with the abort error without running response handling', async () => {
      const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
      fetchMock.mockRejectedValue(abortError);

      await expect(get('picsure/test')).rejects.toThrow('aborted');

      // An aborted fetch rejects before handleResponse, so none of the failure
      // paths - logout, error logging - may fire.
      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe('isAbortError', () => {
    it('is true for the DOMException a real aborted fetch throws', () => {
      expect(isAbortError(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
    });

    it('is true for an error named AbortError', () => {
      expect(isAbortError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true);
    });

    it('is false for an ordinary error', () => {
      expect(isAbortError(new Error('boom'))).toBe(false);
    });

    it('is false for null and undefined', () => {
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });
  });
});

function makeSignal(): AbortSignal {
  return new AbortController().signal;
}
