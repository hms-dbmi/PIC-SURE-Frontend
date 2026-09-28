// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writable } from 'svelte/store';

// the real api.ts and openSession.ts together; only the Turnstile solve and the network are faked

vi.mock('$app/environment', () => ({ browser: true }));

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

vi.mock('@sveltejs/kit', () => ({
  error: (status: number, body: string | { message: string }) => {
    throw new Error(`${status}: ${typeof body === 'string' ? body : body.message}`);
  },
  isHttpError: () => false,
}));

vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { wafCaptchaRecovery: false } },
}));
vi.mock('$lib/wafCaptcha', () => ({
  isWafCaptchaResponse: () => false,
  handleWafCaptcha: () => false,
}));

const mockSolve = vi.fn<(sitekey: string, action: string) => Promise<string>>();
vi.mock('$lib/sessionChallenge', () => ({
  challengeState: writable('idle'),
  solveSessionChallenge: (sitekey: string, action: string) => mockSolve(sitekey, action),
}));

const STORAGE_KEY = 'open-session';
const NOW = Date.parse('2026-09-28T12:00:00Z');

function b64url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function session(sub: string, expSeconds: number): string {
  return `picsure_s_${b64url({ alg: 'HS256' })}.${b64url({ sub, exp: expSeconds, iss: 'psama' })}.sig-${sub}-${expSeconds}`;
}

const nowSeconds = NOW / 1000;
const T1 = session('11111111-1111-4111-8111-111111111111', nowSeconds + 900);
const T2 = session('22222222-2222-4222-8222-222222222222', nowSeconds + 900);

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

const keyInvalid = () => json(401, { errorType: 'api_key_invalid', message: 'x', requestId: null });

type Handler = (url: string, init: RequestInit) => Promise<Response> | Response;

