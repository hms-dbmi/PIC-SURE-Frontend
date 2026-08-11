import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

const mockState = vi.hoisted(() => ({
  logSpy: vi.fn(),
  postSpy: vi.fn().mockResolvedValue({ '\\_studies_consents\\': 0 }),
  getCountResourceSpy: vi.fn((isOpenAccess: boolean) => ({
    name: isOpenAccess ? 'open' : 'auth',
    uuid: isOpenAccess ? 'open-uuid' : 'auth-uuid',
  })),
}));

vi.mock('$lib/api', () => ({ post: mockState.postSpy }));

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    branding: {
      statFields: {
        'query:genomic': [
          { label: 'Genomic field', id: 'genomic-field', conceptPath: '\\genomic\\field\\' },
        ],
      },
    },
  },
}));

vi.mock('$lib/paths', () => ({
  Picsure: {
    QueryOpenV3Sync: '/hpds/open/query/sync',
    QueryV3Sync: '/hpds/auth/query/sync',
  },
}));

vi.mock('$lib/stores/User', () => ({ isUserLoggedIn: () => false }));
vi.mock('$lib/stores/Dictionary', () => ({ addConsents: (request: unknown) => request }));
vi.mock('$lib/stores/Resources', () => ({
  getCountResource: mockState.getCountResourceSpy,
}));
vi.mock('$lib/AccessState', () => ({ useOpenAccess: (isOpenAccess: boolean) => isOpenAccess }));

vi.mock('$lib/utilities/QueryBuilder', () => ({
  getQueryRequestV3: vi.fn((_auth: boolean, expectedResultType: string) => ({
    query: { expectedResultType },
  })),
  getBlankQueryRequestV3: vi.fn((_open: boolean, expectedResultType: string) => ({
    query: { expectedResultType },
  })),
}));

vi.mock('$lib/logger', () => ({
  log: mockState.logSpy,
  createLog: (eventType: string, action: string, metadata: Record<string, unknown>) => ({
    eventType,
    action,
    metadata,
  }),
}));

import type { StatResult } from '$lib/models/Stat';
import { populateStatRequests } from '$lib/utilities/StatBuilder';

describe('statistics query logging', () => {
  beforeEach(() => {
    mockState.logSpy.mockClear();
    mockState.postSpy.mockClear();
    mockState.getCountResourceSpy.mockClear();
  });

  it('omits resourceUUID for open, authenticated, and cross-count queries', async () => {
    const stats: StatResult[] = [
      { key: 'query:patientCount', label: 'Open patients', auth: false, result: {} },
      { key: 'query:patientCount', label: 'Authenticated patients', auth: true, result: {} },
      { key: 'query:genomic', label: 'Genomic count', auth: true, result: {} },
    ];

    const results = populateStatRequests(stats);
    await Promise.all(results.flatMap((stat) => Object.values(stat.result)));

    expect(mockState.logSpy).toHaveBeenCalledTimes(3);
    for (const [event] of mockState.logSpy.mock.calls) {
      expect(event.metadata).not.toHaveProperty('resourceUUID');
    }
  });
});
