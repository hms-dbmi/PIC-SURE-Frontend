import { beforeEach, describe, expect, it, vi } from 'vitest';
import { error } from '@sveltejs/kit';

const { post, put, replaceDataset, cachedDataset } = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
  replaceDataset: vi.fn(),
  cachedDataset: vi.fn(),
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/api', () => ({ post, put }));
vi.mock('$lib/stores/Dataset.svelte', () => ({ replaceDataset, cachedDataset }));

import { mapDataset, QueryVersion, type DataSet, type LinkedQuery } from '$lib/models/Dataset';
import { QueryV3, type ExpectedResultType, type PhenotypicClause } from '$lib/models/query/Query';
import { exportResultType, linkQuery, requestVariant } from '$lib/services/datasets';
import { buildQueryRequestV3FromDescriptor } from '$lib/utilities/QueryBuilder';

const QUERY_PATH = 'picsure/hpds/auth/query';
const DATASET_PATH = 'picsure/operations/dataset/named/dataset-uuid';

function storedQuery(expectedResultType: ExpectedResultType, sample = false): QueryV3 {
  return new QueryV3({
    select: ['\\study\\age\\'],
    authorizationFilters: [],
    phenotypicClause: null,
    genomicFilters: [],
    expectedResultType,
    picsureId: null,
    id: null,
    sample,
  });
}

function makeDataset(overrides: Partial<DataSet> = {}): DataSet {
  return {
    version: QueryVersion.V3,
    uuid: 'dataset-uuid',
    user: 'user@example.org',
    name: 'My cohort',
    archived: false,
    metadata: { note: 'kept' },
    query: storedQuery('DATAFRAME'),
    queryId: 'full-csv',
    queries: [],
    supportsLinkedQueries: true,
    startTime: '2026-11-09',
    rawStartTime: 1,
    status: 'AVAILABLE',
    ...overrides,
  };
}

function httpError(status: number, body: string): unknown {
  try {
    error(status, body);
  } catch (e) {
    return e;
  }
}

function sentBody(call: unknown[]): Record<string, unknown> {
  return JSON.parse(JSON.stringify(call[1]));
}

function serverDataset(queries?: unknown): Record<string, unknown> {
  const stored = {
    query: {
      select: ['\\study\\age\\'],
      authorizationFilters: [{ conceptPath: '\\_consents\\', values: ['phs000001.c1'] }],
      phenotypicClause: {
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\study\\sex\\',
        values: ['Male'],
        min: null,
        max: null,
        not: false,
      },
      genomicFilters: [],
      expectedResultType: 'DATAFRAME',
      picsureId: '11111111-2222-3333-4444-555555555555',
      id: '66666666-7777-8888-9999-000000000000',
    },
    resourceUUID: 'resource-uuid',
  };
  return {
    uuid: 'dataset-uuid',
    user: 'user@example.org',
    name: 'My cohort',
    archived: false,
    metadata: { note: 'kept' },
    query: {
      uuid: 'full-csv',
      query: JSON.stringify(stored),
      startTime: 1794000000000,
      status: 'AVAILABLE',
    },
    ...(queries === undefined ? {} : { queries }),
  };
}

const NESTED_SELECT = ['\\_consents\\', '\\study\\age\\', '\\study\\sex\\'];

/**
 * Builds a dataset the way the server returns one whose stored query nests subqueries. Unset
 * bounds and value lists arrive as explicit nulls, and no clause carries a `type`.
 *
 * @param sample True when the stored query, and the one link listed, is the sample.
 * @returns The server JSON for the dataset.
 */
function nestedServerDataset(sample: boolean): Record<string, unknown> {
  const filter = (conceptPath: string, bounds: Record<string, unknown>) => ({
    phenotypicFilterType: 'FILTER',
    conceptPath,
    values: null,
    min: null,
    max: null,
    not: false,
    ...bounds,
  });
  const stored = {
    query: {
      select: NESTED_SELECT,
      authorizationFilters: [{ conceptPath: '\\_consents\\', values: ['phs000001.c1'] }],
      phenotypicClause: {
        not: false,
        operator: 'AND',
        phenotypicClauses: [
          filter('\\study\\sex\\', { values: ['Male'] }),
          {
            not: false,
            operator: 'OR',
            phenotypicClauses: [
              filter('\\study\\age\\', { min: 40, max: 65 }),
              {
                not: false,
                operator: 'AND',
                phenotypicClauses: [
                  { ...filter('\\study\\bmi\\', {}), phenotypicFilterType: 'REQUIRED' },
                  { ...filter('\\study\\visits\\', {}), phenotypicFilterType: 'ANY_RECORD_OF' },
                ],
              },
            ],
          },
        ],
      },
      genomicFilters: [
        { key: 'Gene_with_variant', values: ['BRCA1'], min: null, max: null },
        { key: 'genomic_range', values: null, min: 1, max: null },
      ],
      expectedResultType: 'DATAFRAME',
      picsureId: '11111111-2222-3333-4444-555555555555',
      id: '66666666-7777-8888-9999-000000000000',
      ...(sample ? { sample: true } : {}),
    },
    resourceUUID: 'resource-uuid',
  };
  return {
    ...serverDataset([{ queryId: 'full-csv', sample, resultType: 'DATAFRAME' }]),
    query: {
      uuid: 'full-csv',
      query: JSON.stringify(stored),
      startTime: 1794000000000,
      status: 'AVAILABLE',
    },
  };
}

