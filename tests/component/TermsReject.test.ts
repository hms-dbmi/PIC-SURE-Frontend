// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

const mockLogout = vi.hoisted(() => vi.fn());
const mockGoto = vi.hoisted(() => vi.fn());

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: (...args: unknown[]) => mockGoto(...args) }));
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features: { enforceTermsOfService: true },
    branding: { termsOfService: { rejectionUrl: '' } },
  },
}));
vi.mock('$lib/api', () => ({ get: vi.fn().mockResolvedValue('<p>Terms</p>'), post: vi.fn() }));
vi.mock('$lib/stores/User', () => ({
  user: { subscribe: (run: (user: object) => void) => (run({ acceptedTOS: false }), () => {}) },
  isUserLoggedIn: () => true,
  getToken: vi.fn(),
  login: vi.fn(),
  logout: (...args: unknown[]) => mockLogout(...args),
}));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));

import Terms from '$lib/components/Terms.svelte';

describe('rejecting the terms of service', () => {
  it('logs out and discards the query, as a logout the user chose', async () => {
    mockLogout.mockResolvedValue(undefined);
    render(Terms);

    await fireEvent.click(await screen.findByTestId('terms-reject-btn'));

    expect(mockLogout).toHaveBeenCalledWith(undefined, false, { discardQuery: true });
  });

  it('leaves the navigation to logout, which resets the query only after it has navigated', async () => {
    mockLogout.mockResolvedValue(undefined);
    render(Terms);

    await fireEvent.click(await screen.findByTestId('terms-reject-btn'));
    await Promise.resolve();

    expect(mockGoto).not.toHaveBeenCalled();
  });
});
