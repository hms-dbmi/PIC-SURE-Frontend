import { beforeEach, describe, expect, it, vi } from 'vitest';
import { error } from '@sveltejs/kit';

const { post, put, replaceDataset } = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
  replaceDataset: vi.fn(),
}));

vi.mock('$lib/api', () => ({ post, put }));
vi.mock('$lib/stores/Dataset.svelte', () => ({ replaceDataset }));

import { QueryVersion, type DataSet, type LinkedQuery } from '$lib/models/Dataset';
import { QueryV3, type ExpectedResultType } from '$lib/models/query/Query';
import { exportResultType, linkQuery, requestVariant } from '$lib/services/datasets';

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

  it('treats a 409 on link as already linked', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockRejectedValueOnce(httpError(409, '{"errorType":"conflict"}'));

    const result = await requestVariant(makeDataset(), true);

    expect(result.queryId).toBe('sample-csv');
    expect(result.dataset.queries).toContainEqual({
      queryId: 'sample-csv',
      sample: true,
      resultType: 'DATAFRAME',
    });
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

    await linkQuery(makeDataset({ archived: true }), 'sample-csv');

    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][0]).toBe(DATASET_PATH);
    expect(put.mock.calls[0][1]).toEqual({
      queryId: 'sample-csv',
      name: 'My cohort',
      archived: true,
      metadata: { note: 'kept' },
    });
  });
});
