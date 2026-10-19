// @vitest-environment happy-dom
// Only because Kit's client navigation module reads `window` on import; `browser` is false below.

import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: false }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  registerSignedInUser: vi.fn(),
}));

import { session } from '#lib/auth/session.svelte.ts';

describe('the session during server rendering', () => {
  it.each([
    ['setToken', () => session.setToken('token')],
    ['removeToken', () => session.removeToken()],
    ['clear', () => session.clear()],
    ['user', () => (session.user = { email: 'someone@example.com' })],
    [
      'connect',
      () =>
        session.connect({
          navigate() {},
          currentUrl: () => new URL('http://x'),
          showAccessUnavailable() {},
        }),
    ],
  ])('throws on %s and leaves the session signed out', (_, write) => {
    expect(write).toThrow('session is browser-only and was written during server rendering.');
    expect(session.isLoggedIn).toBe(false);
    expect(session.user).toEqual({});
  });
});
