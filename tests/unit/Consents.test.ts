import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApi = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { explorer: { open: false }, login: { open: false } } },
  routes: [],
}));
vi.mock('$lib/api', () => mockApi);

import { getConsents, user, tokenStatus } from '$lib/stores/User';
import { addConsents } from '$lib/stores/Dictionary';
import { Psama } from '$lib/paths';

const consents = {
  '\\_consents\\': ['phs001', 'phs002'],
  '\\_harmonized_consent\\': ['phs001'],
};

describe('getConsents', () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('unwraps the consents map from the UserConsents entity', async () => {
    mockApi.get.mockResolvedValue({ uuid: 'abc', userId: '1234', consents });

    await expect(getConsents()).resolves.toEqual(consents);
    expect(mockApi.get).toHaveBeenCalledWith(Psama.User.Consents);
  });

  it('returns an empty map when the request fails', async () => {
    mockApi.get.mockRejectedValue(new Error('500'));

    await expect(getConsents()).resolves.toEqual({});
  });

  it('returns an empty map when the response has no consents key', async () => {
    mockApi.get.mockResolvedValue({ uuid: 'abc', userId: '1234' });

    await expect(getConsents()).resolves.toEqual({});
  });
});

describe('addConsents', () => {
  // The `consents` store gates on token presence; localStorage is unavailable in this
  // (node) environment, so drive tokenStatus directly rather than via setToken.
  beforeEach(() => tokenStatus.set(true));

  it('populates the request from the user store', () => {
    user.set({ consents });

    expect(addConsents({ facets: [], search: '', consents: [] })).toEqual({
      facets: [],
      search: '',
      consents: ['phs001', 'phs002'],
    });
  });

  it('sends an empty list when the user has no consents', () => {
    user.set({});

    expect(addConsents({ facets: [], search: '', consents: [] }).consents).toEqual([]);
  });

  it('sends an empty list when the token is gone but the user blob lingers', () => {
    user.set({ consents });
    tokenStatus.set(false);

    expect(addConsents({ facets: [], search: '', consents: [] }).consents).toEqual([]);
  });
});
