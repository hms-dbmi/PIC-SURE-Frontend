// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { get } from 'svelte/store';

const navigations = vi.hoisted(
  () => [] as Array<{ resolve: () => void; reject: (error: Error) => void }>,
);
const mockApiGet = vi.hoisted(() => vi.fn());

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));
vi.mock('$app/navigation', () => ({
  goto: () => new Promise<void>((resolve, reject) => navigations.push({ resolve, reject })),
}));
vi.mock('$lib/api', () => ({ get: (...args: unknown[]) => mockApiGet(...args) }));
vi.mock('$lib/logger', () => ({ createLog: vi.fn(), log: vi.fn() }));

import { accessDenied } from '$lib/accessDenied';
import { logout } from '$lib/stores/User';

async function settle() {
  await new Promise((resolve) => setTimeout(resolve));
}

describe('logout after access is denied', () => {
  beforeEach(() => {
    navigations.length = 0;
    localStorage.setItem('token', 'token');
    accessDenied.set(true);
  });

  it('lowers access denied once the logout has navigated', async () => {
    mockApiGet.mockResolvedValue({});

    const loggedOut = logout(undefined, false);
    await settle();
    expect(get(accessDenied)).toBe(true);

    navigations[0].resolve();
    await loggedOut;
    await settle();
    expect(get(accessDenied)).toBe(false);
  });

  it('lowers access denied when the logout navigation fails', async () => {
    mockApiGet.mockResolvedValue({});

    // logout doesn't await its navigation, so the failure surfaces as an unhandled rejection
    const failure = new Error('navigation failed');
    const ignoreFailure = (reason: unknown) => {
      if (reason !== failure) throw reason;
    };
    process.on('unhandledRejection', ignoreFailure);
    onTestFinished(() => {
      process.off('unhandledRejection', ignoreFailure);
    });

    const loggedOut = logout(undefined, false);
    await settle();
    navigations[0].reject(failure);
    await loggedOut;
    await settle();

    expect(get(accessDenied)).toBe(false);
  });

  it('waits for the navigation that supersedes the first', async () => {
    mockApiGet.mockRejectedValue(new Error('psama unavailable'));

    logout(undefined, false);
    await settle();
    expect(navigations).toHaveLength(2);

    navigations[0].resolve();
    await settle();
    expect(get(accessDenied)).toBe(true);

    navigations[1].resolve();
    await settle();
    expect(get(accessDenied)).toBe(false);
  });
});
