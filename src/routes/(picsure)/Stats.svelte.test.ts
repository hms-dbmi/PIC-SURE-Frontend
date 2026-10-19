// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: { login: { open: true } },
    branding: {
      landing: {
        explanation: 'Public counts',
        authExplanation: 'Your counts',
        stats: [{ key: 'hardcoded', label: 'Participants', value: 10 }],
      },
    },
  },
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
  registerAssociatedStudies: vi.fn(),
}));

import Stats from './Stats.svelte';
import { session } from '#lib/auth/session.svelte.ts';

afterEach(() => {
  cleanup();
  session.removeToken();
});

describe('Stats', () => {
  it('shows the public stats once the session ends, when they matched the signed-in ones', async () => {
    session.setToken('token');
    vi.spyOn(session, 'ensureConsentsLoaded').mockResolvedValue({});
    render(Stats);

    await vi.waitFor(() => expect(screen.queryByText('Public counts')).not.toBeInTheDocument());
    expect(screen.getByText('Your counts')).toBeInTheDocument();

    session.removeToken();
    flushSync();

    expect(screen.queryByText('Your counts')).not.toBeInTheDocument();
    expect(screen.getByText('Public counts')).toBeInTheDocument();
  });
});
