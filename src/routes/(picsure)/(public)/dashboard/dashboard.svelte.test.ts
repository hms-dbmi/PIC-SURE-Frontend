// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApi = vi.hoisted(() => ({ getDashboard: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({
  resolve: (path: string) => (path.startsWith('/') ? path : `/${path}`),
}));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { explorer: { open: false }, login: { open: false } } },
}));
vi.mock('#lib/api/picsure/dictionary.ts', () => mockApi);

import { Dashboard } from './dashboard.svelte.ts';
import { session } from '#lib/auth/session.svelte.ts';

const dashboardResp = {
  columns: [],
  rows: [
    { abbreviation: 'GRANTED', accession: 'phs001' },
    { abbreviation: 'VERSIONED', accession: 'phs002.v3.p1.c2' },
    { abbreviation: 'DENIED', accession: 'phs999' },
    { abbreviation: 'NOACCESSION', accession: null },
  ],
};

const dashboard = new Dashboard();
const accessOf = () =>
  Object.fromEntries(dashboard.rows.map((r) => [r.abbreviation, r.consentGranted]));

describe('loadDashboardData Access column', () => {
  beforeEach(() => {
    mockApi.getDashboard.mockReset().mockResolvedValue(structuredClone(dashboardResp));
    session.setToken('a-token');
  });

  it('grants access for exact and version-normalized accession matches', async () => {
    session.user = { consents: { '\\_consents\\': ['phs001', 'phs002.c2'] } };

    await dashboard.load();

    expect(accessOf()).toEqual({
      GRANTED: true,
      VERSIONED: true,
      DENIED: false,
      NOACCESSION: false,
    });
  });

  it('denies everything when the user has no consents', async () => {
    session.user = { consents: {} };

    await dashboard.load();

    expect(Object.values(accessOf()).every((granted) => granted === false)).toBe(true);
  });

  it('denies everything when the token is gone but the user blob lingers', async () => {
    session.user = { consents: { '\\_consents\\': ['phs001'] } };
    session.removeToken();

    await dashboard.load();

    expect(accessOf().GRANTED).toBe(false);
  });
});
