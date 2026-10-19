import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  getSessionId: () => 'session-id',
  registerSignedInUser: vi.fn(),
}));

import { sessionHooks } from '#lib/api/sessionHooks.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { registerSignedInUser } from '#lib/telemetry/logger.ts';

const answer = (body: object) => () => Promise.resolve(new Response(JSON.stringify(body)));

/** Stubs fetch so the first request waits for `respond`, and later ones answer `{}`. */
function holdFirstRequest() {
  const held: { respond: (response: Response) => void } = { respond: () => {} };
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (held.respond = resolve)))
      .mockImplementation(answer({})),
  );
  return held;
}

afterEach(() => {
  session.clear();
  vi.unstubAllGlobals();
});

/** How many times an effect ran `work` while `change` was applied after its first run. */
function effectRuns(work: () => unknown, change: () => void): number {
  let runs = 0;
  const stop = $effect.root(() => {
    $effect(() => {
      runs++;
      work();
    });
  });
  flushSync();
  change();
  flushSync();
  stop();
  return runs;
}

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

describe('work started inside an effect', () => {
  it('is not re-run when a request it sent reads a token that changes later', () => {
    expect(
      effectRuns(
        () => sessionHooks().getToken(),
        () => session.setToken('refreshed'),
      ),
    ).toBe(1);
  });

  it('is not re-run when the profile it loaded changes', () => {
    session.user = { privileges: ['QUERY'], token: 'long-term', consents: {} };

    expect(
      effectRuns(
        () => {
          void session.loadUser();
          void session.ensureConsentsLoaded();
        },
        () => (session.user = { ...session.user, email: 'changed@example.org' }),
      ),
    ).toBe(1);
  });

  it('is not re-run when it logs, loads consents or logs out and the session changes', async () => {
    vi.stubGlobal('fetch', vi.fn(answer({})));
    const signedInUser = vi.mocked(registerSignedInUser).mock.calls[0][0];
    session.setToken('token');

    expect(
      effectRuns(
        () => {
          signedInUser();
          void session.loadConsents();
          void session.logout();
        },
        () => {
          session.setToken('another-token');
          session.user = { email: 'changed@example.org' };
        },
      ),
    ).toBe(1);
    await session.logout();
  });
});

describe('a profile request', () => {
  it('is dropped, and consents are not asked for, when the session ends before it answers', async () => {
    session.setToken('token');
    const request = holdFirstRequest();

    const hydrating = session.hydrate();
    session.clear();
    request.respond(
      new Response(JSON.stringify({ email: 'gone@example.org', privileges: ['SUPER'] })),
    );
    await hydrating;

    expect(session.user).toEqual({});
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('is dropped when a logout ends the session before it answers', async () => {
    session.setToken('token');
    const request = holdFirstRequest();

    const hydrating = session.hydrate();
    await session.logout();
    request.respond(
      new Response(JSON.stringify({ email: 'gone@example.org', privileges: ['SUPER'] })),
    );
    await hydrating;

    expect(session.user).toEqual({});
  });

  it('leaves out a long-term token that arrives after the session ended', async () => {
    session.setToken('token');
    const request = holdFirstRequest();

    const refreshing = session.refreshLongTermToken();
    session.clear();
    request.respond(new Response(JSON.stringify({ userLongTermToken: 'long-term' })));
    await refreshing;

    expect(session.user).toEqual({});
  });
});

describe('a refreshed token', () => {
  it('does not sign the user back in when it arrives after the session ended', () => {
    session.setToken('token');
    session.clear();

    sessionHooks().onTokenRefreshed('late');

    expect(session.isLoggedIn).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
