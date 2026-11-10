// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

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

  it('masks the token until the researcher reveals it', async () => {
    // Expires 2099-01-01, so the card renders as it does for a valid token.
    const encode = (part: object) => btoa(JSON.stringify(part)).replace(/=+$/, '');
    const token = `${encode({ alg: 'HS256' })}.${encode({ exp: 4070908800 })}.signature`;
    session.setToken('token');
    session.user = {};
    vi.mocked(psamaUser.me).mockResolvedValue({ email: 'researcher@example.org', token });

    const { container } = render(UserToken);

    await screen.findByTestId('user-token-reveal');
    // the label's `for` points at a div, which isn't labelable
    const tokenBox = container.querySelector('#user-token-value') as HTMLElement;
    expect(screen.getByText('researcher@example.org')).toBeInTheDocument();
    expect(screen.getByTestId('user-token-expires')).toHaveTextContent(/^VALID FOR/);
    expect(tokenBox).not.toHaveTextContent(token);
    expect(tokenBox.textContent).toMatch(/^•+$/);

    await fireEvent.click(screen.getByTestId('user-token-reveal'));
    expect(tokenBox).toHaveTextContent(token);

    await fireEvent.click(screen.getByTestId('user-token-reveal'));
    expect(tokenBox).not.toHaveTextContent(token);
  });
});
