// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

const mockApi = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/api', () => mockApi);
vi.mock('$lib/toaster', () => ({ toaster: { error: vi.fn() }, isToastShowing: () => false }));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn(() => ({})) }));
vi.mock('$lib/configuration.svelte', async () => {
  const { routes } = await import('$lib/routes');
  return {
    routes,
    config: {
      features: {
        dashboard: true,
        discover: true,
        analyzeApi: true,
        manualRole: true,
        login: { open: false },
      },
    },
  };
});

import { getUser, user, userRoutes } from '$lib/stores/User';

// What the three baseline roles carry in the BDC auth schema, plus AUTHORIZED_ACCESS on
// MANUAL_ROLE_AUTH_ACCESS. Every authenticated BDC user holds exactly this.
const AUTHENTICATED_PRIVILEGES = [
  'MANAGED_PRIV_AUTH_ACCESS',
  'MANAGED_PRIV_OPEN_ACCESS',
  'MANAGED_PRIV_DICTIONARY',
  'MANUAL_PRIV_NAMED_DATASET',
  'AUTHORIZED_ACCESS',
];

// createOpenAccessUser attaches MANUAL_ROLE_OPEN_ACCESS alone, so an open access session never
// receives AUTHORIZED_ACCESS. This is the only permanent population that must not get the routes.
const OPEN_ACCESS_PRIVILEGES = ['MANAGED_PRIV_OPEN_ACCESS', 'MANAGED_PRIV_DICTIONARY'];

const navPaths = () => get(userRoutes).map((r) => r.path);

beforeEach(() => {
  mockApi.get.mockReset();
  localStorage.setItem('token', 'fake-token');
  user.set({});
});

describe('AUTHORIZED_ACCESS comes from PSAMA, not from the client', () => {
  it('grants the explorer and analysis routes to an authenticated user', async () => {
    mockApi.get.mockResolvedValue({
      privileges: [...AUTHENTICATED_PRIVILEGES],
      token: 'fake-token',
    });

    await getUser(true);

    expect(navPaths()).toContain('/explorer');
    expect(navPaths()).toContain('/analyze/api');
  });

  it('withholds them from an open access session', async () => {
    mockApi.get.mockResolvedValue({ privileges: [...OPEN_ACCESS_PRIVILEGES], token: 'fake-token' });

    await getUser(true);

    expect(navPaths()).not.toContain('/explorer');
    expect(navPaths()).not.toContain('/analyze/api');
    expect(navPaths()).not.toContain('/dataset');
  });

  // all-in-one and Auth0: every gate reading this privilege has a second arm this set satisfies.
  it('reaches both routes on the open-source privilege set, which has no AUTHORIZED_ACCESS', async () => {
    mockApi.get.mockResolvedValue({
      privileges: ['PIC_SURE_ANY_QUERY', 'API_ACCESS', 'NAMED_DATASET'],
      token: 'fake-token',
    });

    await getUser(true);

    expect(get(user).privileges).not.toContain('AUTHORIZED_ACCESS');
    expect(navPaths()).toContain('/explorer');
    expect(navPaths()).toContain('/analyze/api');
    expect(navPaths()).toContain('/dataset');
  });

  // Stale PRIV_MANAGED_* rows still exist in every environment.
  it('no longer infers the privilege from a leftover PRIV_MANAGED_* name', async () => {
    mockApi.get.mockResolvedValue({
      privileges: [...OPEN_ACCESS_PRIVILEGES, 'PRIV_MANAGED_phs000007_c1'],
      token: 'fake-token',
    });

    await getUser(true);

    expect(get(user).privileges).not.toContain('AUTHORIZED_ACCESS');
    expect(navPaths()).not.toContain('/explorer');
  });
});
