import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));

vi.mock('#lib/auth/nav.ts', () => ({ routes: [] }));

import {
  sanitizeLocation,
  createLog,
  registerSignedInUser,
  isHashOnlyGoto,
} from '#lib/telemetry/logger.ts';

function stubLocation(href: string) {
  vi.stubGlobal('window', { location: new URL(href) });
}

describe('logger URL sanitization', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { userAgent: 'test-agent' });
    vi.stubGlobal('document', { referrer: '' });
    const storage: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    registerSignedInUser(() => undefined);
  });

  describe('sanitizeLocation', () => {
    it('strips the URL fragment entirely', () => {
      stubLocation('https://picsure.test/login/loading#access_token=SECRET&token_type=Bearer');

      const { url } = sanitizeLocation();

      expect(url).toBe('https://picsure.test/login/loading');
      expect(url).not.toContain('SECRET');
    });

    it('redacts sensitive query parameters in url and query_string', () => {
      stubLocation('https://picsure.test/login/loading?access_token=SECRET&code=ALSOSECRET&x=1');

      const { url, query_string } = sanitizeLocation();

      expect(url).not.toContain('SECRET');
      expect(query_string).not.toContain('SECRET');
      expect(url).toContain('access_token=redacted');
      expect(query_string).toContain('code=redacted');
      expect(query_string).toContain('x=1');
    });

    it('leaves ordinary URLs untouched', () => {
      stubLocation('https://picsure.test/discover?search=asthma');

      const { url, query_string } = sanitizeLocation();

      expect(url).toBe('https://picsure.test/discover?search=asthma');
      expect(query_string).toBe('?search=asthma');
    });
  });

  it('createLog records the sanitized URL, never the raw href', () => {
    stubLocation('https://picsure.test/login/loading?token=SECRET#access_token=SECRET');

    const event = createLog('AUTH', 'login.start');

    expect(event.url).toBe('https://picsure.test/login/loading?token=redacted');
    expect(event.query_string).toBe('?token=redacted');
    expect(JSON.stringify(event)).not.toContain('SECRET');
  });

  it('createLog describes nobody until a signed-in user is registered', () => {
    stubLocation('https://picsure.test/');

    expect(createLog('AUTH', 'login.start')).toMatchObject({ logged_in: false });
  });

  it('createLog describes the registered signed-in user', () => {
    stubLocation('https://picsure.test/');
    registerSignedInUser(() => ({
      userId: 'user-1',
      email: 'researcher@example.org',
      privileges: ['SUPER_ADMIN', 'DATA_ADMIN'],
    }));

    const event = createLog('AUTH', 'login.start');

    expect(event).toMatchObject({
      logged_in: true,
      user_id: 'user-1',
      user_email: 'researcher@example.org',
      roles: ['SUPER_ADMIN'],
    });
  });
});

describe('isHashOnlyGoto', () => {
  const at = (href: string) => ({ url: new URL(href) }) as never;

  it.each([
    ['a goto that only changes the hash', 'goto', '/api', '/api#api-access', true],
    ['a goto that keeps the query and changes the hash', 'goto', '/api?a=1', '/api?a=1#x', true],
    ['a goto to the same URL', 'goto', '/explorer?search=x', '/explorer?search=x', false],
    ['a goto that changes the query', 'goto', '/explorer', '/explorer?search=x', false],
    ['a goto to another path', 'goto', '/api', '/login#x', false],
    ['Back between sections', 'popstate', '/api#a', '/api#b', false],
    ['a hash link click', 'link', '/api', '/api#a', false],
  ])('%s', (_name, type, from, to, expected) => {
    expect(
      isHashOnlyGoto({
        type: type as 'goto',
        from: at(`https://example.org${from}`),
        to: at(`https://example.org${to}`),
      }),
    ).toBe(expected);
  });

  it('is false on the first page load, which has no from', () => {
    expect(isHashOnlyGoto({ type: 'enter', from: null, to: at('https://example.org/api#a') })).toBe(
      false,
    );
  });
});
