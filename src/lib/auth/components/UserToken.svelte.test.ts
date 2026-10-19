// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/psama/user.ts', () => ({ me: vi.fn() }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
}));

import UserToken from '#lib/auth/components/UserToken.svelte';
import * as psamaUser from '#lib/api/psama/user.ts';
import { session } from '#lib/auth/session.svelte.ts';

afterEach(() => {
  cleanup();
  session.clear();
  vi.clearAllMocks();
});

describe('UserToken', () => {
  it('shows the email the profile request returns', async () => {
    session.setToken('token');
    session.user = {};
    vi.mocked(psamaUser.me).mockResolvedValue({ email: 'test@pic-sure.org', token: 'long-term' });

    render(UserToken);

    expect(await screen.findByText('test@pic-sure.org')).toBeInTheDocument();
    expect(psamaUser.me).toHaveBeenCalledWith({ hasToken: true });
  });
});