/**
 * Builds the body the explorer posts for the query {@link nestedServerDataset} stores, from the
 * typed clauses the explorer holds in memory.
 *
 * @returns The request body as it is sent.
 */
function explorerBody(): Record<string, unknown> {
  const phenotypicClause: PhenotypicClause = {
    type: 'PhenotypicSubquery',
    operator: 'AND',
    not: false,
    phenotypicClauses: [
      {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\study\\sex\\',
        not: false,
        values: ['Male'],
      },
      {
        type: 'PhenotypicSubquery',
        operator: 'OR',
        not: false,
        phenotypicClauses: [
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: '\\study\\age\\',
            not: false,
            min: 40,
            max: 65,
          },
          {
            type: 'PhenotypicSubquery',
            operator: 'AND',
            not: false,
            phenotypicClauses: [
              {
                type: 'PhenotypicFilter',
                phenotypicFilterType: 'REQUIRED',
                conceptPath: '\\study\\bmi\\',
                not: false,
              },
              {
                type: 'PhenotypicFilter',
                phenotypicFilterType: 'ANY_RECORD_OF',
                conceptPath: '\\study\\visits\\',
                not: false,
              },
            ],
          },
        ],
      },
    ],
  };
  const descriptor = {
    isOpenAccess: false,
    phenotypicClause,
    genomicFilters: [
      { key: 'Gene_with_variant', values: ['BRCA1'] },
      { key: 'genomic_range', min: 1 },
    ],
  };
  const request = buildQueryRequestV3FromDescriptor(descriptor, 'DATAFRAME', (query) => {
    query.select = [...NESTED_SELECT];
    return query;
  });
  return JSON.parse(JSON.stringify(request));
}

/**
 * Collects every object key in a JSON value, at any depth.
 *
 * @param value The parsed JSON value.
 * @returns The keys found, repeats included.
 */
function keysAtAnyDepth(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(keysAtAnyDepth);
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => [key, ...keysAtAnyDepth(child)]);
  }
  return [];
}

describe('exportResultType', () => {
  it.each(['DATAFRAME', 'DATAFRAME_PFB', 'DATAFRAME_TIMESERIES'] as const)(
    'returns %s for a V3 dataset stored with it',
    (type) => {
      expect(exportResultType(makeDataset({ query: storedQuery(type) }))).toBe(type);
    },
  );

  it('returns undefined for a V3 dataset stored with a count type', () => {
    expect(exportResultType(makeDataset({ query: storedQuery('COUNT') }))).toBeUndefined();
  });

  it('returns undefined for a V2 dataset', () => {
    const dataset = makeDataset({
      version: QueryVersion.V2,
      query: { expectedResultType: 'DATAFRAME', fields: [] } as unknown as DataSet['query'],
    });

    expect(exportResultType(dataset)).toBeUndefined();
  });
});

