import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get as read } from 'svelte/store';

const { get, post, put } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));

vi.mock('$lib/api', () => ({ get, post, put }));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));

import { QueryVersion, type DataSet } from '$lib/models/Dataset';
import { QueryV3 } from '$lib/models/query/Query';
import { requestVariant } from '$lib/services/datasets';
import { cachedDataset, datasets, getDataset, replaceDataset } from '$lib/stores/Dataset.svelte';

function makeDataset(overrides: Partial<DataSet> = {}): DataSet {
  return {
    version: QueryVersion.V3,
    uuid: 'dataset-uuid',
    user: 'user@example.org',
    name: 'My cohort',
    archived: false,
    metadata: { note: 'kept' },
    query: new QueryV3({
      select: ['\\study\\age\\'],
      authorizationFilters: [],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType: 'DATAFRAME',
      picsureId: null,
      id: null,
    }),
    queryId: 'full-csv',
    queries: [{ queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' }],
    supportsLinkedQueries: true,
    startTime: '2026-11-09',
    rawStartTime: 1,
    status: 'AVAILABLE',
    ...overrides,
  };
}

describe('dataset store', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    datasets.set([]);
  });

  it('replaceDataset swaps the cached copy with the same uuid and leaves the others', async () => {
    const other = makeDataset({ uuid: 'other-uuid', name: 'Other' });
    datasets.set([other, makeDataset()]);
    const newer = makeDataset({ name: 'Renamed' });

    replaceDataset(newer);

    expect(read(datasets)).toEqual([other, newer]);
    expect(read(datasets)[1]).toBe(newer);
    expect(await getDataset('dataset-uuid')).toBe(newer);
    expect(get).not.toHaveBeenCalled();
  });

  it('replaceDataset does not add a dataset that is not cached', () => {
    const other = makeDataset({ uuid: 'other-uuid' });
    datasets.set([other]);

    replaceDataset(makeDataset());

    expect(read(datasets)).toEqual([other]);
    expect(cachedDataset('dataset-uuid')).toBeUndefined();
  });

  it('cachedDataset reads the cache without a request', () => {
    const cached = makeDataset();
    datasets.set([cached]);

    expect(cachedDataset('dataset-uuid')).toBe(cached);
    expect(cachedDataset('missing-uuid')).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });

  it('requestVariant keeps a rename and an archive made after the page copy was read', async () => {
    const pageCopy = makeDataset();
    datasets.set([makeDataset({ name: 'Renamed', archived: true })]);
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});

    const result = await requestVariant(pageCopy, true);

    expect(put.mock.calls[0][1]).toEqual({
      queryId: 'sample-csv',
      name: 'Renamed',
      archived: true,
      metadata: { note: 'kept' },
    });
    const cached = cachedDataset('dataset-uuid');
    expect(cached).toBe(result.dataset);
    expect(cached?.name).toBe('Renamed');
    expect(cached?.archived).toBe(true);
    expect(cached?.queryId).toBe('full-csv');
    expect(cached?.queries).toEqual([
      { queryId: 'full-csv', sample: false, resultType: 'DATAFRAME' },
      { queryId: 'sample-csv', sample: true, resultType: 'DATAFRAME' },
    ]);
  });

  it('requestVariant links with the page copy when the dataset is not cached', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });
    put.mockResolvedValueOnce({});

    const result = await requestVariant(makeDataset(), true);

    expect(put.mock.calls[0][1].name).toBe('My cohort');
    expect(result.dataset.queries).toHaveLength(2);
    expect(read(datasets)).toEqual([]);
  });
});
