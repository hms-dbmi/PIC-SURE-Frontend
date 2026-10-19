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
});

describe('a profile request', () => {
  it('is dropped, and consents are not asked for, when the session ends before it answers', async () => {
    session.setToken('token');
    let respond: (response: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (respond = resolve))),
    );

    const hydrating = session.hydrate();
    session.clear();
    respond(new Response(JSON.stringify({ email: 'gone@example.org', privileges: ['SUPER'] })));
    await hydrating;

    expect(session.user).toEqual({});
    expect(fetch).toHaveBeenCalledOnce();
  });
});
