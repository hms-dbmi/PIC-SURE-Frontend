// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApi = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/client.ts', () => mockApi);
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
}));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: {
      dashboard: true,
      discover: true,
      analyzeApi: true,
      login: { open: false },
    },
  },
}));

import { session } from '#lib/auth/session.svelte.ts';
import { routesFor } from '#lib/auth/nav.ts';
import { config } from '#lib/config/config.svelte.ts';

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

const navPaths = () => routesFor(session.user, config.features).map((r) => r.path);

beforeEach(() => {
  mockApi.request.mockReset();
  session.setToken('fake-token');
  session.user = {};
});

describe('AUTHORIZED_ACCESS comes from PSAMA, not from the client', () => {
  it('grants the explorer and analysis routes to an authenticated user', async () => {
    mockApi.request.mockResolvedValue({
      privileges: [...AUTHENTICATED_PRIVILEGES],
      token: 'fake-token',
    });

    await session.loadUser(true);

    expect(navPaths()).toContain('/explorer');
    expect(navPaths()).toContain('/api');
  });

  it('withholds them from an open access session', async () => {
    mockApi.request.mockResolvedValue({
      privileges: [...OPEN_ACCESS_PRIVILEGES],
      token: 'fake-token',
    });

    await session.loadUser(true);

    expect(navPaths()).not.toContain('/explorer');
    expect(navPaths()).not.toContain('/dataset');
  });

  // all-in-one and Auth0: every gate reading this privilege has a second arm this set satisfies.
  it('reaches both routes on the open-source privilege set, which has no AUTHORIZED_ACCESS', async () => {
    mockApi.request.mockResolvedValue({
      privileges: ['PIC_SURE_ANY_QUERY', 'API_ACCESS', 'NAMED_DATASET'],
      token: 'fake-token',
    });

    await session.loadUser(true);

    expect(session.user.privileges).not.toContain('AUTHORIZED_ACCESS');
    expect(navPaths()).toContain('/explorer');
    expect(navPaths()).toContain('/api');
    expect(navPaths()).toContain('/dataset');
  });

  // Stale PRIV_MANAGED_* rows still exist in every environment.
  it('no longer infers the privilege from a leftover PRIV_MANAGED_* name', async () => {
    mockApi.request.mockResolvedValue({
      privileges: [...OPEN_ACCESS_PRIVILEGES, 'PRIV_MANAGED_phs000007_c1'],
      token: 'fake-token',
    });

    await session.loadUser(true);

    expect(session.user.privileges).not.toContain('AUTHORIZED_ACCESS');
    expect(navPaths()).not.toContain('/explorer');
  });
});
