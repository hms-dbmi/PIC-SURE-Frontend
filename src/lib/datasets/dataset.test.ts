import { describe, it, expect } from 'vitest';

import { mapDataset, QueryVersion } from '#lib/datasets/dataset.ts';
import { queryLeaves, type Query } from '#lib/query/query.ts';

const V2_INNER_QUERY = {
  categoryFilters: { '\\\\dataset\\\\sex\\\\': ['Male'] },
  fields: ['\\\\dataset\\\\age\\\\'],
};

const V2_AS_CURRENT: Query = {
  select: ['\\\\dataset\\\\age\\\\'],
  authorizationFilters: [],
  phenotypicClause: {
    type: 'PhenotypicFilter',
    phenotypicFilterType: 'FILTER',
    conceptPath: '\\\\dataset\\\\sex\\\\',
    values: ['Male'],
    not: false,
  },
  genomicFilters: [],
  expectedResultType: 'COUNT',
  picsureId: null,
  id: null,
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
      expect(dataset.sourceVersion).toBe(QueryVersion.V2);
      expect(dataset.query).toEqual(V2_AS_CURRENT);
    });

    it('maps a V3 query', () => {
      // Given
      const data = makeData(singleEncode(V3_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.sourceVersion).toBe(QueryVersion.V3);
      const query = dataset.query as Query;
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
      expect(dataset.sourceVersion).toBe(QueryVersion.V2);
      expect(dataset.query).toEqual(V2_AS_CURRENT);
    });

    it('maps a V3 query', () => {
      // Given
      const data = makeData(doubleEncode(V3_INNER_QUERY));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.sourceVersion).toBe(QueryVersion.V3);
      const query = dataset.query as Query;
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
      expect(dataset.sourceVersion).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
    });

    it('returns a null query when query.query.query is not valid JSON', () => {
      // Given
      const data = makeData('{not valid json, categoryFilters');

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.sourceVersion).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
    });

    it('does not mistake a categoryFilters string marker for a V2 query', () => {
      // Given
      const data = makeData(JSON.stringify({ query: '"categoryFilters-marker"' }));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.sourceVersion).toBe(QueryVersion.UNKNOWN);
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
      expect(dataset.sourceVersion).toBe(QueryVersion.V2);
      expect(dataset.query).toMatchObject({
        phenotypicClause: null,
        select: ['\\\\dataset\\\\age\\\\'],
      });
    });

    it('rejects a V2-shaped query whose categoryFilters value is not an object', () => {
      // Given
      const data = makeData(JSON.stringify({ query: { categoryFilters: 'invalid' } }));

      // When
      const dataset = mapDataset(data);

      // Then
      expect(dataset.sourceVersion).toBe(QueryVersion.UNKNOWN);
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
      const query = dataset.query as Query;
      expect(query.genomicFilters[0].min).toBeUndefined();
      expect(query.genomicFilters[0].max).toBeUndefined();
      expect(query.genomicFilters[0].values).toEqual(['HTR6']);
      const leaf = queryLeaves(query)[0];
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
      expect(dataset.sourceVersion).toBe(QueryVersion.UNKNOWN);
      expect(dataset.query).toBeNull();
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

// Saved datasets in the shapes the backend returns (from the e2e mocks): the outer query string
// wraps the request, and saved clauses carry no `type` tags.
describe('mapDataset with saved datasets', () => {
  const GENDER = '\\\\demographics\\\\gender\\\\';
  const HEIGHT = '\\\\demographics\\\\height\\\\';
  const saved = (innerQuery: object) =>
    makeData(
      JSON.stringify({
        resourceCredentials: { BEARER_TOKEN: null },
        query: innerQuery,
        resourceUUID: 'resource-uuid',
      }),
    );

  it('maps a current-format dataset as saved', () => {
    const dataset = mapDataset(
      saved({
        select: [GENDER, HEIGHT],
        authorizationFilters: [],
        phenotypicClause: {
          operator: 'AND',
          phenotypicClauses: [
            {
              phenotypicFilterType: 'FILTER',
              conceptPath: GENDER,
              not: false,
              values: ['Undisclosed'],
            },
          ],
          not: false,
        },
        genomicFilters: [{ key: 'chr17,35269878,GT,A', values: ['0/1'] }],
        expectedResultType: 'DATAFRAME',
        picsureId: null,
        id: null,
      }),
    );

    expect(dataset.sourceVersion).toBe(QueryVersion.V3);
    expect(dataset.query).toEqual({
      select: [GENDER, HEIGHT],
      authorizationFilters: [],
      phenotypicClause: {
        type: 'PhenotypicSubquery',
        operator: 'AND',
        phenotypicClauses: [
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: GENDER,
            not: false,
            values: ['Undisclosed'],
          },
        ],
        not: false,
      },
      genomicFilters: [{ key: 'chr17,35269878,GT,A', values: ['0/1'] }],
      expectedResultType: 'DATAFRAME',
      picsureId: null,
      id: null,
    });
  });

  it('converts a V2 dataset to the current format and remembers it was V2', () => {
    const dataset = mapDataset(
      saved({
        categoryFilters: { [GENDER]: ['Undisclosed'] },
        numericFilters: { [HEIGHT]: { min: 100 } },
        requiredFields: [],
        anyRecordOf: [],
        anyRecordOfMulti: [],
        fields: [HEIGHT],
        crossCountFields: [GENDER],
        variantInfoFilters: [
          {
            categoryVariantInfoFilters: { Gene_with_variant: ['BRCA1'] },
            numericVariantInfoFilters: {},
          },
        ],
        expectedResultType: 'DATAFRAME',
      }),
    );

    expect(dataset.sourceVersion).toBe(QueryVersion.V2);
    expect(dataset.query).toEqual({
      select: [HEIGHT, GENDER],
      authorizationFilters: [],
      phenotypicClause: {
        type: 'PhenotypicSubquery',
        operator: 'AND',
        phenotypicClauses: [
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: GENDER,
            values: ['Undisclosed'],
            not: false,
          },
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: HEIGHT,
            min: 100,
            max: undefined,
            not: false,
          },
        ],
        not: false,
      },
      genomicFilters: [{ key: 'Gene_with_variant', values: ['BRCA1'] }],
      expectedResultType: 'DATAFRAME',
      picsureId: null,
      id: null,
    });
  });

  it('rejects a response that is not a dataset', () => {
    expect(() => mapDataset({ uuid: 'dataset-uuid' })).toThrow('Invalid dataset response');
  });
});
