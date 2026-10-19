import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: { login: { open: true }, explorer: { open: false } },
    branding: { landing: { stats: [{ key: 'query:blank', label: 'Participants' }] } },
  },
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
  registerAssociatedStudies: vi.fn(),
}));

import { session } from '#lib/auth/session.svelte.ts';
import { createQueryCountService } from '#lib/query/counts/service.ts';
import { summarize } from '#lib/query/counts/snapshot.ts';
import { LandingStats, statsMatch, type LandingStat } from './landingStats.svelte.ts';

function setup() {
  const transport = vi.fn().mockResolvedValue(10);
  return { transport, stats: new LandingStats(createQueryCountService({ transport })) };
}

const counts = () => new Promise((resolve) => setTimeout(resolve));

afterEach(() => session.removeToken());

describe('LandingStats', () => {
  it('loads the open stats, and again only when signing in changes the list', async () => {
    const { transport, stats } = setup();

    await stats.load();
    await counts();
    await stats.load();
    await counts();

    expect(transport).toHaveBeenCalledTimes(1);
    expect(stats.open.map((stat) => stat.snapshot?.count)).toEqual([10]);
    expect(stats.auth).toEqual([]);

    session.setToken('token');
    vi.spyOn(session, 'ensureConsentsLoaded').mockResolvedValue({});
    await stats.load();
    await counts();

    expect(transport).toHaveBeenCalledTimes(3);
    expect(stats.auth.map((stat) => stat.snapshot?.count)).toEqual([10]);
  });

  it('reloads the signed-in stats when another user signs in', async () => {
    const { transport, stats } = setup();
    vi.spyOn(session, 'ensureConsentsLoaded').mockResolvedValue({});
    session.setToken('first-user');
    await stats.load();
    await counts();

    session.removeToken();
    session.setToken('second-user');
    transport.mockResolvedValue(20);
    await stats.load();
    await counts();

    expect(stats.auth.map((stat) => stat.snapshot?.count)).toEqual([20]);
  });

  it("ignores a superseded load's late counts", async () => {
    const { transport, stats } = setup();
    let resolveFirst!: (value: number) => void;
    transport.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)));

    await stats.load();
    session.setToken('token');
    vi.spyOn(session, 'ensureConsentsLoaded').mockResolvedValue({});
    await stats.load();
    await counts();
    resolveFirst(99);
    await counts();

    expect(stats.auth.map((stat) => stat.snapshot?.count)).toEqual([10]);
    expect(stats.open.map((stat) => stat.snapshot?.count)).toEqual([10]);
  });

  it('marks a failed stat instead of rejecting', async () => {
    const { transport, stats } = setup();
    transport.mockRejectedValue(new Error('down'));

    await stats.load();
    await counts();

    expect(stats.open[0].snapshot?.summary.hasError).toBe(true);
  });
});

describe('statsMatch', () => {
  const stat = (auth: boolean, count?: number | string, hasError = false): LandingStat => ({
    key: 'query:blank',
    label: 'Participants',
    auth,
    snapshot:
      count === undefined
        ? undefined
        : { descriptorKey: '', count, summary: summarize(count, hasError) },
  });

  it.each([
    {
      name: 'equal counts, formatted differently',
      open: stat(false, 1000),
      auth: stat(true, '1,000'),
      match: true,
    },
    { name: 'different counts', open: stat(false, 1), auth: stat(true, 2), match: false },
    { name: 'a count still loading', open: stat(false, 1), auth: stat(true), match: false },
    {
      name: 'an error against a real 0',
      open: stat(false, 0, true),
      auth: stat(true, 0),
      match: false,
    },
  ])('$name', ({ open, auth, match }) => {
    expect(statsMatch([open], [auth])).toBe(match);
  });

  it('needs both lists', () => {
    expect(statsMatch([stat(false, 1)], [])).toBe(false);
  });
});
