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

type Pending = { resolve: () => void; reject: (error: Error) => void };
const navigations: Pending[] = [];
// Guard re-runs after another tab signs out, which navigate when a guard redirects.
const reruns: Pending[] = [];
session.connect({
  navigate: () => new Promise<void>((resolve, reject) => navigations.push({ resolve, reject })),
  rerunGuards: () => new Promise<void>((resolve, reject) => reruns.push({ resolve, reject })),
  currentUrl: () => new URL('http://localhost/explorer'),
  showAccessUnavailable: vi.fn(),
});

const events: string[] = [];
session.onQueryDiscard(() => {
  events.push('discarded');
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

/** Holds the first request open and returns what answers it. Later requests get `{}`. */
function holdFirstRequest(): (response: Response) => void {
  let respond: (response: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (respond = resolve)))
      .mockResolvedValue(new Response('{}')),
  );
  return (response) => respond(response);
}

beforeEach(() => {
  session.setToken('token');
  events.length = 0;
  navigations.length = 0;
  reruns.length = 0;
});

afterEach(async () => {
  [...navigations, ...reruns].forEach((navigation) => navigation.resolve());
  await settle();
  session.clear();
  config.features.termsOfService = false;
  config.features.enforceTermsOfService = false;
  vi.unstubAllGlobals();
});

describe('a request the backend forbids', () => {
  it('discards the query before the logout navigates, and lifts the discard once it has', async () => {
    respondFirstWith(403);

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });
    expect(events).toEqual(['discarded']);

    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    await settle();
    expect(events).toEqual(['discarded']);

    navigations[0].resolve();
    await settle();
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('lifts the discard when the logout navigation fails', async () => {
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

    expect(events).toEqual(['discarded', 'lifted']);
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
    expect(events).toEqual(['discarded']);

    navigations[1].resolve();
    await settle();
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('keeps the query when an anonymous visitor’s open request is forbidden', async () => {
    session.clear();
    // the open-access session's POST is refused as well, so the request goes without one
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 403 }))),
    );

    await expect(request('picsure/query/sync', { auth: 'open' })).rejects.toMatchObject({
      code: 'forbidden',
    });

    expect(events).toEqual([]);
  });

  it('keeps the query when a request for open-access data is forbidden, and still logs out', async () => {
    respondFirstWith(403);

    await expect(
      request('picsure/dictionary/facets', { method: 'POST', auth: 'open', openAccess: true }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    await vi.waitFor(() => expect(navigations).toHaveLength(1));

    expect(events).toEqual([]);
    expect(session.isLoggedIn).toBe(false);
  });

  it('discards the query when a request without the user’s token is forbidden', async () => {
    session.clear();
    respondFirstWith(403);

    await expect(
      request('psama/open/apiKey', { method: 'POST', auth: 'none' }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(events).toEqual(['discarded']);
  });

  it('tells a listener added before the logout navigates, and lifts it with the rest', async () => {
    respondFirstWith(403);
    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });

    const late: string[] = [];
    const unsubscribe = session.onQueryDiscard(() => {
      late.push('discarded');
      return () => late.push('lifted');
    });
    onTestFinished(unsubscribe);
    expect(late).toEqual(['discarded']);

    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    navigations[0].resolve();
    await settle();
    expect(late).toEqual(['discarded', 'lifted']);
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('tells an effect that subscribes late without making it depend on what it changes', async () => {
    respondFirstWith(403);
    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });
    const draft = $state({ filters: ['discarded'] });
    let runs = 0;

    const stop = $effect.root(() => {
      $effect(() => {
        runs++;
        return session.onQueryDiscard(() => {
          draft.filters = draft.filters.filter((filter) => filter !== 'discarded');
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

  it('discards the query when the 403 answers a token the session has since dropped', async () => {
    const answer = holdFirstRequest();

    const refused = request('picsure/query/sync');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    session.removeToken();
    answer(new Response('', { status: 403 }));
    await expect(refused).rejects.toMatchObject({ code: 'forbidden' });

    expect(events).toEqual(['discarded']);
  });

  it('keeps the query when the session has expired instead', async () => {
    respondFirstWith(401);

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'unauthorized' });
    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    navigations[0].resolve();
    await settle();

    expect(events).toEqual([]);
  });

  it('discards the query when a 403 answers a logout under way, and lifts the discard once that logout has navigated', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('expired', { status: 401 }))
        .mockResolvedValueOnce(new Response('', { status: 403 })),
    );

    await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'unauthorized' });
    await vi.waitFor(() => expect(navigations).toHaveLength(1));
    await settle();
    expect(events).toEqual(['discarded']);

    navigations[0].resolve();
    await settle();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(navigations).toHaveLength(1);
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('keeps the query when PSAMA is asking for the terms of service', async () => {
    config.features.termsOfService = true;
    config.features.enforceTermsOfService = true;
    respondFirstWith(403);

    await expect(request('psama/user/me')).rejects.toMatchObject({ code: 'terms_not_accepted' });

    expect(events).toEqual([]);
    expect(navigations).toHaveLength(0);
  });
});

describe('logout and the query', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}'))),
    );
  });

  it('discards the query once a chosen logout has navigated', async () => {
    const loggedOut = session.logout(undefined, false, { discardQuery: true });
    expect(events).toEqual(['discarded']);

    await loggedOut;
    await settle();
    expect(events).toEqual(['discarded']);

    navigations[0].resolve();
    await settle();
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('keeps the query when the session times out', async () => {
    await session.logout(undefined, true);
    navigations[0].resolve();
    await settle();

    expect(events).toEqual([]);
  });

  it('keeps the query when a logout doesn’t ask to discard it', async () => {
    await session.logout();
    navigations[0].resolve();
    await settle();

    expect(events).toEqual([]);
  });

  it('discards the query when the user logs out during a timeout’s logout, which navigates once', async () => {
    const timedOut = session.logout(undefined, true);
    const chosen = session.logout(undefined, false, { discardQuery: true });
    expect(events).toEqual(['discarded']);

    await Promise.all([timedOut, chosen]);
    await settle();
    expect(navigations).toHaveLength(1);
    expect(events).toEqual(['discarded']);

    navigations[0].resolve();
    await settle();
    expect(events).toEqual(['discarded', 'lifted']);
  });
});

