// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApi = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { explorer: { open: false }, login: { open: false } } },
  routes: [],
}));
vi.mock('$lib/api', () => mockApi);

import { get } from 'svelte/store';
import { loadDashboardData, rows } from '$lib/stores/Dashboard';
import { user, setToken, removeToken } from '$lib/stores/User';

const dashboardResp = {
  columns: [],
  rows: [
    { abbreviation: 'GRANTED', accession: 'phs001' },
    { abbreviation: 'VERSIONED', accession: 'phs002.v3.p1.c2' },
    { abbreviation: 'DENIED', accession: 'phs999' },
    { abbreviation: 'NOACCESSION', accession: null },
  ],
};

const accessOf = () => Object.fromEntries(get(rows).map((r) => [r.abbreviation, r.consentGranted]));

describe('loadDashboardData Access column', () => {
  beforeEach(() => {
    mockApi.get.mockReset().mockResolvedValue(structuredClone(dashboardResp));
    setToken('a-token');
  });

  it('grants access for exact and version-normalized accession matches', async () => {
    user.set({ consents: { '\\_consents\\': ['phs001', 'phs002.c2'] } });

    await loadDashboardData();

    expect(accessOf()).toEqual({
      GRANTED: true,
      VERSIONED: true,
      DENIED: false,
      NOACCESSION: false,
    });
  });

  it('denies everything when the user has no consents', async () => {
    user.set({ consents: {} });

    await loadDashboardData();

    expect(Object.values(accessOf()).every((granted) => granted === false)).toBe(true);
  });

  it('denies everything when the token is gone but the user blob lingers', async () => {
    user.set({ consents: { '\\_consents\\': ['phs001'] } });
    removeToken();

    await loadDashboardData();

    expect(accessOf().GRANTED).toBe(false);
  });
});
