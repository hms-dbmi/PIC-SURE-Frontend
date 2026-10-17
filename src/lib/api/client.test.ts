import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

let mockBrowser = true;

vi.mock('$app/env', () => ({
  get browser() {
    return mockBrowser;
  },
}));

const mockLog = vi.fn();
const mockCreateLog = vi.fn((...args: unknown[]) => args);
const mockGetSessionId = vi.fn(() => 'test-session-id');
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: (...args: unknown[]) => mockLog(...args),
  createLog: (...args: unknown[]) => mockCreateLog(...args),
  getSessionId: () => mockGetSessionId(),
}));

let mockWafFlag = false;
vi.mock('#lib/config/config.svelte.ts', () => ({
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
vi.mock('#lib/api/wafCaptcha.ts', () => ({
  isWafCaptchaResponse: (...args: unknown[]) => mockIsWafCaptchaResponse(...args),
  handleWafCaptcha: (...args: unknown[]) => mockHandleWafCaptcha(...args),
}));

const mockOpenSessionToken = vi.fn<() => Promise<string | null>>(async () => null);
const mockAcceptSessionRefresh = vi.fn();
const mockForgetOpenSession = vi.fn();
const mockRecoverOpenSession = vi.fn<(sent: string) => Promise<string | null>>(async () => null);
vi.mock('#lib/api/openSession.ts', () => ({
  openSessionToken: () => mockOpenSessionToken(),
  acceptSessionRefresh: (...args: unknown[]) => mockAcceptSessionRefresh(...args),
  forgetOpenSession: (...args: unknown[]) => mockForgetOpenSession(...args),
  isSessionKeyError: (errorType: unknown) =>
    errorType === 'api_key_invalid' || errorType === 'api_key_missing',
  recoverOpenSession: (sent: string) => mockRecoverOpenSession(sent),
}));

import { request, get, post, put, patch, del, isAbortError } from '#lib/api/client.ts';
import { ApiError } from '#lib/api/errors.ts';
import { registerSessionHooks } from '#lib/api/sessionHooks.ts';

const SESSION = 'picsure_s_header.payload.signature';

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

  const response = {
    ok,
    status,
    url: 'https://example.com/picsure/test',
    headers: {
      get: (key: string) => headerMap.get(key) ?? null,
    },
    text: vi.fn().mockResolvedValue(body),
    json: vi.fn(async () => JSON.parse(body)),
    arrayBuffer: vi.fn().mockResolvedValue(overrides.arrayBuffer ?? new ArrayBuffer(0)),
    clone: () => response,
  };
  return response;
}

// the init of the nth fetch call
function sent(call = 0): RequestInit & { headers: Record<string, string> } {
  return fetchMock.mock.calls[call][1];
}

function rejection(promise: Promise<unknown>): Promise<ApiError> {
  return promise.then(
    () => {
      throw new Error('expected the request to reject');
    },
    (e: unknown) => {
      expect(e).toBeInstanceOf(ApiError);
      return e as ApiError;
    },
  );
}

async function settles(promise: Promise<unknown>): Promise<boolean> {
  const outcome = await Promise.race([
    promise.then(
      () => 'settled',
      () => 'settled',
    ),
    new Promise((resolve) => setTimeout(() => resolve('pending'), 10)),
  ]);
  return outcome === 'settled';
}

let fetchMock: Mock;
let token: string | null;
const onUnauthorized = vi.fn();
const onForbidden = vi.fn();
const onTokenRefreshed = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockBrowser = true;
  mockWafFlag = false;
  mockIsWafCaptchaResponse.mockReturnValue(false);
  mockHandleWafCaptcha.mockReturnValue(true);
  mockGetSessionId.mockReturnValue('test-session-id');
  mockOpenSessionToken.mockResolvedValue(null);
  mockRecoverOpenSession.mockResolvedValue(null);

  token = null;
  registerSessionHooks({ getToken: () => token, onUnauthorized, onForbidden, onTokenRefreshed });

  fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({}));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
});

