// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { get } from 'svelte/store';

const navigations = vi.hoisted(
  () => [] as Array<{ resolve: () => void; reject: (error: Error) => void }>,
);
const mockApiGet = vi.hoisted(() => vi.fn());

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));
vi.mock('$app/navigation', () => ({
  goto: () => new Promise<void>((resolve, reject) => navigations.push({ resolve, reject })),
}));
vi.mock('#lib/api.ts', () => ({ get: (...args: unknown[]) => mockApiGet(...args) }));
vi.mock('#lib/logger.ts', () => ({ createLog: vi.fn(), log: vi.fn() }));

import { discardingQuery } from '#lib/discardingQuery.ts';
import { createLog } from '#lib/logger.ts';
import { logout } from '#lib/stores/User.ts';
import type AuthProvider from '#lib/models/AuthProvider.ts';

async function settle() {
  await new Promise((resolve) => setTimeout(resolve));
}

describe('logout while the query is being discarded', () => {
  beforeEach(() => {
    navigations.length = 0;
    localStorage.setItem('token', 'token');
    discardingQuery.set(true);
  });

  it('lowers the discard once the logout has navigated', async () => {
    mockApiGet.mockResolvedValue({});

    const loggedOut = logout(undefined, false);
    await settle();
    expect(get(discardingQuery)).toBe(true);

    navigations[0].resolve();
    await loggedOut;
    await settle();
    expect(get(discardingQuery)).toBe(false);
  });

  it('lowers the discard when the logout navigation fails', async () => {
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

    expect(get(discardingQuery)).toBe(false);
  });

  it('waits for the navigation of a later logout that supersedes the first', async () => {
    mockApiGet.mockResolvedValue({});

    logout(undefined, false);
    await settle();
    expect(navigations).toHaveLength(1);
    logout(undefined, false);
    await settle();
    expect(navigations).toHaveLength(2);

    navigations[0].resolve();
    await settle();
    expect(get(discardingQuery)).toBe(true);

    navigations[1].resolve();
    await settle();
    expect(get(discardingQuery)).toBe(false);
  });

  it('goes to the login page once when a provider logout returns no redirect', async () => {
    mockApiGet.mockResolvedValue({});
    vi.mocked(createLog).mockClear();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    onTestFinished(() => consoleError.mockRestore());
    const provider = { logout: async () => undefined } as unknown as AuthProvider;

    const loggedOut = logout(provider, false);
    await settle();
    navigations[0].resolve();
    await loggedOut;
    await settle();

    expect(navigations).toHaveLength(1);
    expect(
      vi.mocked(createLog).mock.calls.filter(([, event]) => event === 'logout.success'),
    ).toHaveLength(1);
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('logout and the query', () => {
  beforeEach(() => {
    navigations.length = 0;
    localStorage.setItem('token', 'token');
    discardingQuery.set(false);
    mockApiGet.mockResolvedValue({});
  });

  it('discards the query once a chosen logout has navigated', async () => {
    const raised: boolean[] = [];
    const unsubscribe = discardingQuery.subscribe((discard) => raised.push(discard));
    onTestFinished(unsubscribe);

    const loggedOut = logout(undefined, false, { discardQuery: true });
    await settle();
    expect(get(discardingQuery)).toBe(true);

    navigations[0].resolve();
    await loggedOut;
    await settle();
    expect(raised).toEqual([false, true, false]);
  });

  it('keeps the query when the session times out', async () => {
    const raised: boolean[] = [];
    const unsubscribe = discardingQuery.subscribe((discard) => raised.push(discard));
    onTestFinished(unsubscribe);

    const loggedOut = logout(undefined, true);
    await settle();
    navigations[0].resolve();
    await loggedOut;
    await settle();

    expect(raised).toEqual([false]);
  });
});