describe('a logout in another tab', () => {
  // The other tab writes these; the storage events reach every tab but that one.
  const announceDiscard = () => {
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'discard-query', oldValue: null, newValue: '1' }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'discard-query', oldValue: '1', newValue: null }),
    );
  };
  const removeToken = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
  };

  it('discards the query here too, and lifts the discard once this tab has followed the sign-out', async () => {
    announceDiscard();
    expect(events).toEqual(['discarded']);

    removeToken();
    expect(reruns).toHaveLength(1);
    await settle();
    expect(events).toEqual(['discarded']);

    reruns[0].resolve();
    await settle();
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('lifts the discard once the guards have run again when the sign-out arrives first', async () => {
    removeToken();
    announceDiscard();
    expect(events).toEqual(['discarded']);

    reruns[0].resolve();
    await settle();
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('lifts the discard at once when this tab has already followed the sign-out', async () => {
    removeToken();
    reruns[0].resolve();
    await settle();

    announceDiscard();

    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('lifts the discard when running the guards again fails', async () => {
    announceDiscard();
    removeToken();
    reruns[0].reject(new Error('load failed'));
    await settle();

    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('lifts the discard at once when the token it then hears of is still the same user’s', () => {
    // the other tab logged out and back in while this one slept, so it sees no sign-out
    localStorage.setItem('token', 'token-after-login-again');
    announceDiscard();
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));

    expect(reruns).toHaveLength(0);
    expect(events).toEqual(['discarded', 'lifted']);
  });

  it('keeps the query when the other tab’s session timed out', async () => {
    removeToken();
    reruns[0].resolve();
    await settle();

    expect(events).toEqual([]);
  });
});

describe('a logout in this tab', () => {
  /** Records this tab's localStorage writes, in order. */
  function recordStorageWrites(): string[] {
    const writes: string[] = [];
    const storage = localStorage;
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.getItem(key),
      setItem: (key: string, value: string) => {
        writes.push(`set ${key}`);
        storage.setItem(key, value);
      },
      removeItem: (key: string) => {
        writes.push(`remove ${key}`);
        storage.removeItem(key);
      },
    });
    return writes;
  }

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}'))),
    );
  });

  it('tells the other tabs to discard the query right before it removes the token', async () => {
    const answer = holdFirstRequest();
    const writes = recordStorageWrites();

    const loggedOut = session.logout(undefined, false, { discardQuery: true });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    // a tab closed while PSAMA answers its logout has told the others nothing
    expect(writes).toEqual([]);

    answer(new Response('{}'));
    await loggedOut;

    expect(writes.slice(0, 3)).toEqual([
      'set discard-query',
      'remove discard-query',
      'remove token',
    ]);
  });

  it('tells the other tabs at once when there is no token left to remove', () => {
    session.removeToken();
    const writes = recordStorageWrites();

    void session.logout(undefined, false, { discardQuery: true });

    expect(writes).toEqual(['set discard-query', 'remove discard-query']);
  });

  it('tells the other tabs nothing when the session times out', async () => {
    const writes = recordStorageWrites();

    await session.logout(undefined, true);

    expect(writes).toContain('remove token');
    expect(writes).not.toContain('set discard-query');
  });
});