describe('request', () => {
  describe('the request it sends', () => {
    it('GETs the path under the page origin by default', async () => {
      await request('picsure/query/sync');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/picsure/query/sync',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('sends the given method', async () => {
      await request('psama/role', { method: 'DELETE' });
      expect(sent().method).toBe('DELETE');
    });

    it('appends query params, leaving out undefined values', async () => {
      await request('picsure/concepts', { query: { page_number: 0, page_size: 10, q: undefined } });
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://example.com/picsure/concepts?page_number=0&page_size=10',
      );
    });

    it('encodes query values and joins a path that already has a query', async () => {
      await request('picsure/values?x=1', { query: { query: 'a b&c', open: true } });
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://example.com/picsure/values?x=1&query=a+b%26c&open=true',
      );
    });

    it('sends a JSON body with its content type', async () => {
      const body = { key: 'value', nested: { a: 1 } };
      await request('picsure/test', { method: 'POST', body });

      expect(sent().headers['Content-Type']).toBe('application/json');
      expect(sent().body).toBe(JSON.stringify(body));
    });

    it('sends a string body as it is', async () => {
      await request('picsure/test', { method: 'POST', body: '\\a\\b\\' });
      expect(sent().body).toBe('\\a\\b\\');
    });

    it('sends no body or content type without one', async () => {
      await request('picsure/test');

      expect(sent().headers['Content-Type']).toBeUndefined();
      expect(sent().body).toBeUndefined();
    });

    it('lets custom headers override the content type but not the credentials', async () => {
      token = 'my-token';
      await request('picsure/test', {
        method: 'POST',
        body: {},
        headers: { 'Content-Type': 'text/plain', Authorization: 'Bearer other', 'X-Custom': 'hi' },
      });

      expect(sent().headers).toMatchObject({
        'Content-Type': 'text/plain',
        Authorization: 'Bearer my-token',
        'X-Custom': 'hi',
      });
    });

    it('sends the session id from telemetry', async () => {
      mockGetSessionId.mockReturnValue('custom-session-42');
      await request('picsure/test');
      expect(sent().headers['X-Session-Id']).toBe('custom-session-42');
    });

    it('uses the fetch it is given', async () => {
      const kitFetch = vi.fn().mockResolvedValue(mockFetchResponse({ body: '{"a":1}' }));

      await expect(request('picsure/test', { fetch: kitFetch })).resolves.toEqual({ a: 1 });

      expect(kitFetch).toHaveBeenCalledWith('https://example.com/picsure/test', expect.any(Object));
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('credentials', () => {
    it.each(['user', 'open'] as const)(
      'auth %s sends the signed-in user token as Authorized',
      async (auth) => {
        token = 'my-token';
        mockOpenSessionToken.mockResolvedValue(SESSION);
        await request('picsure/test', { auth });

        expect(sent().headers['Authorization']).toBe('Bearer my-token');
        expect(sent().headers['request-source']).toBe('Authorized');
        expect(mockOpenSessionToken).not.toHaveBeenCalled();
      },
    );

    it('auth user goes keyless and without a session when nobody is signed in', async () => {
      mockOpenSessionToken.mockResolvedValue(SESSION);
      await request('psama/open/validate');

      expect(sent().headers['Authorization']).toBeUndefined();
      expect(sent().headers['request-source']).toBe('Open');
      expect(mockOpenSessionToken).not.toHaveBeenCalled();
    });

    it('auth open sends the open-access session when nobody is signed in', async () => {
      mockOpenSessionToken.mockResolvedValue(SESSION);
      await request('picsure/query/sync', { auth: 'open' });

      expect(sent().headers['Authorization']).toBe(`Bearer ${SESSION}`);
      expect(sent().headers['request-source']).toBe('Open');
    });

    it('auth open goes keyless when there is no session', async () => {
      await request('picsure/query/sync', { auth: 'open' });
      expect(sent().headers['Authorization']).toBeUndefined();
    });

    it('auth none sends neither the token nor a session', async () => {
      token = 'my-token';
      mockOpenSessionToken.mockResolvedValue(SESSION);
      await request('psama/open/apiKey', { auth: 'none' });

      expect(sent().headers['Authorization']).toBeUndefined();
      expect(sent().headers['request-source']).toBe('Open');
      expect(mockOpenSessionToken).not.toHaveBeenCalled();
    });

    it('sends no credentials or session id outside the browser', async () => {
      mockBrowser = false;
      token = 'my-token';
      await request('picsure/test', { auth: 'open' });

      expect(sent().headers['Authorization']).toBeUndefined();
      expect(sent().headers['request-source']).toBeUndefined();
      expect(sent().headers['X-Session-Id']).toBeUndefined();
      expect(mockGetSessionId).not.toHaveBeenCalled();
    });

    it('requests a root-relative URL outside the browser, where window is missing', async () => {
      mockBrowser = false;
      vi.stubGlobal('window', undefined);
      const kitFetch = vi.fn().mockResolvedValue(mockFetchResponse({}));

      await request('picsure/test', { query: { a: 1 }, fetch: kitFetch });

      expect(kitFetch).toHaveBeenCalledWith('/picsure/test?a=1', expect.any(Object));
    });
  });

  describe('a successful response', () => {
    it('resolves with parsed JSON', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ body: '{"result": "success"}' }));
      await expect(request('picsure/test')).resolves.toEqual({ result: 'success' });
    });

    it('resolves with the text when it is not JSON', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ body: 'plain text response' }));
      await expect(request('picsure/test')).resolves.toBe('plain text response');
    });

    it('resolves with an ArrayBuffer for octet-stream', async () => {
      const buffer = new ArrayBuffer(8);
      fetchMock.mockResolvedValue(
        mockFetchResponse({ contentType: 'application/octet-stream', arrayBuffer: buffer }),
      );
      await expect(request('picsure/test')).resolves.toBe(buffer);
    });

    it('hands a refreshed token to the session', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ headers: { Authorization: 'Bearer new-token-123' } }),
      );
      await request('picsure/test');
      expect(onTokenRefreshed).toHaveBeenCalledWith('new-token-123');
    });

    it('leaves the session alone without a refreshed token', async () => {
      await request('picsure/test');
      expect(onTokenRefreshed).not.toHaveBeenCalled();
    });
  });

  describe('a failed response', () => {
    it('rejects with the status, parsed body and raw text, and logs it', async () => {
      const text = '{"errorType":"error","message":"bad"}';
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 500, body: text }));

      const e = await rejection(request('picsure/test'));

      expect(e).toMatchObject({ status: 500, code: 'http', message: text });
      expect(e.body).toEqual({ errorType: 'error', message: 'bad' });
      expect(mockCreateLog).toHaveBeenCalledWith('ERROR', 'error.unknown', undefined, {
        status: 500,
        error: { message: text },
      });
      expect(onUnauthorized).not.toHaveBeenCalled();
      expect(onForbidden).not.toHaveBeenCalled();
    });

    it('rejects a 422 like any other failure', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ ok: false, status: 422, body: '{"errors": ["invalid"]}' }),
      );

      const e = await rejection(request('picsure/test'));

      expect(e).toMatchObject({ status: 422, code: 'http', body: { errors: ['invalid'] } });
    });

    it('ends the session on a 401 for a signed-in request', async () => {
      token = 'my-token';
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 401, body: 'expired' }));

      const e = await rejection(request('picsure/test'));

      expect(e).toMatchObject({ status: 401, code: 'unauthorized', message: 'expired' });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(mockCreateLog).toHaveBeenCalledWith('AUTH', 'session.unauthorized', undefined, {
        status: 401,
      });
    });

    it('ends the session on a 401 even when its body cannot be read', async () => {
      token = 'my-token';
      const response = mockFetchResponse({ ok: false, status: 401 });
      response.text.mockRejectedValue(new Error('stream broke'));
      fetchMock.mockResolvedValue(response);

      await expect(request('picsure/test')).rejects.toThrow('stream broke');

      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('ends the session on a 401 for a keyless request', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 401, body: '' }));

      await rejection(request('psama/user/me'));

      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('leaves the session alone on a 401 for an anonymous open request', async () => {
      mockOpenSessionToken.mockResolvedValue(SESSION);
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 401, body: 'nope' }));

      const e = await rejection(request('picsure/query/sync', { auth: 'open' }));

      expect(e).toMatchObject({ status: 401, code: 'http' });
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('ends the session on a 403', async () => {
      token = 'my-token';
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 403, body: 'Forbidden' }));

      const e = await rejection(request('picsure/test'));

      expect(e).toMatchObject({ status: 403, code: 'forbidden', message: 'Forbidden' });
      expect(onForbidden).toHaveBeenCalledTimes(1);
      expect(mockCreateLog).toHaveBeenCalledWith('AUTH', 'session.forbidden', undefined, {
        status: 403,
      });
      expect(mockCreateLog).toHaveBeenCalledWith('ERROR', 'error.unknown', undefined, {
        status: 403,
        error: { message: 'Forbidden' },
      });
    });

    it('reports a consent denial with its message and keeps the session', async () => {
      const body = { errorType: 'consent_denied', message: 'Consent for phs000007 was withdrawn' };
      fetchMock.mockResolvedValue(
        mockFetchResponse({ ok: false, status: 403, body: JSON.stringify(body) }),
      );

      const e = await rejection(request('picsure/test'));

      expect(e).toMatchObject({ status: 403, code: 'consent_denied', body });
      expect(e.message).toBe('Consent for phs000007 was withdrawn');
      expect(onForbidden).not.toHaveBeenCalled();
    });
  });

  describe('WAF CAPTCHA recovery', () => {
    const wafResponse = (status = 405) =>
      mockFetchResponse({
        ok: false,
        status,
        headers: { 'x-amzn-waf-action': 'captcha' },
        body: '<html>waf interstitial</html>',
        contentType: 'text/html',
      });

    beforeEach(() => {
      mockWafFlag = true;
      mockIsWafCaptchaResponse.mockReturnValue(true);
    });

    it('never settles and stays silent when a reload is imminent', async () => {
      fetchMock.mockResolvedValue(wafResponse());

      expect(await settles(request('picsure/test'))).toBe(false);

      expect(mockHandleWafCaptcha).toHaveBeenCalledWith('/picsure/test');
      expect(mockLog).not.toHaveBeenCalled();
    });

    it('rejects as a plain failure, without ending the session, when the loop guard trips', async () => {
      token = 'my-token';
      mockHandleWafCaptcha.mockReturnValue(false);
      fetchMock.mockResolvedValue(wafResponse(403));

      const e = await rejection(request('picsure/test'));

      expect(e).toMatchObject({ status: 403, code: 'http' });
      expect(onForbidden).not.toHaveBeenCalled();
      expect(mockCreateLog).toHaveBeenCalledWith('ERROR', 'error.unknown', undefined, {
        status: 403,
        error: { message: '<html>waf interstitial</html>' },
      });
    });

    it('is off when the feature flag is off', async () => {
      mockWafFlag = false;
      fetchMock.mockResolvedValue(wafResponse());

      await rejection(request('picsure/test'));

      expect(mockIsWafCaptchaResponse).not.toHaveBeenCalled();
      expect(mockHandleWafCaptcha).not.toHaveBeenCalled();
    });

    it('is off outside the browser', async () => {
      mockBrowser = false;
      fetchMock.mockResolvedValue(wafResponse());

      await rejection(request('picsure/test'));

      expect(mockHandleWafCaptcha).not.toHaveBeenCalled();
    });

    it('leaves other failures alone', async () => {
      mockIsWafCaptchaResponse.mockReturnValue(false);
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 405, body: 'nope' }));

      await expect(rejection(request('picsure/test'))).resolves.toMatchObject({ message: 'nope' });

      expect(mockHandleWafCaptcha).not.toHaveBeenCalled();
    });
  });

  describe('open-access sessions', () => {
    const keyError = (errorType: string) =>
      mockFetchResponse({
        ok: false,
        status: 401,
        body: JSON.stringify({ errorType, message: 'x', requestId: null }),
      });
    const open = (opts = {}) => request('picsure/query/sync', { auth: 'open', ...opts });

    beforeEach(() => {
      mockOpenSessionToken.mockResolvedValue(SESSION);
    });

    it('offers every open response to the refresh handler', async () => {
      await open();
      expect(mockAcceptSessionRefresh).toHaveBeenCalledWith(await fetchMock.mock.results[0].value);
    });

    it('retries once with the recovered session after a key-caused 401', async () => {
      mockRecoverOpenSession.mockResolvedValue('picsure_s_new.payload.signature');
      fetchMock
        .mockResolvedValueOnce(keyError('api_key_invalid'))
        .mockResolvedValueOnce(mockFetchResponse({ body: '{"ok":true}' }));

      await expect(open()).resolves.toEqual({ ok: true });

      expect(mockRecoverOpenSession).toHaveBeenCalledWith(SESSION);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(sent(1).headers['Authorization']).toBe('Bearer picsure_s_new.payload.signature');
      expect(sent(1).redirect).toBe('error');
      expect(mockAcceptSessionRefresh).toHaveBeenLastCalledWith(
        await fetchMock.mock.results[1].value,
      );
      expect(mockForgetOpenSession).not.toHaveBeenCalled();
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('retries with the fetch it is given', async () => {
      mockRecoverOpenSession.mockResolvedValue('picsure_s_new.payload.signature');
      const kitFetch = vi
        .fn()
        .mockResolvedValueOnce(keyError('api_key_invalid'))
        .mockResolvedValueOnce(mockFetchResponse({}));

      await open({ fetch: kitFetch });

      expect(kitFetch).toHaveBeenCalledTimes(2);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces a second key-caused 401 and forgets the retry token', async () => {
      mockRecoverOpenSession.mockResolvedValue('picsure_s_new.payload.signature');
      fetchMock.mockResolvedValue(keyError('api_key_invalid'));

      await expect(rejection(open())).resolves.toMatchObject({ status: 401, code: 'http' });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(mockRecoverOpenSession).toHaveBeenCalledTimes(1);
      expect(mockForgetOpenSession).toHaveBeenCalledWith('picsure_s_new.payload.signature');
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('logs a rejected session without the token', async () => {
      fetchMock.mockResolvedValue(keyError('api_key_invalid'));

      await rejection(open());

      expect(mockCreateLog).toHaveBeenCalledWith('AUTH', 'open_session.rejected', undefined, {
        status: 401,
      });
      expect(JSON.stringify(mockCreateLog.mock.calls)).not.toContain(SESSION);
    });

    it.each([
      ['a 401 without an error code', mockFetchResponse({ ok: false, status: 401, body: 'no' })],
      ['a 401 from the access rules', keyError('unauthorized')],
    ])('neither retries nor ends the session on %s', async (_name, response) => {
      fetchMock.mockResolvedValue(response);

      await rejection(open());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockRecoverOpenSession).not.toHaveBeenCalled();
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('does not retry a keyless request', async () => {
      mockOpenSessionToken.mockResolvedValue(null);
      fetchMock.mockResolvedValue(keyError('api_key_missing'));

      await rejection(open());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockRecoverOpenSession).not.toHaveBeenCalled();
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('gives up when recovery has no session to offer', async () => {
      fetchMock.mockResolvedValue(keyError('api_key_invalid'));

      await rejection(open());

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('refuses redirects on a request carrying the session, and only then', async () => {
      mockOpenSessionToken.mockResolvedValueOnce(SESSION).mockResolvedValueOnce(null);
      await open();
      await open();

      expect(sent(0).redirect).toBe('error');
      expect('redirect' in sent(1)).toBe(false);
    });

    it('stops waiting for an acquisition when the request is aborted', async () => {
      mockOpenSessionToken.mockReturnValue(new Promise(() => {}));
      const controller = new AbortController();

      const pending = open({ signal: controller.signal });
      controller.abort();

      await expect(pending).rejects.toSatisfy(isAbortError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('abort signal', () => {
    it('forwards a signal to fetch', async () => {
      const controller = new AbortController();
      await request('picsure/query', { signal: controller.signal });
      expect(sent().signal).toBe(controller.signal);
    });

    it('omits the signal when none is given', async () => {
      await request('picsure/query');
      expect('signal' in sent()).toBe(false);
    });

    it('rejects with the abort error without touching the session or logging', async () => {
      token = 'my-token';
      fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));

      await expect(request('picsure/test')).rejects.toThrow('aborted');

      expect(onUnauthorized).not.toHaveBeenCalled();
      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe('softFail', () => {
    it('is never cached', async () => {
      await request('picsure/operations/banners/active', { softFail: true });
      expect(sent().cache).toBe('no-store');
    });

    it('is cached as usual without softFail', async () => {
      await request('picsure/operations/banners/active');
      expect('cache' in sent()).toBe(false);
    });

    it.each([401, 403, 500])(
      'resolves undefined on a %i without touching the session or logging',
      async (status) => {
        token = 'my-token';
        fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status, body: 'x' }));

        await expect(request('picsure/test', { softFail: true })).resolves.toBeUndefined();

        expect(onUnauthorized).not.toHaveBeenCalled();
        expect(onForbidden).not.toHaveBeenCalled();
        expect(mockLog).not.toHaveBeenCalled();
      },
    );

    it('does not reload for a WAF CAPTCHA', async () => {
      mockWafFlag = true;
      mockIsWafCaptchaResponse.mockReturnValue(true);
      fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 405 }));

      await expect(request('picsure/test', { softFail: true })).resolves.toBeUndefined();

      expect(mockHandleWafCaptcha).not.toHaveBeenCalled();
    });

    it('resolves undefined when the network fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(request('picsure/test', { softFail: true })).resolves.toBeUndefined();
    });

    it('still rejects an abort', async () => {
      fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
      await expect(request('picsure/test', { softFail: true })).rejects.toSatisfy(isAbortError);
    });

    it('resolves the body on success, without refreshing the token', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse({ body: '[1]', headers: { Authorization: 'Bearer new-token' } }),
      );

      await expect(request('picsure/test', { softFail: true })).resolves.toEqual([1]);

      expect(onTokenRefreshed).not.toHaveBeenCalled();
    });
  });
});

describe('the legacy helpers', () => {
  it.each([
    ['get', () => get('picsure/query'), 'GET'],
    ['del', () => del('picsure/query'), 'DELETE'],
    ['post', () => post('picsure/query', { foo: 'bar' }), 'POST'],
    ['put', () => put('picsure/query', { foo: 'bar' }), 'PUT'],
    ['patch', () => patch('picsure/query', { foo: 'bar' }), 'PATCH'],
  ])('%s() sends a %s request', async (_name, call, method) => {
    await call();
    expect(sent().method).toBe(method);
  });

  it('sends data as the body, and no body for empty data', async () => {
    await post('psama/role', { foo: 'bar' });
    await post('psama/role', '');

    expect(sent(0).body).toBe('{"foo":"bar"}');
    expect(sent(1).body).toBeUndefined();
    expect(sent(1).headers['Content-Type']).toBeUndefined();
  });

  it('merges custom headers', async () => {
    token = 'my-token';
    await get('picsure/test', { 'X-Custom': 'hello' });

    expect(sent().headers).toMatchObject({
      'X-Custom': 'hello',
      Authorization: 'Bearer my-token',
      'X-Session-Id': 'test-session-id',
    });
  });

  it('gives an anonymous picsure request the open-access session', async () => {
    mockOpenSessionToken.mockResolvedValue(SESSION);
    await get('picsure/query/sync');
    expect(sent().headers['Authorization']).toBe(`Bearer ${SESSION}`);
  });

  it('gives an anonymous request elsewhere no session', async () => {
    mockOpenSessionToken.mockResolvedValue(SESSION);
    await get('psama/open/validate');

    expect(mockOpenSessionToken).not.toHaveBeenCalled();
    expect(sent().headers['Authorization']).toBeUndefined();
  });

  it('sends a picsure request as anonymous with authenticate=false', async () => {
    token = 'my-token';
    mockOpenSessionToken.mockResolvedValue(SESSION);
    await post('picsure/query/sync', {}, undefined, false);

    expect(sent().headers['Authorization']).toBe(`Bearer ${SESSION}`);
    expect(sent().headers['request-source']).toBe('Open');
  });

  it('sends no credentials elsewhere with authenticate=false', async () => {
    token = 'my-token';
    mockOpenSessionToken.mockResolvedValue(SESSION);
    await post('psama/open/apiKey', {}, undefined, false);

    expect(sent().headers['Authorization']).toBeUndefined();
    expect(mockOpenSessionToken).not.toHaveBeenCalled();
  });

  it('forwards a signal, and omits it when none is given', async () => {
    const controller = new AbortController();
    await post('picsure/query', {}, undefined, undefined, { signal: controller.signal });
    await post('picsure/query', {}, undefined, undefined, {});

    expect(sent(0).signal).toBe(controller.signal);
    expect('signal' in sent(1)).toBe(false);
  });

  it('resolves a 422 with its body', async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse({ ok: false, status: 422, body: '{"errors": ["invalid"]}' }),
    );
    await expect(get('picsure/test')).resolves.toEqual({ errors: ['invalid'] });
  });

  it('resolves undefined on a 401 that ends the session', async () => {
    token = 'my-token';
    fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 401, body: 'expired' }));

    await expect(get('picsure/test')).resolves.toBeUndefined();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('rejects other failures with an ApiError', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 409, body: 'in use' }));
    await expect(rejection(del('psama/role/1'))).resolves.toMatchObject({ status: 409 });
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
