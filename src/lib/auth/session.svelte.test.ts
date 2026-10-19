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
import { ACCESS } from '#lib/auth/access.ts';
import { requireAccess } from '#lib/auth/guard.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { createLog, registerSignedInUser } from '#lib/telemetry/logger.ts';

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

/** An unsigned JWT for `sub` that expires in an hour. */
function jwt(sub: string): string {
  const encode = (part: object) => btoa(JSON.stringify(part)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${encode({ alg: 'none' })}.${encode({ sub, exp })}.signature`;
}

/** Stubs fetch with a profile and consents, and returns the paths it was asked for. */
function stubPsama(profile: object = { privileges: ['QUERY'] }) {
  const paths: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const path = new URL(String(input), 'http://localhost').pathname;
      paths.push(path);
      const body = path.endsWith('/consents')
        ? { consents: { '\\_consents\\': ['phs1'] } }
        : profile;
      return Promise.resolve(new Response(JSON.stringify(body)));
    }),
  );
  return paths;
}

describe('the bootstrap', () => {
  it('loads the profile and consents once per token', async () => {
    const paths = stubPsama();
    session.setToken(jwt('fresh-tab'));

    await Promise.all([session.bootstrap(), session.bootstrap()]);
    await session.bootstrap();
    await session.consentsSettled();

    expect(paths.filter((path) => path.endsWith('/me'))).toHaveLength(1);
    expect(session.privileges).toEqual(['QUERY']);
    expect(session.consentedStudies).toEqual(['phs1']);
  });

  it('leaves a tab that already has the profile alone', async () => {
    const paths = stubPsama();
    session.setToken(jwt('restored'));
    session.user = { privileges: ['QUERY'] };

    await session.bootstrap();

    expect(paths).toEqual([]);
  });

  it('leaves a user who has not accepted the terms to the terms dialog', async () => {
    const paths = stubPsama();
    session.setToken(jwt('terms-pending'));
    session.user = { acceptedTOS: false };

    await session.bootstrap();

    expect(paths).toEqual([]);
    expect(session.profileFailed).toBe(false);
  });

  it('records a failed profile request instead of rejecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 500 }))),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    session.setToken(jwt('psama-down'));

    await expect(session.bootstrap()).resolves.toBeUndefined();

    expect(session.profileFailed).toBe(true);
    expect(vi.mocked(createLog)).toHaveBeenCalledWith('AUTH', 'auth.hydrate_failed', {
      error: expect.any(String),
    });
  });

  it('stops reporting a failure once a later request loads the profile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 500 }))),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    session.setToken(jwt('recovered'));
    await session.bootstrap();
    stubPsama();

    await session.loadUser(true, true);

    expect(session.profileFailed).toBe(false);
  });

  it('makes a consents check wait for it instead of asking twice', async () => {
    const paths = stubPsama();
    session.setToken(jwt('early-reader'));

    const booting = session.bootstrap();
    const consents = await session.ensureConsentsLoaded();
    await booting;

    expect(consents).toEqual({ '\\_consents\\': ['phs1'] });
    expect(paths.filter((path) => path.endsWith('/consents'))).toHaveLength(1);
  });
});

describe('another tab changing the token', () => {
  const storeFromAnotherTab = (token: string) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
  };

  it('forgets this tab’s profile when the other tab signs out', () => {
    session.setToken(jwt('signing-out'));
    session.user = { privileges: ['SUPER_ADMIN'] };

    storeFromAnotherTab('');

    expect(session.user).toEqual({});
    expect(sessionStorage.getItem('user')).toBe('{}');
  });

  it('loads the new user’s profile when the other tab signs in as someone else', async () => {
    const paths = stubPsama({ privileges: ['NAMED_DATASET'] });
    session.setToken(jwt('user-a'));
    session.user = { privileges: ['SUPER_ADMIN'], consents: {} };

    storeFromAnotherTab(jwt('user-b'));
    expect(session.user.privileges).toBeUndefined();
    await session.bootstrap();

    expect(paths.filter((path) => path.endsWith('/me'))).toHaveLength(1);
    expect(session.privileges).toEqual(['NAMED_DATASET']);
  });

  it('keeps the profile when the other tab refreshes the same user’s token', () => {
    const paths = stubPsama();
    session.setToken(jwt('refreshing'));
    session.user = { privileges: ['QUERY'], consents: {} };

    storeFromAnotherTab(jwt('refreshing') + 'x');

    expect(session.privileges).toEqual(['QUERY']);
    expect(paths).toEqual([]);
  });
});

describe('guards that check privileges', () => {
  it('share the bootstrap, so running them again sends no request', async () => {
    const paths = stubPsama({ privileges: ['PIC_SURE_ANY_QUERY', 'NAMED_DATASET'] });
    session.setToken(jwt('guarded'));
    const event = { url: new URL('http://localhost/dataset'), parent: async () => ({}) };

    // A navigation, then a preload and an invalidate running the guard again.
    for (let run = 0; run < 3; run++) await requireAccess(event, ACCESS.dataset);
    await session.consentsSettled();

    expect(paths.filter((path) => path.endsWith('/me'))).toHaveLength(1);
  });
});
