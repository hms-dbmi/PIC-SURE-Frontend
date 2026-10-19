// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import type { Writable } from 'svelte/store';
import type { StatResult } from '#lib/query/counts/Stat.ts';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: {},
    branding: { landing: { explanation: 'Public counts', authExplanation: 'Your counts' } },
  },
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
  registerAssociatedStudies: vi.fn(),
}));
vi.mock('./landingStats.ts', async () => {
  const { writable } = await import('svelte/store');
  return { stats: writable([]), authStats: writable([]), loadLandingStats: vi.fn() };
});

import Stats from './Stats.svelte';
import * as landing from './landingStats.ts';
import { session } from '#lib/auth/session.svelte.ts';

const stats = landing.stats as Writable<StatResult[]>;
const authStats = landing.authStats as Writable<StatResult[]>;

const participants = (auth: boolean): StatResult => ({
  key: 'participants',
  label: 'Participants',
  result: { hpds: Promise.resolve(10) },
  auth,
});

afterEach(() => {
  cleanup();
  session.removeToken();
});

describe('Stats', () => {
  it('shows the public stats once the session ends, when they matched the signed-in ones', async () => {
    session.setToken('token');
    stats.set([participants(false)]);
    authStats.set([participants(true)]);
    render(Stats);

    await vi.waitFor(() => expect(screen.queryByText('Public counts')).not.toBeInTheDocument());
    expect(screen.getByText('Your counts')).toBeInTheDocument();

    session.removeToken();
    flushSync();

    expect(screen.queryByText('Your counts')).not.toBeInTheDocument();
    expect(screen.getByText('Public counts')).toBeInTheDocument();
  });
});
