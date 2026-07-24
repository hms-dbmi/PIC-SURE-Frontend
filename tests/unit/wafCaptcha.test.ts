import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockLog = vi.fn();
const mockCreateLog = vi.fn((...args: unknown[]) => args);
vi.mock('$lib/logger', () => ({
  log: (...args: unknown[]) => mockLog(...args),
  createLog: (...args: unknown[]) => mockCreateLog(...args),
}));

let mockIsOpen = true;
vi.mock('$lib/AccessState', () => ({
  isOpenAccess: () => mockIsOpen,
}));

const PENDING_KEY = 'waf-captcha-pending';
const GUARD_KEY = 'waf-captcha-guard';
const NOW = 1_700_000_000_000;

function makeResponse(status: number, headers: Record<string, string> = {}): Response {
  const map = new Map(Object.entries(headers));
  return {
    status,
    headers: { get: (key: string) => map.get(key) ?? null },
  } as unknown as Response;
}

describe('wafCaptcha', () => {
  let waf: typeof import('$lib/wafCaptcha');
  let reloadSpy: ReturnType<typeof vi.fn>;
  let storage: Record<string, string>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mockIsOpen = true;

    reloadSpy = vi.fn();
    vi.stubGlobal('window', { location: { reload: reloadSpy } });

    storage = {};
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    });

    // Fresh module instance per test to reset the module-level reload guard
    vi.resetModules();
    waf = await import('$lib/wafCaptcha');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('isWafCaptchaResponse', () => {
    it('matches 405 with x-amzn-waf-action: captcha', () => {
      expect(waf.isWafCaptchaResponse(makeResponse(405, { 'x-amzn-waf-action': 'captcha' }))).toBe(
        true,
      );
    });

    it('rejects 405 without the header', () => {
      expect(waf.isWafCaptchaResponse(makeResponse(405))).toBe(false);
    });

    it('rejects 405 with a different action value', () => {
      expect(
        waf.isWafCaptchaResponse(makeResponse(405, { 'x-amzn-waf-action': 'challenge' })),
      ).toBe(false);
    });

    it('rejects other statuses even with the header', () => {
      expect(waf.isWafCaptchaResponse(makeResponse(200, { 'x-amzn-waf-action': 'captcha' }))).toBe(
        false,
      );
      expect(waf.isWafCaptchaResponse(makeResponse(500, { 'x-amzn-waf-action': 'captcha' }))).toBe(
        false,
      );
    });
  });

  describe('handleWafCaptcha', () => {
    it('logs, stores pending state, and reloads on first detection', () => {
      const result = waf.handleWafCaptcha('/picsure/query/sync');

      expect(result).toBe(true);
      expect(JSON.parse(storage[PENDING_KEY])).toEqual({
        ts: NOW,
        path: '/picsure/query/sync',
        mode: 'open',
      });
      expect(storage[GUARD_KEY]).toBe(String(NOW));
      expect(mockCreateLog).toHaveBeenCalledWith(
        'ACTION',
        'waf.captcha_shown',
        { path: '/picsure/query/sync', mode: 'open' },
        { status: 405 },
      );
      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.anything(), { keepalive: true });
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('reports authorized mode when not in open access', () => {
      mockIsOpen = false;
      waf.handleWafCaptcha('/picsure/query/sync');

      expect(mockCreateLog).toHaveBeenCalledWith(
        'ACTION',
        'waf.captcha_shown',
        { path: '/picsure/query/sync', mode: 'authorized' },
        { status: 405 },
      );
    });

    it('dedupes a concurrent burst: one log and one reload per incident', () => {
      expect(waf.handleWafCaptcha('/picsure/a')).toBe(true);
      expect(waf.handleWafCaptcha('/picsure/b')).toBe(true);
      expect(waf.handleWafCaptcha('/picsure/c')).toBe(true);

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('trips the loop guard within 30s of a WAF reload: no reload, ERROR logged', () => {
      storage[GUARD_KEY] = String(NOW - 5_000);

      const result = waf.handleWafCaptcha('/picsure/query/sync');

      expect(result).toBe(false);
      expect(reloadSpy).not.toHaveBeenCalled();
      expect(mockCreateLog).toHaveBeenCalledWith(
        'ERROR',
        'waf.captcha_loop',
        { path: '/picsure/query/sync', mode: 'open' },
        { status: 405 },
      );
      expect(storage[PENDING_KEY]).toBeUndefined();
    });

    it('reloads normally once the loop guard window has expired', () => {
      storage[GUARD_KEY] = String(NOW - 31_000);

      expect(waf.handleWafCaptcha('/picsure/query/sync')).toBe(true);
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('logWafCaptchaResolution', () => {
    it('does nothing when no pending state exists', () => {
      waf.logWafCaptchaResolution();

      expect(mockLog).not.toHaveBeenCalled();
      expect(storage[GUARD_KEY]).toBeUndefined();
    });

    it('logs resolution with duration and clears pending state', () => {
      storage[PENDING_KEY] = JSON.stringify({
        ts: NOW - 45_000,
        path: '/picsure/query/sync',
        mode: 'open',
      });

      waf.logWafCaptchaResolution();

      expect(mockCreateLog).toHaveBeenCalledWith('ACTION', 'waf.captcha_resolved', {
        path: '/picsure/query/sync',
        mode: 'open',
        durationMs: 45_000,
      });
      expect(storage[PENDING_KEY]).toBeUndefined();
      expect(storage[GUARD_KEY]).toBe(String(NOW));
    });

    it('treats stale pending state as abandoned: cleared, no resolved log', () => {
      storage[PENDING_KEY] = JSON.stringify({
        ts: NOW - 11 * 60_000,
        path: '/picsure/query/sync',
        mode: 'open',
      });

      waf.logWafCaptchaResolution();

      expect(mockLog).not.toHaveBeenCalled();
      expect(storage[PENDING_KEY]).toBeUndefined();
      expect(storage[GUARD_KEY]).toBeUndefined();
    });

    it('survives corrupt pending state without throwing', () => {
      storage[PENDING_KEY] = 'not json{';

      expect(() => waf.logWafCaptchaResolution()).not.toThrow();
      expect(mockLog).not.toHaveBeenCalled();
      expect(storage[PENDING_KEY]).toBeUndefined();
      expect(storage[GUARD_KEY]).toBeUndefined();
    });
  });
});
