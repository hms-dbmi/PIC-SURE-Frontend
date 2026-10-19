import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  config: {
    features: { login: { open: false }, explorer: { open: false } },
    branding: {
      statFields: {} as Record<string, { label: string; id: string; conceptPath: string }[]>,
    },
  },
}));

vi.mock('$app/env', () => ({ browser: false }));
vi.mock('#lib/utils/ssrWrite.ts', () => ({ assertNoSsrWrite: vi.fn() }));
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { user: {}, ensureConsentsLoaded: vi.fn() },
}));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/') } }));
vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: mocks.config }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn((category: string, event: string, data: Record<string, unknown>) => ({
    event,
    data,
  })),
  registerAssociatedStudies: vi.fn(),
  getPageContext: vi.fn(),
}));
vi.mock('#lib/explorer/Dictionary.ts', () => ({
  getConceptDetails: vi.fn(),
  addConsents: vi.fn(async (request: object) => ({ ...request, consents: ['phs1.c1'] })),
}));

import * as api from '#lib/api/client.ts';
import { log } from '#lib/telemetry/logger.ts';
import { runSyncQuery } from '#lib/api/picsure/query.ts';
import { buildDescriptor } from '#lib/query/descriptor.svelte.ts';
import { createQueryCountService } from '#lib/query/counts/service.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import {
  createFilterGroup,
  createRequiredFilter,
  type FilterInterface,
} from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import type { SearchResult } from '#lib/explorer/types.ts';
import type { StatConfig } from '#lib/config/index.ts';
import { statEntries, statProvider } from '#lib/query/counts/statProviders.ts';

const request = vi.mocked(api.request);

// Each request as it goes on the wire: the URL with its query string, the body, the credentials.
function wireCalls() {
  return request.mock.calls.map(([path, opts = {}]) => {
    const query = Object.entries(opts.query ?? {}).map(([k, v]) => [k, String(v)]);
    const search = new URLSearchParams(query).toString();
    return [search ? `${path}?${search}` : path, opts.body, opts.auth];
  });
}

const AUTH = 'picsure/hpds/auth/query/sync';
const OPEN = 'picsure/hpds/open/query/sync';
const consents = { facets: [], search: '', consents: ['phs1.c1'] };
const noConsents = { facets: [], search: '', consents: [] };

const filterClause = { phenotypicFilterType: 'REQUIRED', conceptPath: '\\f\\', not: false };
const withFilter = { operator: 'AND', not: false, phenotypicClauses: [filterClause] };

function query(fields: object) {
  return {
    query: {
      select: [],
      authorizationFilters: [],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType: 'COUNT',
      picsureId: null,
      id: null,
      ...fields,
    },
  };
}

// Why the executor failed a stat, from its `query.cell_failed` log.
function failure() {
  const entries = vi
    .mocked(log)
    .mock.calls.map(
      ([entry]) =>
        entry as unknown as { event: string; data: { error?: string; errorType?: string } },
    );
  const data = entries.find(({ event }) => event === 'query.cell_failed')?.data;
  return data?.errorType ?? data?.error?.replace(/^Error: /, '');
}

// Runs one stat through the count executor and reports the client calls and the value. A
// failed stat reports why it failed.
async function runStat(
  stat: StatConfig,
  { open = false, addFilters = false }: { open?: boolean; addFilters?: boolean } = {},
) {
  const service = createQueryCountService({
    transport: (request, openEndpoint) => runSyncQuery(request, { openEndpoint }),
  });
  const filters = addFilters
    ? filterState.queryFilters
    : { phenotypicClause: null, genomicFilters: [] };
  const snapshot = await service.getCount(buildDescriptor(open, filters), statProvider(stat)!);
  const value = snapshot.summary.hasError ? { rejected: failure() } : snapshot.count;
  return { value, calls: wireCalls() };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.features.login.open = false;
  mocks.config.features.explorer.open = false;
  mocks.config.branding.statFields = {
    'query:biosample': [
      { label: 'Blood', id: 'blood', conceptPath: '\\bio\\blood\\' },
      { label: 'Saliva', id: 'saliva', conceptPath: '\\bio\\saliva\\' },
    ],
    'query:genomic': [{ label: 'WGS', id: 'wgs', conceptPath: '\\gen\\wgs\\' }],
    'query:consent': [
      { label: 'GRU', id: 'phs1.c1', conceptPath: '\\_consents\\' },
      { label: 'HMB', id: 'phs1.c2', conceptPath: '\\_consents\\' },
      { label: 'Topmed', id: 'phs2.c1', conceptPath: '\\_topmed_consents\\' },
    ],
  };
  const tree = new LogicTree<FilterInterface>(createFilterGroup);
  tree.add(createRequiredFilter({ conceptPath: '\\f\\', allowFiltering: true } as SearchResult));
  filterState.restore(tree, []);
});

