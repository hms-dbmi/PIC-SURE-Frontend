import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  registerSignedInUser: vi.fn(),
}));

import { session } from '#lib/auth/session.svelte.ts';

afterEach(() => {
  session.removeToken();
});

describe('a session started in another tab', () => {
  it('signs this tab in and out', () => {
    localStorage.setItem('token', 'from-another-tab');
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));

    expect(session.token).toBe('from-another-tab');

    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));

    expect(session.isLoggedIn).toBe(false);
  });
});