describe('requestVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requestVariant picks the linked query by sample and result type', async () => {
    const queries: LinkedQuery[] = [
      { queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' },
      { queryId: 'sample-pfb', sample: true, resultType: 'DATAFRAME_PFB' },
      { queryId: 'sample-untyped', sample: true, resultType: null },
      { queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' },
    ];
    const dataset = makeDataset({ queries });

    const sample = await requestVariant(dataset, true);
    const full = await requestVariant(dataset, false);

    expect(sample).toEqual({ queryId: 'sample-csv', dataset });
    expect(full).toEqual({ queryId: 'full-csv', dataset });
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('takes the query behind the Dataset ID as the full variant when its link has no result type', async () => {
    const dataset = makeDataset({
      queries: [{ queryId: 'full-csv', sample: false, resultType: null }],
    });

    const full = await requestVariant(dataset, false);

    expect(full.queryId).toBe('full-csv');
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('takes the query behind the Dataset ID as the full variant when the server lists no links', async () => {
    const full = await requestVariant(makeDataset(), false);

    expect(full.queryId).toBe('full-csv');
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('submits with sample true and links the new query when none is linked', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});
    const dataset = makeDataset({
      queries: [{ queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' }],
    });

    const result = await requestVariant(dataset, true);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe(QUERY_PATH);
    expect(sentBody(post.mock.calls[0])).toEqual({
      query: {
        select: ['\\study\\age\\'],
        authorizationFilters: [],
        phenotypicClause: null,
        genomicFilters: [],
        expectedResultType: 'DATAFRAME',
        picsureId: null,
        id: null,
        sample: true,
      },
    });
    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][0]).toBe(DATASET_PATH);
    expect(put.mock.calls[0][1]).toEqual({
      queryId: 'sample-csv',
      name: 'My cohort',
      archived: false,
      metadata: { note: 'kept' },
    });
    expect(result.queryId).toBe('sample-csv');
    expect(result.dataset.queryId).toBe('full-csv');
    expect(result.dataset.queries).toEqual([
      { queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' },
      { queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' },
    ]);
    expect(replaceDataset).toHaveBeenCalledWith(result.dataset);
    expect(dataset.queries).toHaveLength(1);
    expect((dataset.query as QueryV3).sample).toBe(false);
  });

  it('leaves sample off the request when the full variant has to be submitted', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-csv-new' });
    put.mockResolvedValueOnce({});
    const dataset = makeDataset({
      query: storedQuery('DATAFRAME', true),
      queryId: 'sample-csv',
      queries: [{ queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' }],
    });

    const result = await requestVariant(dataset, false);

    expect(sentBody(post.mock.calls[0]).query).not.toHaveProperty('sample');
    expect(result.queryId).toBe('full-csv-new');
  });

  it('returns the query id without recording a link when the link answers 409', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockRejectedValueOnce(httpError(409, '{"errorType":"conflict"}'));
    const dataset = makeDataset();

    const result = await requestVariant(dataset, true);

    expect(put).toHaveBeenCalledTimes(1);
    expect(result.queryId).toBe('sample-csv');
    expect(result.dataset).toBe(dataset);
    expect(result.dataset.queries).toEqual([]);
    expect(replaceDataset).not.toHaveBeenCalled();
  });

  it('sends null ids and no authorization filters when the stored query carries them', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});
    const stored = new QueryV3({
      select: ['\\study\\age\\'],
      authorizationFilters: [{ conceptPath: '\\_consents\\', values: ['phs000001.c1'] }],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType: 'DATAFRAME',
      picsureId: '11111111-2222-3333-4444-555555555555',
      id: '66666666-7777-8888-9999-000000000000',
    });

    await requestVariant(makeDataset({ query: stored }), true);

    expect(sentBody(post.mock.calls[0])).toEqual({
      query: {
        select: ['\\study\\age\\'],
        authorizationFilters: [],
        phenotypicClause: null,
        genomicFilters: [],
        expectedResultType: 'DATAFRAME',
        picsureId: null,
        id: null,
        sample: true,
      },
    });
    expect(stored.picsureId).toBe('11111111-2222-3333-4444-555555555555');
    expect(stored.authorizationFilters).toHaveLength(1);
  });

  it('re-posts a dataset mapped from server JSON without its stored ids and filters', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});
    const dataset = mapDataset(
      serverDataset([{ queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' }]),
    );
    expect((dataset.query as QueryV3).id).toBe('66666666-7777-8888-9999-000000000000');

    const result = await requestVariant(dataset, true);

    const sent = sentBody(post.mock.calls[0]).query as Record<string, unknown>;
    expect(Object.keys(sent).sort()).toEqual([
      'authorizationFilters',
      'expectedResultType',
      'genomicFilters',
      'id',
      'phenotypicClause',
      'picsureId',
      'sample',
      'select',
    ]);
    expect(sent).toMatchObject({
      select: ['\\study\\age\\'],
      authorizationFilters: [],
      genomicFilters: [],
      expectedResultType: 'DATAFRAME',
      picsureId: null,
      id: null,
      sample: true,
    });
    expect(sent.phenotypicClause).toMatchObject({
      phenotypicFilterType: 'FILTER',
      conceptPath: '\\study\\sex\\',
      values: ['Male'],
      not: false,
    });
    expect(put.mock.calls[0][1]).toEqual({
      queryId: 'sample-csv',
      name: 'My cohort',
      archived: false,
      metadata: { note: 'kept' },
    });
    expect(result.dataset.queryId).toBe('full-csv');
  });

  it('posts the sample of a nested stored query in the body the explorer builds, without a type key', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});
    const dataset = mapDataset(nestedServerDataset(false));
    expect(keysAtAnyDepth(JSON.parse(JSON.stringify(dataset.query)))).toContain('type');

    await requestVariant(dataset, true);

    const sent = sentBody(post.mock.calls[0]);
    const explorer = explorerBody();
    expect(keysAtAnyDepth(explorer)).not.toContain('type');
    expect(keysAtAnyDepth(sent)).not.toContain('type');
    expect(sent).toEqual({ query: { ...(explorer.query as object), sample: true } });
    expect(JSON.stringify(post.mock.calls[0][1])).not.toContain('"type"');
  });

  it('posts the full variant of a nested stored query exactly as the explorer builds it', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-csv-new' });
    put.mockResolvedValueOnce({});
    const dataset = mapDataset(nestedServerDataset(true));

    await requestVariant(dataset, false);

    const sent = sentBody(post.mock.calls[0]);
    expect(keysAtAnyDepth(sent)).not.toContain('type');
    expect(sent).toEqual(explorerBody());
    expect(sent.query).not.toHaveProperty('sample');
  });

  it('sends no link when the server response carried no queries array', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    const dataset = mapDataset(serverDataset());

    const result = await requestVariant(dataset, true);

    expect(post).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
    expect(replaceDataset).not.toHaveBeenCalled();
    expect(result.queryId).toBe('sample-csv');
    expect(result.dataset).toBe(dataset);
  });

  it('links when the server response carried an empty queries array', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});
    const dataset = mapDataset(serverDataset([]));

    const result = await requestVariant(dataset, true);

    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][0]).toBe(DATASET_PATH);
    expect(put.mock.calls[0][1].queryId).toBe('sample-csv');
    expect(result.dataset.queries).toEqual([
      { queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' },
    ]);
  });

  it('links with the name, archived flag and metadata of the cached dataset', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});
    const dataset = makeDataset();
    cachedDataset.mockReturnValueOnce({
      ...dataset,
      name: 'Renamed',
      archived: true,
      metadata: { note: 'edited' },
    });

    const result = await requestVariant(dataset, true);

    expect(cachedDataset).toHaveBeenCalledWith('dataset-uuid');
    expect(put.mock.calls[0][1]).toEqual({
      queryId: 'sample-csv',
      name: 'Renamed',
      archived: true,
      metadata: { note: 'edited' },
    });
    expect(result.dataset.name).toBe('Renamed');
    expect(result.dataset.archived).toBe(true);
    expect(replaceDataset).toHaveBeenCalledWith(result.dataset);
  });

  it('rejects when linking fails for another reason', async () => {
    const forbidden = httpError(403, 'Forbidden');
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockRejectedValueOnce(forbidden);

    await expect(requestVariant(makeDataset(), true)).rejects.toBe(forbidden);
    expect(replaceDataset).not.toHaveBeenCalled();
  });

  it('rejects when the submit answers without a query id', async () => {
    post.mockResolvedValueOnce({});

    await expect(requestVariant(makeDataset(), true)).rejects.toThrow();
    expect(put).not.toHaveBeenCalled();
  });

  it('submits nothing for a dataset stored with a count type', async () => {
    const dataset = makeDataset({ query: storedQuery('COUNT') });

    await expect(requestVariant(dataset, true)).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('passes the abort signal to the submit and the link', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});
    const { signal } = new AbortController();

    await requestVariant(makeDataset(), true, signal);

    expect(post.mock.calls[0][4]).toEqual({ signal });
    expect(put.mock.calls[0][4]).toEqual({ signal });
  });
});

describe('linkQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('puts the query id with the name, archived flag and metadata of the dataset', async () => {
    put.mockResolvedValueOnce({});

    await expect(linkQuery(makeDataset({ archived: true }), 'sample-csv')).resolves.toBe(true);

    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][0]).toBe(DATASET_PATH);
    expect(put.mock.calls[0][1]).toEqual({
      queryId: 'sample-csv',
      name: 'My cohort',
      archived: true,
      metadata: { note: 'kept' },
    });
  });

  it('resolves false when the server answers 409', async () => {
    put.mockRejectedValueOnce(httpError(409, '{"errorType":"conflict"}'));

    await expect(linkQuery(makeDataset(), 'sample-csv')).resolves.toBe(false);
  });
});
