import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({
  get browser() {
    return true;
  },
}));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

const mockState = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return {
    allFiltersStore: writable<unknown[]>([]),
    filterTreeStore: writable<unknown>({ root: { children: [] } }),
    genomicFiltersStore: writable<unknown[]>([]),
  };
});

vi.mock('$lib/toaster', () => ({
  toaster: { error: vi.fn() },
  isToastShowing: () => false,
}));
vi.mock('$lib/stores/Filter', () => ({
  allFilters: mockState.allFiltersStore,
  filterTree: mockState.filterTreeStore,
  genomicFilters: mockState.genomicFiltersStore,
}));
vi.mock('$lib/stores/Resources', () => ({
  getCountResource: vi.fn().mockReturnValue({ name: 'hpds', uuid: 'r1' }),
}));
vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn((...args: unknown[]) => args),
  getSessionId: () => 'test-session-id',
}));
vi.mock('$lib/stores/User', () => ({ logout: vi.fn(), login: vi.fn() }));
vi.mock('@sveltejs/kit', () => ({
  error: (status: number, message: string) => {
    throw new Error(`${status}: ${message}`);
  },
}));

import { countTransport } from '$lib/state/resultCounts.svelte';
import { Picsure } from '$lib/paths';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';

const request = { query: { expectedResultType: 'COUNT' } } as unknown as QueryRequestInterfaceV3;

let fetchMock: ReturnType<typeof vi.fn>;

function sentHeaders() {
  return fetchMock.mock.calls[0][1].headers as Record<string, string>;
}

beforeEach(() => {
  vi.clearAllMocks();
  const headers = new Map([['Content-Type', 'application/json']]);
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: (k: string) => headers.get(k) ?? null },
    text: vi.fn().mockResolvedValue('{}'),
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (key === 'token' ? 'a-real-token' : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

describe('countTransport', () => {
  it('sends open-access counts anonymously', async () => {
    await countTransport(Picsure.QueryOpenV3Sync, request);

    expect(sentHeaders()).not.toHaveProperty('Authorization');
    expect(sentHeaders()['request-source']).toBe('Open');
  });

  it('authenticates authorized-path counts', async () => {
    await countTransport(Picsure.QueryV3Sync, request);

    expect(sentHeaders()['Authorization']).toBe('Bearer a-real-token');
    expect(sentHeaders()['request-source']).toBe('Authorized');
  });

  it('does not treat a sibling path that merely shares the open prefix as open', async () => {
    await countTransport('picsure/hpds/openx/v3/query/sync', request);

    expect(sentHeaders()['Authorization']).toBe('Bearer a-real-token');
  });
});
