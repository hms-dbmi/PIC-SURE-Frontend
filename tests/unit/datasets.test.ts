import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post, put } = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/api', () => ({ post, put }));

import { mapDataset, QueryVersion, type DataSet, type LinkedQuery } from '$lib/models/Dataset';
import { QueryV3, type ExpectedResultType, type PhenotypicClause } from '$lib/models/query/Query';
import { createDatasetName, exportResultType, requestVariant } from '$lib/services/datasets';
import { buildQueryRequestV3FromDescriptor } from '$lib/utilities/QueryBuilder';

const QUERY_PATH = 'picsure/hpds/auth/query';
const NAMED_DATASET_PATH = 'picsure/operations/dataset/named';

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
    startTime: '2026-11-09',
    rawStartTime: 1,
    status: 'AVAILABLE',
    ...overrides,
  };
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
 * @param sample True when the stored query, and the one query listed, is the sample.
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

describe('createDatasetName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts the query id and name when handed a sample query', async () => {
    const saved = makeDataset({
      query: storedQuery('DATAFRAME', true),
      queryId: 'sample-csv',
      queries: [{ queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' }],
    });
    post.mockResolvedValueOnce(saved);

    const saveWithQuery = createDatasetName as (
      queryId: string,
      name: string,
      query: QueryV3,
    ) => Promise<DataSet>;

    await expect(
      saveWithQuery('sample-csv', 'My cohort', storedQuery('DATAFRAME', true)),
    ).resolves.toBe(saved);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]).toEqual([
      NAMED_DATASET_PATH,
      { queryId: 'sample-csv', name: 'My cohort' },
    ]);
  });

  it('posts the query id and name for a query that is not a sample', async () => {
    const saved = makeDataset();
    post.mockResolvedValueOnce(saved);

    await expect(createDatasetName('full-csv', 'My cohort')).resolves.toBe(saved);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(NAMED_DATASET_PATH, {
      queryId: 'full-csv',
      name: 'My cohort',
    });
  });

  it('rejects with what the server refused the save with', async () => {
    const refusal = { status: 400, body: { message: '{"message":"Not allowed"}' } };
    post.mockRejectedValueOnce(refusal);

    await expect(createDatasetName('sample-csv', 'My cohort')).rejects.toBe(refusal);

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('sends nothing for a name with a character that is not allowed', async () => {
    await expect(createDatasetName('sample-csv', 'My <cohort>')).rejects.toContain(
      'Name can only contain',
    );

    expect(post).not.toHaveBeenCalled();
  });
});

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

  it('picks the listed query by sample and result type', async () => {
    const queries: LinkedQuery[] = [
      { queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' },
      { queryId: 'sample-pfb', sample: true, resultType: 'DATAFRAME_PFB' },
      { queryId: 'sample-untyped', sample: true, resultType: null },
      { queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' },
    ];
    const dataset = makeDataset({ queries });

    const sample = await requestVariant(dataset, true);
    const full = await requestVariant(dataset, false);

    expect(sample).toBe('sample-csv');
    expect(full).toBe('full-csv');
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('submits and sends no PUT when the variant is not listed', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    const dataset = makeDataset({
      queries: [{ queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' }],
    });

    const queryId = await requestVariant(dataset, true);

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
    expect(put).not.toHaveBeenCalled();
    expect(queryId).toBe('sample-csv');
    expect(dataset.queryId).toBe('full-csv');
    expect(dataset.queries).toEqual([
      { queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' },
    ]);
    expect((dataset.query as QueryV3).sample).toBe(false);
  });

  it('submits the full variant for a dataset that lists no queries', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-csv' });
    const dataset = mapDataset(serverDataset());
    expect(dataset.queries).toEqual([]);

    const queryId = await requestVariant(dataset, false);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe(QUERY_PATH);
    expect(sentBody(post.mock.calls[0]).query).toMatchObject({
      select: ['\\study\\age\\'],
      authorizationFilters: [],
      expectedResultType: 'DATAFRAME',
      picsureId: null,
      id: null,
    });
    expect(sentBody(post.mock.calls[0]).query).not.toHaveProperty('sample');
    expect(put).not.toHaveBeenCalled();
    expect(queryId).toBe('full-csv');
  });

  it('submits the full variant when the listed query behind the Dataset ID has no result type', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-csv' });
    const dataset = makeDataset({
      queries: [{ queryId: 'full-csv', sample: false, resultType: null }],
    });

    const queryId = await requestVariant(dataset, false);

    expect(post).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
    expect(queryId).toBe('full-csv');
  });

  it('submits again on a second request and returns the id the server gives each time', async () => {
    post
      .mockResolvedValueOnce({ picsureResultId: 'sample-csv' })
      .mockResolvedValueOnce({ picsureResultId: 'sample-csv-again' });
    const dataset = makeDataset({
      queries: [{ queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' }],
    });

    const first = await requestVariant(dataset, true);
    const second = await requestVariant(dataset, true);

    expect(first).toBe('sample-csv');
    expect(second).toBe('sample-csv-again');
    expect(post).toHaveBeenCalledTimes(2);
    expect(sentBody(post.mock.calls[1])).toEqual(sentBody(post.mock.calls[0]));
    expect(put).not.toHaveBeenCalled();
  });

  it('reuses the listed row for the sample of a dataset saved from a sample query', async () => {
    const dataset = makeDataset({
      query: storedQuery('DATAFRAME', true),
      queryId: 'sample-csv',
      queries: [{ queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' }],
    });

    const queryId = await requestVariant(dataset, true);

    expect(queryId).toBe('sample-csv');
    expect(post).not.toHaveBeenCalled();
  });

  it('submits with sample set for a dataset saved from a sample query that lists no queries', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv-new' });
    const dataset = makeDataset({
      query: storedQuery('DATAFRAME', true),
      queryId: 'sample-csv',
    });

    const queryId = await requestVariant(dataset, true);

    expect(sentBody(post.mock.calls[0]).query).toHaveProperty('sample', true);
    expect(queryId).toBe('sample-csv-new');
  });

  it('leaves sample off the request when the full variant has to be submitted', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-csv-new' });
    const dataset = makeDataset({
      query: storedQuery('DATAFRAME', true),
      queryId: 'sample-csv',
      queries: [{ queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' }],
    });

    const queryId = await requestVariant(dataset, false);

    expect(sentBody(post.mock.calls[0]).query).not.toHaveProperty('sample');
    expect(queryId).toBe('full-csv-new');
  });

  it('sends null ids and no authorization filters when the stored query carries them', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
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
    const dataset = mapDataset(
      serverDataset([{ queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' }]),
    );
    expect((dataset.query as QueryV3).id).toBe('66666666-7777-8888-9999-000000000000');

    const queryId = await requestVariant(dataset, true);

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
    expect(put).not.toHaveBeenCalled();
    expect(queryId).toBe('sample-csv');
  });

  it('posts the sample of a nested stored query in the body the explorer builds, without a type key', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
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
    const dataset = mapDataset(nestedServerDataset(true));

    await requestVariant(dataset, false);

    const sent = sentBody(post.mock.calls[0]);
    expect(keysAtAnyDepth(sent)).not.toContain('type');
    expect(sent).toEqual(explorerBody());
    expect(sent.query).not.toHaveProperty('sample');
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

  it('passes the abort signal to the submit', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    const { signal } = new AbortController();

    await requestVariant(makeDataset(), true, signal);

    expect(post.mock.calls[0][4]).toEqual({ signal });
    expect(put).not.toHaveBeenCalled();
  });
});
