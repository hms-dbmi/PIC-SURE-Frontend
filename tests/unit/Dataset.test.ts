import { describe, it, expect } from 'vitest';

import { mapDataset, QueryVersion } from '$lib/models/Dataset';
import { QueryV2, QueryV3 } from '$lib/models/query/Query';

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
      expect(dataset.query).toBeInstanceOf(QueryV2);
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
      expect(dataset.query).toBeInstanceOf(QueryV2);
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
      // Given — string still contains 'categoryFilters' so version detection succeeds,
      // but the outer JSON.parse itself fails
      const data = makeData('{not valid json, categoryFilters');

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.query).toBeNull();
    });

    it('does not treat a plain string value of query.query.query.query as double-encoded', () => {
      // Given — jsonQuery.query parses to a JSON string primitive ("foo"), not an object,
      // so it should be left as-is rather than parsed again
      const data = makeData(JSON.stringify({ query: '"categoryFilters-marker"' }));

      // When
      const dataset = mapDataset(data);

      // Then — falls through to QueryV2 constructor with a string, which yields defaults
      expect(dataset.version).toBe(QueryVersion.V2);
      expect(dataset.query).toBeInstanceOf(QueryV2);
      expect((dataset.query as QueryV2).categoryFilters).toEqual({});
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
