// @vitest-environment happy-dom

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  getSessionId: () => 'session-id',
  registerSignedInUser: vi.fn(),
}));

import { request } from '#lib/api/client.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { config } from '#lib/config/config.svelte.ts';

const navigations: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
session.connect({
  navigate: () => new Promise<void>((resolve, reject) => navigations.push({ resolve, reject })),
  currentUrl: () => new URL('http://localhost/explorer'),
  showAccessUnavailable: vi.fn(),
});

const events: string[] = [];
session.onAccessDenied(() => {
  events.push('denied');
  return () => events.push('lifted');
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve));
}

/** Answers the first request with `status`, and every later one (PSAMA's logout) with `{}`. */
function respondFirstWith(status: number, body = '') {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response(body, { status }))
      .mockResolvedValue(new Response('{}')),
  );
}

/** An unsigned JWT for `sub`; `jti` tells apart two tokens for the same user. */
function jwt(sub: string, jti: string): string {
  const encode = (part: object) => btoa(JSON.stringify(part)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${encode({ alg: 'none' })}.${encode({ sub, jti, exp })}.signature`;
}

/** Holds the first request open and returns what answers it with a 403. Later requests get `{}`. */
function forbidOnceInFlight(): () => void {
  let respond: (response: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (respond = resolve)))
      .mockResolvedValue(new Response('{}')),
  );
  return () => respond(new Response('', { status: 403 }));
}

describe('a request the backend forbids', () => {
  beforeEach(() => {
    session.setToken('token');
    events.length = 0;
    navigations.length = 0;
  });

  afterEach(async () => {
    navigations.forEach((navigation) => navigation.resolve());
    await settle();
    session.clear();
    config.features.termsOfService = false;
    config.features.enforceTermsOfService = false;
    vi.unstubAllGlobals();
  });

  it('denies access before the logout navigates, and lifts it once the logout has', async () => {
    respondFirstWith(403);

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });
    expect(events).toEqual(['denied']);

    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    await settle();
    expect(events).toEqual(['denied']);

    navigations[0].resolve();
    await settle();
    expect(events).toEqual(['denied', 'lifted']);
  });

  it('lifts the denial when the logout navigation fails', async () => {
    respondFirstWith(403);
    // the logout doesn't wait for its navigation, so the failure surfaces as an unhandled rejection
    const failure = new Error('navigation failed');
    const ignoreFailure = (reason: unknown) => {
      if (reason !== failure) throw reason;
    };
    process.on('unhandledRejection', ignoreFailure);
    onTestFinished(() => {
      process.off('unhandledRejection', ignoreFailure);
    });

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });
    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    navigations[0].reject(failure);
    await settle();

    expect(events).toEqual(['denied', 'lifted']);
  });

  it('waits for the navigation of a later logout that supersedes the first', async () => {
    respondFirstWith(403);

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });
    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    await settle();
    await session.logout();
    expect(navigations).toHaveLength(2);

    navigations[0].resolve();
    await settle();
    expect(events).toEqual(['denied']);

    navigations[1].resolve();
    await settle();
    expect(events).toEqual(['denied', 'lifted']);
  });

  it('denies nothing when the request went without the user’s token', async () => {
    session.clear();
    respondFirstWith(403);

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });

    expect(events).toEqual([]);
  });

  it('tells a listener added before the logout navigates, and lifts it with the rest', async () => {
    respondFirstWith(403);
    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });

    const late: string[] = [];
    const unsubscribe = session.onAccessDenied(() => {
      late.push('denied');
      return () => late.push('lifted');
    });
    onTestFinished(unsubscribe);
    expect(late).toEqual(['denied']);

    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    navigations[0].resolve();
    await settle();
    expect(late).toEqual(['denied', 'lifted']);
    expect(events).toEqual(['denied', 'lifted']);
  });

  it('tells an effect that subscribes late without making it depend on what it changes', async () => {
    respondFirstWith(403);
    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });
    const draft = $state({ filters: ['denied'] });
    let runs = 0;

    const stop = $effect.root(() => {
      $effect(() => {
        runs++;
        return session.onAccessDenied(() => {
          draft.filters = draft.filters.filter((filter) => filter !== 'denied');
        });
      });
    });
    flushSync();
    draft.filters = ['edited'];
    flushSync();
    stop();

    expect(draft.filters).toEqual(['edited']);
    expect(runs).toBe(1);
  });

  it('denies nothing when it answers a token the session has since dropped', async () => {
    const answer = forbidOnceInFlight();

    const refused = request('picsure/query/sync');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    session.removeToken();
    answer();
    await expect(refused).rejects.toMatchObject({ code: 'forbidden' });

    expect(events).toEqual([]);
  });

  it('denies access when it answers a token the session has since refreshed', async () => {
    session.setToken(jwt('user-1', 'first'));
    const answer = forbidOnceInFlight();

    const refused = request('picsure/query/sync');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    session.setToken(jwt('user-1', 'refreshed'));
    answer();
    await expect(refused).rejects.toMatchObject({ code: 'forbidden' });

    expect(events).toEqual(['denied']);
  });

  it('denies nothing when it answers a dropped token, even after the same user signs in again', async () => {
    session.setToken(jwt('user-1', 'first'));
    const answer = forbidOnceInFlight();

    const refused = request('picsure/query/sync');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    session.removeToken();
    session.setToken(jwt('user-1', 'second login'));
    answer();
    await expect(refused).rejects.toMatchObject({ code: 'forbidden' });

    expect(events).toEqual([]);
  });

  it('denies nothing when it answers the token of a user who has since been replaced', async () => {
    session.setToken(jwt('user-1', 'first'));
    const answer = forbidOnceInFlight();

    const refused = request('picsure/query/sync');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    session.setToken(jwt('user-2', 'first'));
    answer();
    await expect(refused).rejects.toMatchObject({ code: 'forbidden' });

    expect(events).toEqual([]);
  });

  it('denies nothing when the session has expired instead', async () => {
    respondFirstWith(401);

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'unauthorized' });
    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    navigations[0].resolve();
    await settle();

    expect(events).toEqual([]);
  });

  it('denies nothing when PSAMA refuses the logout call of an expired session', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('expired', { status: 401 }))
        .mockResolvedValueOnce(new Response('', { status: 403 })),
    );

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'unauthorized' });
    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    navigations[0].resolve();
    await settle();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(events).toEqual([]);
  });

  it('denies nothing when the user logs out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}'))),
    );

    await session.logout();
    navigations[0].resolve();
    await settle();

    expect(events).toEqual([]);
  });

  it('denies nothing when PSAMA is asking for the terms of service', async () => {
    config.features.termsOfService = true;
    config.features.enforceTermsOfService = true;
    respondFirstWith(403);

    await expect(request('psama/user/me')).rejects.toMatchObject({ code: 'terms_not_accepted' });

    expect(events).toEqual([]);
    expect(navigations).toHaveLength(0);
  });
});