describe('open-access sessions through api.ts', () => {
  let issued: string[];
  let issuance: Handler;
  let data: Handler;
  let fetchMock: ReturnType<typeof vi.fn>;
  let api: typeof import('$lib/api');

  function apiKeyOf(init: RequestInit): string | undefined {
    return (init.headers as Record<string, string>)['X-PICSURE-API-Key'];
  }

  function dataCalls(): RequestInit[] {
    return fetchMock.mock.calls
      .filter(([url]) => !String(url).includes('psama/open/session'))
      .map(([, init]) => init as RequestInit);
  }

  function issuanceCalls(): RequestInit[] {
    return fetchMock.mock.calls
      .filter(([url]) => String(url).includes('psama/open/session'))
      .map(([, init]) => init as RequestInit);
  }

  beforeEach(async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_TURNSTILE_SESSION_SITE_KEY', '');
    localStorage.clear();
    issued = [T1, T2];
    issuance = () => json(200, { token: issued.shift(), expiresAt: '2026-09-28T12:15:00Z' });
    data = () => json(200, { ok: true });
    fetchMock = vi.fn((url: string, init: RequestInit) =>
      Promise.resolve(url.includes('psama/open/session') ? issuance(url, init) : data(url, init)),
    );
    vi.stubGlobal('fetch', fetchMock);
    // fresh module state (single-flight promise, "sessions unavailable") for every test
    api = await import('$lib/api');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('acquires a session for the first open request, then sends it', async () => {
    await api.get('picsure/query/sync');

    expect(issuanceCalls()).toHaveLength(1);
    expect(apiKeyOf(dataCalls()[0])).toBe(T1);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(T1);
  });

  it('solves Turnstile once for ten parallel requests on a cold start', async () => {
    vi.stubEnv('VITE_TURNSTILE_SESSION_SITE_KEY', '0x-session-sitekey');
    mockSolve.mockResolvedValue('turnstile-token');

    await Promise.all(Array.from({ length: 10 }, () => api.get('picsure/query/sync')));

    expect(mockSolve).toHaveBeenCalledTimes(1);
    expect(mockSolve).toHaveBeenCalledWith('0x-session-sitekey', 'open-access-session');
    expect(issuanceCalls()).toHaveLength(1);
    expect(JSON.parse(issuanceCalls()[0].body as string)).toEqual({
      captchaToken: 'turnstile-token',
    });
    expect(dataCalls().map(apiKeyOf)).toEqual(Array(10).fill(T1));
  });

  it('uses the configured session action', async () => {
    vi.stubEnv('VITE_TURNSTILE_SESSION_SITE_KEY', '0x-session-sitekey');
    vi.stubEnv('VITE_TURNSTILE_SESSION_ACTION', 'custom-session-action');
    mockSolve.mockResolvedValue('turnstile-token');

    await api.get('picsure/query/sync');

    expect(mockSolve).toHaveBeenCalledWith('0x-session-sitekey', 'custom-session-action');
  });

  it('posts without a captcha token when no session sitekey is configured', async () => {
    await api.get('picsure/query/sync');

    expect(mockSolve).not.toHaveBeenCalled();
    expect(JSON.parse(issuanceCalls()[0].body as string)).toEqual({});
  });

  it('reuses a live stored session without acquiring', async () => {
    localStorage.setItem(STORAGE_KEY, T2);

    await api.get('picsure/query/sync');

    expect(issuanceCalls()).toHaveLength(0);
    expect(apiKeyOf(dataCalls()[0])).toBe(T2);
  });

  it('renews an expired stored session before sending, with no 401 round trip', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      session('33333333-3333-4333-8333-333333333333', nowSeconds - 1),
    );

    await api.get('picsure/query/sync');

    expect(issuanceCalls()).toHaveLength(1);
    expect(dataCalls()).toHaveLength(1);
    expect(apiKeyOf(dataCalls()[0])).toBe(T1);
  });

  it('stores a refresh for the same session and sends it next', async () => {
    localStorage.setItem(STORAGE_KEY, T1);
    const refreshed = session('11111111-1111-4111-8111-111111111111', nowSeconds + 1200);
    data = () => json(200, { ok: true }, { 'X-PICSURE-Session-Refresh': refreshed });

    await api.get('picsure/query/sync');
    data = () => json(200, { ok: true });
    await api.get('picsure/query/sync');

    expect(localStorage.getItem(STORAGE_KEY)).toBe(refreshed);
    expect(apiKeyOf(dataCalls()[1])).toBe(refreshed);
  });

  it('drops a refresh for a different session', async () => {
    localStorage.setItem(STORAGE_KEY, T1);
    data = () =>
      json(
        200,
        { ok: true },
        {
          'X-PICSURE-Session-Refresh': session(
            '99999999-9999-4999-8999-999999999999',
            nowSeconds + 1200,
          ),
        },
      );

    await api.get('picsure/query/sync');

    expect(localStorage.getItem(STORAGE_KEY)).toBe(T1);
  });

  it('drops a refresh that expires no later than the stored session', async () => {
    const newer = session('11111111-1111-4111-8111-111111111111', nowSeconds + 1200);
    localStorage.setItem(STORAGE_KEY, newer);
    data = () => json(200, { ok: true }, { 'X-PICSURE-Session-Refresh': T1 });

    await api.get('picsure/query/sync');

    expect(localStorage.getItem(STORAGE_KEY)).toBe(newer);
  });

  it('drops a refresh when nothing is stored', async () => {
    issuance = () => json(404, 'Open-access sessions are not enabled on this deployment.');
    data = () => json(200, { ok: true }, { 'X-PICSURE-Session-Refresh': T1 });

    await api.get('picsure/query/sync');

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('replaces a rejected session and retries once, without logging out', async () => {
    localStorage.setItem(STORAGE_KEY, T1);
    issued = [T2];
    data = (_url, init) => (apiKeyOf(init) === T1 ? keyInvalid() : json(200, { ok: true }));

    await expect(api.get('picsure/query/sync')).resolves.toEqual({ ok: true });

    expect(dataCalls().map(apiKeyOf)).toEqual([T1, T2]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(T2);
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('keeps the session another request recovered when a stale 401 arrives late', async () => {
    localStorage.setItem(STORAGE_KEY, T1);
    issued = [T2];
    let failA: () => void = () => {};
    let failB: () => void = () => {};
    data = (url, init) => {
      if (apiKeyOf(init) !== T1) return json(200, { ok: true });
      return new Promise<Response>((resolve) => {
        if (url.includes('/a')) failA = () => resolve(keyInvalid());
        else failB = () => resolve(keyInvalid());
      });
    };

    const a = api.get('picsure/a');
    const b = api.get('picsure/b');
    await vi.waitFor(() => expect(dataCalls()).toHaveLength(2));
    failA();
    await expect(a).resolves.toEqual({ ok: true });
    failB();
    await expect(b).resolves.toEqual({ ok: true });

    expect(issuanceCalls()).toHaveLength(1);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(T2);
    expect(dataCalls().map(apiKeyOf)).toEqual([T1, T1, T2, T2]);
  });

  it('joins the in-flight acquisition when a stale 401 arrives during it', async () => {
    localStorage.setItem(STORAGE_KEY, T1);
    let releaseIssuance: () => void = () => {};
    issuance = () =>
      new Promise<Response>((resolve) => {
        releaseIssuance = () => resolve(json(200, { token: T2 }));
      });
    let failB: () => void = () => {};
    data = (url, init) => {
      if (apiKeyOf(init) !== T1) return json(200, { ok: true });
      if (url.includes('/a')) return keyInvalid();
      return new Promise<Response>((resolve) => {
        failB = () => resolve(keyInvalid());
      });
    };

    const a = api.get('picsure/a');
    const b = api.get('picsure/b');
    await vi.waitFor(() => expect(issuanceCalls()).toHaveLength(1));
    failB();
    await vi.waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBeNull());
    releaseIssuance();

    await expect(a).resolves.toEqual({ ok: true });
    await expect(b).resolves.toEqual({ ok: true });
    expect(issuanceCalls()).toHaveLength(1);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(T2);
  });

  it('forgets a retry token that is rejected too, so the next request acquires', async () => {
    localStorage.setItem(STORAGE_KEY, T1);
    const T3 = session('33333333-3333-4333-8333-333333333333', nowSeconds + 900);
    issued = [T2, T3];
    data = (_url, init) => (apiKeyOf(init) === T3 ? json(200, { ok: true }) : keyInvalid());

    await expect(api.get('picsure/query/sync')).rejects.toThrow('401');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    await expect(api.get('picsure/query/sync')).resolves.toEqual({ ok: true });

    expect(dataCalls().map(apiKeyOf)).toEqual([T1, T2, T3]);
  });

  it('keeps using a fresh session when the browser clock runs fast', async () => {
    // PSAMA's clock is NOW; this browser thinks it is an hour later
    vi.setSystemTime(NOW + 3_600_000);
    const withIat = (sub: string) =>
      `picsure_s_${b64url({ alg: 'HS256' })}.${b64url({ sub, iat: nowSeconds, exp: nowSeconds + 900 })}.sig`;
    issued = [withIat('44444444-4444-4444-8444-444444444444')];

    await api.get('picsure/query/sync');
    await api.get('picsure/query/sync');

    expect(issuanceCalls()).toHaveLength(1);
  });

  it('still sends the session when storage refuses to keep it', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    await expect(api.get('picsure/query/sync')).resolves.toEqual({ ok: true });

    expect(apiKeyOf(dataCalls()[0])).toBe(T1);
  });

  it('marks issuance as anonymous traffic and refuses redirects', async () => {
    await api.get('picsure/query/sync');

    const init = issuanceCalls()[0];
    expect((init.headers as Record<string, string>)['request-source']).toBe('Open');
    expect(init.redirect).toBe('error');
    expect(init.method).toBe('POST');
  });

  it('reloads the page once "Try again" gets a session', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { origin: window.location.origin, reload });
    const { retryOpenSession } = await import('$lib/openSession');

    await retryOpenSession();

    expect(issuanceCalls()).toHaveLength(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload when "Try again" gets no session', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { origin: window.location.origin, reload });
    issuance = () => json(400, 'CAPTCHA verification failed.');
    const { retryOpenSession } = await import('$lib/openSession');

    await retryOpenSession();

    expect(reload).not.toHaveBeenCalled();
  });

  it('goes keyless when sessions are disabled, and does not ask again', async () => {
    issuance = () => json(404, 'Open-access sessions are not enabled on this deployment.');

    await api.get('picsure/query/sync');
    await api.get('picsure/query/sync');

    expect(issuanceCalls()).toHaveLength(1);
    expect(dataCalls().map(apiKeyOf)).toEqual([undefined, undefined]);
  });

  it('treats a failed CAPTCHA as retryable, not as sessions disabled', async () => {
    let refused = true;
    issuance = () =>
      refused ? json(400, 'CAPTCHA verification failed.') : json(200, { token: T1 });

    await api.get('picsure/query/sync');
    refused = false;
    await api.get('picsure/query/sync');

    expect(issuanceCalls()).toHaveLength(2);
    expect(dataCalls().map(apiKeyOf)).toEqual([undefined, T1]);
  });

  it('goes keyless without posting when the Turnstile solve fails', async () => {
    vi.stubEnv('VITE_TURNSTILE_SESSION_SITE_KEY', '0x-session-sitekey');
    mockSolve.mockRejectedValue(new Error('Turnstile could not verify this browser'));

    await api.get('picsure/query/sync');

    expect(issuanceCalls()).toHaveLength(0);
    expect(apiKeyOf(dataCalls()[0])).toBeUndefined();
  });

  it('ignores an issuance response without a session token', async () => {
    issuance = () => json(200, { token: 'not-a-session' });

    await api.get('picsure/query/sync');

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(apiKeyOf(dataCalls()[0])).toBeUndefined();
  });

  it('leaves the stored session alone for bearer requests', async () => {
    localStorage.setItem('token', 'user-bearer-token');
    localStorage.setItem(STORAGE_KEY, T1);

    await api.get('picsure/query/sync');

    expect(apiKeyOf(dataCalls()[0])).toBeUndefined();
    expect(issuanceCalls()).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(T1);
  });
});