describe('stat providers', () => {
  it.each([
    {
      name: 'dict:facets:dataset_id counts facets with patients (auth)',
      key: 'dict:facets:dataset_id',
      response: [
        { name: 'other', facets: [{ count: 1 }] },
        { name: 'dataset_id', facets: [{ count: 3 }, { count: 0 }, { count: 2 }] },
      ],
      call: ['picsure/dictionary/facets', consents, 'open'],
      value: 2,
    },
    {
      name: 'dict:facets:dataset_id counts every facet (open)',
      key: 'dict:facets:dataset_id',
      open: true,
      response: [{ name: 'dataset_id', facets: [{ count: 3 }, { count: 0 }] }],
      call: ['picsure/dictionary/facets', noConsents, 'open'],
      value: 2,
    },
    {
      name: 'dict:facets:dataset_id is 0 without the category',
      key: 'dict:facets:dataset_id',
      response: [],
      call: ['picsure/dictionary/facets', consents, 'open'],
      value: 0,
    },
    {
      name: 'dict:concepts returns totalElements',
      key: 'dict:concepts',
      response: { totalElements: 42 },
      call: ['picsure/dictionary/concepts?page_number=1&page_size=1', consents, 'open'],
      value: 42,
    },
    {
      name: 'dict:concepts returns a total of 0',
      key: 'dict:concepts',
      open: true,
      response: { totalElements: 0 },
      call: ['picsure/dictionary/concepts?page_number=1&page_size=1', noConsents, 'open'],
      value: 0,
    },
    {
      name: 'dict:concepts rejects a response without a total',
      key: 'dict:concepts',
      open: true,
      response: {},
      call: ['picsure/dictionary/concepts?page_number=1&page_size=1', noConsents, 'open'],
      value: { rejected: 'total not found' },
    },
    {
      name: 'query:blank (auth)',
      key: 'query:blank',
      response: 10,
      call: [AUTH, query({}), 'open'],
      value: 10,
    },
    {
      name: 'query:blank with filters (open)',
      key: 'query:blank',
      open: true,
      addFilters: true,
      response: 10,
      call: [OPEN, query({ phenotypicClause: withFilter }), 'open'],
      value: 10,
    },
    {
      name: 'query:biosample selects the configured fields',
      key: 'query:biosample',
      response: { '\\bio\\blood\\': 5 },
      call: [
        AUTH,
        query({
          select: ['\\bio\\blood\\', '\\bio\\saliva\\'],
          expectedResultType: 'OBSERVATION_CROSS_COUNT',
        }),
        'open',
      ],
      value: { '\\bio\\blood\\': 5 },
    },
    {
      name: 'query:genomic with filters (open)',
      key: 'query:genomic',
      open: true,
      addFilters: true,
      response: { '\\gen\\wgs\\': 7 },
      call: [
        OPEN,
        query({
          select: ['\\gen\\wgs\\'],
          expectedResultType: 'CROSS_COUNT',
          phenotypicClause: withFilter,
        }),
        'open',
      ],
      value: { '\\gen\\wgs\\': 7 },
    },
    {
      name: 'query:consent groups consent ids by concept path',
      key: 'query:consent',
      response: 9,
      call: [
        AUTH,
        query({
          phenotypicClause: {
            operator: 'AND',
            not: false,
            phenotypicClauses: [
              {
                phenotypicFilterType: 'FILTER',
                conceptPath: '\\_consents\\',
                not: false,
                values: ['phs1.c1', 'phs1.c2'],
              },
              {
                phenotypicFilterType: 'FILTER',
                conceptPath: '\\_topmed_consents\\',
                not: false,
                values: ['phs2.c1'],
              },
            ],
          },
        }),
        'open',
      ],
      value: 9,
    },
    {
      // The consent clauses are appended to the root AND group of the filters.
      name: 'query:consent with filters',
      key: 'query:consent',
      addFilters: true,
      response: 9,
      call: [
        AUTH,
        query({
          phenotypicClause: {
            ...withFilter,
            phenotypicClauses: [
              filterClause,
              {
                phenotypicFilterType: 'FILTER',
                conceptPath: '\\_consents\\',
                not: false,
                values: ['phs1.c1', 'phs1.c2'],
              },
              {
                phenotypicFilterType: 'FILTER',
                conceptPath: '\\_topmed_consents\\',
                not: false,
                values: ['phs2.c1'],
              },
            ],
          },
        }),
        'open',
      ],
      value: 9,
    },
    {
      name: 'query:patientCount (auth)',
      key: 'query:patientCount',
      addFilters: true,
      response: '1,234',
      call: [AUTH, query({ phenotypicClause: withFilter }), 'open'],
      value: '1,234',
    },
    {
      name: 'query:patientCount (open) sums the studies-consents cross count',
      key: 'query:patientCount',
      open: true,
      response: { '\\_studies_consents\\': '500±3', other: 1 },
      call: [OPEN, query({ expectedResultType: 'CROSS_COUNT' }), 'open'],
      value: '500±3',
    },
    {
      name: 'query results with an errorType reject',
      key: 'query:blank',
      response: { errorType: 'error', message: 'bad' },
      call: [AUTH, query({}), 'open'],
      value: { rejected: 'error' },
    },
  ])('$name', async ({ key, open, addFilters, response, call, value }) => {
    request.mockResolvedValue(response);

    const result = await runStat({ key, label: key }, { open, addFilters });

    expect(result.calls).toEqual([call]);
    expect(result.value).toEqual(value);
  });

  it.each([
    {
      name: 'biosample',
      key: 'query:biosample',
      error: 'query:biosample feilds were not configured',
    },
    { name: 'genomic', key: 'query:genomic', error: 'query:genomic feilds were not configured' },
    { name: 'consent', key: 'query:consent', error: 'consent feilds were not configured' },
  ])('$name rejects without configured stat fields', async ({ key, error }) => {
    mocks.config.branding.statFields = {};

    const result = await runStat({ key, label: key });

    expect(result.calls).toEqual([]);
    expect(result.value).toEqual({ rejected: error });
  });

  it('returns a hardcoded value without a request', async () => {
    expect(await runStat({ key: 'hardcoded', label: 'h', value: '1,000' })).toEqual({
      value: '1,000',
      calls: [],
    });
    expect((await runStat({ key: 'hardcoded', label: 'h' })).value).toBe(0);
  });

  it.each([
    { key: 'query:blank', open: false, explore: false, path: AUTH },
    { key: 'query:blank', open: true, explore: false, path: OPEN },
    // With explore-without-login, open requests go to the auth resource...
    { key: 'query:blank', open: true, explore: true, path: AUTH },
    // ...except open patient counts and dictionary stats, which keep their open path.
    { key: 'query:patientCount', open: true, explore: true, path: OPEN },
    {
      key: 'dict:concepts',
      open: true,
      explore: true,
      path: 'picsure/dictionary/concepts?page_number=1&page_size=1',
    },
  ])(
    'picks the endpoint: $key, open $open, explore $explore',
    async ({ key, open, explore, path }) => {
      mocks.config.features.login.open = explore;
      mocks.config.features.explorer.open = explore;
      request.mockResolvedValue(1);

      const result = await runStat({ key, label: key }, { open });

      expect(result.calls[0][0]).toBe(path);
    },
  );
});

describe('stat entries', () => {
  const stats: StatConfig[] = [
    { key: 'query:blank', label: 'both' },
    { key: 'dict:concepts', label: 'auth only', auth: true },
    { key: 'hardcoded', label: 'open only', auth: false, value: 3 },
    { key: 'unknown', label: 'dropped' },
  ];
  const summary = (list: { label: string; auth?: boolean }[]) =>
    list.map(({ label, auth }) => [label, auth]);

  it.each([
    {
      name: 'logged in, login closed',
      loggedIn: true,
      loginOpen: false,
      expected: [
        ['both', true],
        ['auth only', true],
      ],
    },
    {
      name: 'logged in, login open',
      loggedIn: true,
      loginOpen: true,
      expected: [
        ['both', true],
        ['both', false],
        ['auth only', true],
        ['open only', false],
      ],
    },
    {
      name: 'logged out, login open',
      loggedIn: false,
      loginOpen: true,
      expected: [
        ['both', false],
        ['open only', false],
      ],
    },
    { name: 'logged out, login closed', loggedIn: false, loginOpen: false, expected: [] },
  ])('$name', ({ loggedIn, loginOpen, expected }) => {
    expect(summary(statEntries(stats, { loggedIn, loginOpen }))).toEqual(expected);
  });
});
