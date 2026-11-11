// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

const mockLogout = vi.hoisted(() => vi.fn());
const mockGoto = vi.hoisted(() => vi.fn());

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({
  goto: (...args: unknown[]) => mockGoto(...args),
  invalidateAll: vi.fn(),
}));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: { enforceTermsOfService: true },
    branding: { termsOfService: { rejectionUrl: '' } },
  },
}));
vi.mock('#lib/api/psama/tos.ts', () => ({
  latest: vi.fn().mockResolvedValue('<p>Terms</p>'),
  accept: vi.fn(),
}));
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { token: 'token', login: vi.fn(), logout: (...args: unknown[]) => mockLogout(...args) },
}));
vi.mock('#lib/telemetry/logger.ts', () => ({ log: vi.fn(), createLog: vi.fn() }));

import Terms from '#lib/shell/Terms.svelte';

describe('rejecting the terms of service', () => {
  it('logs out and discards the query, as a logout the user chose', async () => {
    mockLogout.mockResolvedValue(undefined);
    render(Terms, { required: true, onclose: vi.fn() });

    await fireEvent.click(await screen.findByTestId('terms-reject'));

    expect(mockLogout).toHaveBeenCalledWith(undefined, false, { discardQuery: true });
  });

  it('leaves the navigation to logout, which resets the query only after it has navigated', async () => {
    mockLogout.mockResolvedValue(undefined);
    render(Terms, { required: true, onclose: vi.fn() });

    await fireEvent.click(await screen.findByTestId('terms-reject'));
    await Promise.resolve();

    expect(mockGoto).not.toHaveBeenCalled();
  });
});
