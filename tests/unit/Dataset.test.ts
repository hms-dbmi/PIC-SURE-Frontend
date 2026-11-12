import { describe, it, expect } from 'vitest';

import { mapDataset, QueryVersion } from '$lib/models/Dataset';
import { QueryV3 } from '$lib/models/query/Query';
import type { QueryV2 } from '$lib/compat/QueryV2';

const V2_INNER_QUERY = {
  categoryFilters: { '\\\\dataset\\\\sex\\\\': ['Male'] },
  fields: ['\\\\dataset\\\\age\\\\'],
};

const V3_INNER_QUERY = {
  phenotypicClause: {
    type: 'PhenotypicFilter',
    phenotypicFilterType: 'FILTER',
    conceptPath: '\\\\dataset\\\\sex\\\\',
    not: false,
    values: ['Male'],
  },
  select: ['\\\\dataset\\\\age\\\\'],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeData(rawQuery: string, overrides: Partial<Record<string, any>> = {}) {
  return {
    uuid: 'dataset-uuid',
    user: 'test-user',
    name: 'Test Dataset',
    archived: false,
    metadata: {},
    query: {
      query: rawQuery,
      uuid: 'query-uuid',
      startTime: 1690000000000,
      status: 'COMPLETE',
    },
    ...overrides,
  };
}

// Simulates the normal case: query.query.query is a plain object nested inside the outer JSON string.
function singleEncode(innerQuery: object, extra: object = {}) {
  return JSON.stringify({ query: innerQuery, ...extra });
}

// Simulates the bug case: query.query.query has been JSON.stringify'd an extra time,
// so `jsonQuery.query` is itself a JSON-encoded string rather than an object.
function doubleEncode(innerQuery: object, extra: object = {}) {
  return JSON.stringify({ query: JSON.stringify(innerQuery), ...extra });
}

describe('mapDataset', () => {
  describe('single-encoded query.query.query (normal path)', () => {
    it('maps a V2 query', () => {
      // Given
      const data = makeData(singleEncode(V2_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.V2);
      const query = dataset.query as QueryV2;
      expect(query.categoryFilters).toEqual(V2_INNER_QUERY.categoryFilters);
      expect(query.fields).toEqual(V2_INNER_QUERY.fields);
    });

    it('maps a V3 query', () => {
      // Given
      const data = makeData(singleEncode(V3_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.V3);
      expect(dataset.query).toBeInstanceOf(QueryV3);
      const query = dataset.query as QueryV3;
      expect(query.select).toEqual(V3_INNER_QUERY.select);
      expect(query.phenotypicClause).toMatchObject({
        type: 'PhenotypicFilter',
        conceptPath: '\\\\dataset\\\\sex\\\\',
        values: ['Male'],
      });
    });
  });

  describe('double-encoded query.query.query (extra JSON.stringify layer)', () => {
    it('maps a V2 query', () => {
      // This path is unlikely, but may as well test it
      // Given
      const data = makeData(doubleEncode(V2_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.V2);
      const query = dataset.query as QueryV2;
      expect(query.categoryFilters).toEqual(V2_INNER_QUERY.categoryFilters);
      expect(query.fields).toEqual(V2_INNER_QUERY.fields);
    });

    it('maps a V3 query', () => {
      // Given
      const data = makeData(doubleEncode(V3_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.V3);
      expect(dataset.query).toBeInstanceOf(QueryV3);
      const query = dataset.query as QueryV3;
      expect(query.select).toEqual(V3_INNER_QUERY.select);
      expect(query.phenotypicClause).toMatchObject({
        type: 'PhenotypicFilter',
        conceptPath: '\\\\dataset\\\\sex\\\\',
        values: ['Male'],
      });
    });
  });

  describe('federated commonAreaUUID', () => {
    // these paths are also unlikely, but may as well test them
    it('sets federated.commonId when single-encoded', () => {
      // Given
      const data = makeData(singleEncode(V2_INNER_QUERY, { commonAreaUUID: 'common-area-uuid' }));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.federated).toEqual({ commonId: 'common-area-uuid' });
    });

    it('sets federated.commonId when double-encoded', () => {
      // Given
      const data = makeData(doubleEncode(V2_INNER_QUERY, { commonAreaUUID: 'common-area-uuid' }));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.federated).toEqual({ commonId: 'common-area-uuid' });
    });

    it('leaves federated undefined when commonAreaUUID is absent', () => {
      // Given
      const data = makeData(singleEncode(V2_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.federated).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns a null query when the version cannot be determined', () => {
      // Given
      const data = makeData(JSON.stringify({ query: { unrelatedField: true } }));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
    });

    it('returns a null query when query.query.query is not valid JSON', () => {
      // Given
      const data = makeData('{not valid json, categoryFilters');

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
    });

    it('does not mistake a categoryFilters string marker for a V2 query', () => {
      // Given
      const data = makeData(JSON.stringify({ query: '"categoryFilters-marker"' }));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
    });

    it('accepts a historical V2 query with null categoryFilters', () => {
      // Given
      const data = makeData(
        JSON.stringify({ query: { categoryFilters: null, fields: ['\\\\dataset\\\\age\\\\'] } }),
      );

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.V2);
      expect(dataset.query).toMatchObject({
        categoryFilters: {},
        fields: ['\\\\dataset\\\\age\\\\'],
      });
    });

    it('rejects a V2-shaped query whose categoryFilters value is not an object', () => {
      // Given
      const data = makeData(JSON.stringify({ query: { categoryFilters: 'invalid' } }));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
    });

    it('normalizes the explicit nulls the API returns for unset v3 fields', () => {
      // Given
      const data = makeData(
        doubleEncode({
          select: ['\\\\dataset\\\\age\\\\'],
          authorizationFilters: [],
          phenotypicClause: {
            not: false,
            operator: 'AND',
            phenotypicClauses: [
              {
                phenotypicFilterType: 'REQUIRED',
                conceptPath: '\\\\dataset\\\\age\\\\',
                values: null,
                min: null,
                max: null,
                not: false,
              },
            ],
          },
          genomicFilters: [{ key: 'Gene_with_variant', values: ['HTR6'], min: null, max: null }],
          expectedResultType: 'DATAFRAME',
          picsureId: null,
          id: null,
        }),
      );

      // When
      const dataset = mapDataset(data);

      // Then
      const query = dataset.query as QueryV3;
      expect(query.genomicFilters[0].min).toBeUndefined();
      expect(query.genomicFilters[0].max).toBeUndefined();
      expect(query.genomicFilters[0].values).toEqual(['HTR6']);
      const leaf = query.leaves[0];
      expect(leaf.min).toBeUndefined();
      expect(leaf.max).toBeUndefined();
      expect(leaf.values).toBeUndefined();
    });

    it('resets the version when a malformed V3 query cannot be deserialized', () => {
      // Given
      const data = makeData(
        JSON.stringify({
          query: {
            phenotypicClause: { operator: 'AND', phenotypicClauses: 'invalid' },
          },
        }),
      );

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.version).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
    });
  });

  describe('sample variant', () => {
    it('keeps sample on a V3 round trip', () => {
      const data = makeData(singleEncode({ ...V3_INNER_QUERY, sample: true }));

      const query = mapDataset(data).query as QueryV3;

      expect(query.sample).toBe(true);
      const resubmitted = QueryV3.fromSerialized(JSON.parse(JSON.stringify(query)));
      expect(resubmitted.sample).toBe(true);
      expect(new QueryV3(query).sample).toBe(true);
    });

    it('reads sample false when the stored query omits it', () => {
      const data = makeData(singleEncode(V3_INNER_QUERY));

      const query = mapDataset(data).query as QueryV3;

      expect(query.sample).toBe(false);
      expect(JSON.parse(JSON.stringify(query))).not.toHaveProperty('sample');
      expect(new QueryV3().sample).toBe(false);
    });

    it('reads sample false when the stored value is not the boolean true', () => {
      const stored = { ...V3_INNER_QUERY, sample: 'true' };

      const query = mapDataset(makeData(singleEncode(stored))).query as QueryV3;

      expect(query.sample).toBe(false);
    });
  });

  describe('linked queries', () => {
    it('maps linked queries and defaults to an empty list', () => {
      const queries = [
        { queryId: 'full-query-uuid', sample: false, resultType: 'DATAFRAME' },
        { queryId: 'sample-query-uuid', sample: true, resultType: 'DATAFRAME' },
        { queryId: 'old-query-uuid', sample: false, resultType: null },
      ];

      const linked = mapDataset(makeData(singleEncode(V3_INNER_QUERY), { queries }));
      const unlinked = mapDataset(makeData(singleEncode(V3_INNER_QUERY)));
      const nulled = mapDataset(makeData(singleEncode(V3_INNER_QUERY), { queries: null }));

      expect(linked.queries).toEqual(queries);
      expect(unlinked.queries).toEqual([]);
      expect(nulled.queries).toEqual([]);
    });

    it('drops linked queries without a string id and coerces the other fields', () => {
      const queries = [
        'not-an-object',
        null,
        ['query-in-an-array'],
        { sample: true, resultType: 'DATAFRAME' },
        { queryId: 42, sample: false, resultType: 'DATAFRAME' },
        { queryId: 'string-sample-uuid', sample: 'true', resultType: 'DATAFRAME' },
        { queryId: 'numeric-type-uuid', sample: true, resultType: 7 },
        { queryId: 'bare-uuid' },
      ];

      const dataset = mapDataset(makeData(singleEncode(V3_INNER_QUERY), { queries }));

      expect(dataset.queries).toEqual([
        { queryId: 'string-sample-uuid', sample: false, resultType: 'DATAFRAME' },
        { queryId: 'numeric-type-uuid', sample: true, resultType: null },
        { queryId: 'bare-uuid', sample: false, resultType: null },
      ]);
    });
  });

  describe('other fields', () => {
    it('maps top-level dataset fields and derives startTime', () => {
      // Given
      const data = makeData(singleEncode(V2_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.uuid).toBe('dataset-uuid');
      expect(dataset.user).toBe('test-user');
      expect(dataset.name).toBe('Test Dataset');
      expect(dataset.queryId).toBe('query-uuid');
      expect(dataset.rawStartTime).toBe(1690000000000);
      expect(dataset.status).toBe('COMPLETE');
    });

    it('defaults status to UNDEFINED when missing', () => {
      // Given
      const data = makeData(singleEncode(V2_INNER_QUERY));
      data.query.status = '';

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.status).toBe('UNDEFINED');
    });
  });
});
