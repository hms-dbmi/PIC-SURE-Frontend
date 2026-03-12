import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QueryV2, QueryV3 } from '$lib/models/query/Query';
import { QueryVersion } from '$lib/models/Dataset';
import type { SearchResult } from '$lib/models/Search';
import type {
  FilterGroupInterface,
  AnyRecordOfFilterInterface,
  GenomicFilterInterface,
} from '$lib/models/Filter';
import { getConceptDetails, getConceptTree } from '$lib/stores/Dictionary';

import {
  queryV2ToV3,
  genomicV3ToFilter,
  pathToSearchResult,
  queryToFilterTree,
  loadQuerySummaryData,
} from '$lib/components/query/QueryConverters';

// Silence console errors logs
vi.spyOn(console, 'error').mockImplementation(() => undefined);

// Mock modules with SvelteKit / store dependencies
vi.mock('$lib/stores/Dictionary', () => ({
  getConceptDetails: vi.fn(),
  getConceptTree: vi.fn(),
  ENSURE_MAX_DEPTH: 100,
}));

vi.mock('$lib/stores/Filter', () => ({
  createGroup: (nodes: unknown[], operator: string) => ({
    children: nodes,
    operator,
    parent: undefined,
  }),
}));

const mockGetConceptDetails = vi.mocked(getConceptDetails);
const mockGetConceptTree = vi.mocked(getConceptTree);

function makeSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    conceptPath: '\\\\dataset\\\\variable\\\\',
    dataset: 'dataset',
    name: 'Variable Name',
    display: 'Variable Display',
    studyAcronym: 'STUDY',
    description: 'A test variable',
    allowFiltering: true,
    type: 'Categorical',
    ...overrides,
  };
}

function makeV2Query(overrides: Partial<ConstructorParameters<typeof QueryV2>[0]> = {}): QueryV2 {
  return new QueryV2({
    categoryFilters: {},
    numericFilters: {},
    requiredFields: [],
    anyRecordOf: [],
    anyRecordOfMulti: [],
    fields: [],
    crossCountFields: [],
    variantInfoFilters: [],
    expectedResultType: 'COUNT',
    ...overrides,
  });
}

function makeV3Query(overrides: Partial<ConstructorParameters<typeof QueryV3>[0]> = {}): QueryV3 {
  return new QueryV3({
    phenotypicClause: null,
    select: [],
    authorizationFilters: [],
    genomicFilters: [],
    expectedResultType: 'COUNT',
    picsureId: null,
    id: null,
    ...overrides,
  });
}

describe('queryV2ToV3', () => {
  describe('select', () => {
    it('maps fields to select', () => {
      // Given
      const query = makeV2Query({
        fields: ['\\\\dataset\\\\apples\\\\', '\\\\dataset\\\\banana\\\\'],
      });

      // When
      const result = queryV2ToV3(query);

      // Then
      expect(result.select).toEqual(['\\\\dataset\\\\apples\\\\', '\\\\dataset\\\\banana\\\\']);
    });

    it('merges fields and crossCountFields into select, deduplicating', () => {
      // Given
      const query = makeV2Query({
        fields: ['\\\\dataset\\\\apples\\\\', '\\\\dataset\\\\banana\\\\'],
        crossCountFields: ['\\\\dataset\\\\banana\\\\', '\\\\dataset\\\\cactus\\\\'],
      });

      // When
      const result = queryV2ToV3(query);

      // Then
      expect(result.select).toEqual([
        '\\\\dataset\\\\apples\\\\',
        '\\\\dataset\\\\banana\\\\',
        '\\\\dataset\\\\cactus\\\\',
      ]);
    });

    it('produces empty select when fields and crossCountFields are empty', () => {
      // Given / When / Then
      expect(queryV2ToV3(makeV2Query()).select).toEqual([]);
    });
  });

  describe('phenotypicClause', () => {
    it('is null when query has no filters', () => {
      // Given / When / Then
      expect(queryV2ToV3(makeV2Query()).phenotypicClause).toBeNull();
    });

    it('is a single PhenotypicFilter when exactly one filter is present', () => {
      // Given
      const query = makeV2Query({ categoryFilters: { '\\\\dataset\\\\sex\\\\': ['Male'] } });

      // When
      const { phenotypicClause } = queryV2ToV3(query);

      // Then
      expect(phenotypicClause?.type).toBe('PhenotypicFilter');
    });

    it('is a PhenotypicSubquery(AND) when multiple filters are present', () => {
      // Given
      const query = makeV2Query({
        categoryFilters: {
          '\\\\dataset\\\\sex\\\\': ['Male'],
          '\\\\dataset\\\\ancestry\\\\': ['EUR'],
        },
      });

      // When
      const { phenotypicClause } = queryV2ToV3(query);

      // Then
      expect(phenotypicClause?.type).toBe('PhenotypicSubquery');
      if (phenotypicClause?.type === 'PhenotypicSubquery') {
        expect(phenotypicClause.operator).toBe('AND');
        expect(phenotypicClause.phenotypicClauses).toHaveLength(2);
      }
    });

    it('maps categoryFilters entries to FILTER PhenotypicFilters with values', () => {
      // Given
      const query = makeV2Query({
        categoryFilters: { '\\\\dataset\\\\sex\\\\': ['Male', 'Female'] },
      });

      // When
      const { phenotypicClause } = queryV2ToV3(query);

      // Then
      expect(phenotypicClause).toMatchObject({
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\\\dataset\\\\sex\\\\',
        values: ['Male', 'Female'],
      });
    });

    it('maps numericFilters entries to FILTER PhenotypicFilters with numeric min/max', () => {
      // Given
      const query = makeV2Query({
        numericFilters: { '\\\\dataset\\\\age\\\\': { min: 18, max: 65 } },
      });

      // When
      const { phenotypicClause } = queryV2ToV3(query);

      // Then
      expect(phenotypicClause).toMatchObject({
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\\\dataset\\\\age\\\\',
        min: 18,
        max: 65,
      });
    });

    it('maps requiredFields entries to REQUIRED PhenotypicFilters', () => {
      // Given
      const query = makeV2Query({ requiredFields: ['\\\\dataset\\\\variable\\\\'] });

      // When
      const { phenotypicClause } = queryV2ToV3(query);

      // Then
      expect(phenotypicClause).toMatchObject({
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'REQUIRED',
        conceptPath: '\\\\dataset\\\\variable\\\\',
      });
    });

    it('maps anyRecordOf entries to ANY_RECORD_OF PhenotypicFilters', () => {
      // Given
      const query = makeV2Query({ anyRecordOf: ['\\\\dataset\\\\variable\\\\'] });

      // When
      const { phenotypicClause } = queryV2ToV3(query);

      // Then
      expect(phenotypicClause).toMatchObject({
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'ANY_RECORD_OF',
        conceptPath: '\\\\dataset\\\\variable\\\\',
      });
    });

    it('flattens anyRecordOfMulti entries into ANY_RECORD_OF PhenotypicFilters', () => {
      // Given
      const query = makeV2Query({
        anyRecordOfMulti: [['\\\\dataset\\\\a\\\\', '\\\\dataset\\\\b\\\\']],
      });

      // When
      const { phenotypicClause } = queryV2ToV3(query);

      // Then — two ANY_RECORD_OF filters, one per path
      expect(phenotypicClause?.type).toBe('PhenotypicSubquery');
      if (phenotypicClause?.type === 'PhenotypicSubquery') {
        expect(phenotypicClause.phenotypicClauses).toHaveLength(2);
        expect(
          phenotypicClause.phenotypicClauses.every(
            (c) => c.type === 'PhenotypicFilter' && c.phenotypicFilterType === 'ANY_RECORD_OF',
          ),
        ).toBe(true);
      }
    });
  });

  describe('genomicFilters', () => {
    it('is empty when variantInfoFilters is empty', () => {
      // Given / When / Then
      expect(queryV2ToV3(makeV2Query({ variantInfoFilters: [] })).genomicFilters).toHaveLength(0);
    });

    it('is empty when categoryVariantInfoFilters has no values', () => {
      // Given
      const query = makeV2Query({
        variantInfoFilters: [{ categoryVariantInfoFilters: {}, numericVariantInfoFilters: {} }],
      });

      // When / Then
      expect(queryV2ToV3(query).genomicFilters).toHaveLength(0);
    });

    it('maps Gene_with_variant to a genomicFilters entry', () => {
      // Given
      const query = makeV2Query({
        variantInfoFilters: [
          { categoryVariantInfoFilters: { Gene_with_variant: ['BRCA1', 'BRCA2'] } },
        ],
      });

      // When
      const { genomicFilters } = queryV2ToV3(query);

      // Then
      expect(genomicFilters).toHaveLength(1);
      expect(genomicFilters[0]).toEqual({ key: 'Gene_with_variant', values: ['BRCA1', 'BRCA2'] });
    });

    it('maps all three category variant fields to separate genomicFilters entries', () => {
      // Given
      const query = makeV2Query({
        variantInfoFilters: [
          {
            categoryVariantInfoFilters: {
              Gene_with_variant: ['BRCA1'],
              Variant_consequence_calculated: ['missense_variant'],
              Variant_frequency_as_text: ['Common'],
            },
          },
        ],
      });

      // When
      const { genomicFilters } = queryV2ToV3(query);

      // Then
      expect(genomicFilters).toHaveLength(3);
      expect(genomicFilters.find((g) => g.key === 'Gene_with_variant')?.values).toEqual(['BRCA1']);
      expect(
        genomicFilters.find((g) => g.key === 'Variant_consequence_calculated')?.values,
      ).toEqual(['missense_variant']);
      expect(genomicFilters.find((g) => g.key === 'Variant_frequency_as_text')?.values).toEqual([
        'Common',
      ]);
    });
  });

  it('passes through a single expectedResultType value', () => {
    // Given / When
    const result = queryV2ToV3(makeV2Query({ expectedResultType: 'DATAFRAME' }));

    // Then
    expect(result.expectedResultType).toBe('DATAFRAME');
  });

  it('takes the first element when expectedResultType is an array', () => {
    // Given / When
    const result = queryV2ToV3(makeV2Query({ expectedResultType: ['COUNT', 'DATAFRAME'] }));

    // Then
    expect(result.expectedResultType).toBe('COUNT');
  });
});

describe('genomicV3ToFilter', () => {
  it('maps Gene_with_variant values', () => {
    // Given / When
    const filter = genomicV3ToFilter([
      { key: 'Gene_with_variant', values: ['BRCA1', 'TP53'] },
    ]) as GenomicFilterInterface;

    // Then
    expect(filter.filterType).toBe('genomic');
    expect(filter.Gene_with_variant).toEqual(['BRCA1', 'TP53']);
    expect(filter.Variant_consequence_calculated).toBeUndefined();
  });

  it('maps Variant_consequence_calculated values', () => {
    // Given / When
    const filter = genomicV3ToFilter([
      { key: 'Variant_consequence_calculated', values: ['stop_gained', 'missense_variant'] },
    ]) as GenomicFilterInterface;

    // Then
    expect(filter.Variant_consequence_calculated).toEqual(['stop_gained', 'missense_variant']);
    expect(filter.Gene_with_variant).toBeUndefined();
  });

  it('maps Variant_frequency_as_text values', () => {
    // Given / WhenGenomicFilterInterface
    const filter = genomicV3ToFilter([
      { key: 'Variant_frequency_as_text', values: ['Rare'] },
    ]) as GenomicFilterInterface;

    // Then
    expect(filter.Variant_frequency_as_text).toEqual(['Rare']);
  });

  it('merges all keys from multiple entries into one filter', () => {
    // Given / When
    const filter = genomicV3ToFilter([
      { key: 'Gene_with_variant', values: ['BRCA1'] },
      { key: 'Variant_consequence_calculated', values: ['missense_variant'] },
      { key: 'Variant_frequency_as_text', values: ['Rare'] },
    ]) as GenomicFilterInterface;

    // Then
    expect(filter.filterType).toBe('genomic');
    expect(filter.Gene_with_variant).toEqual(['BRCA1']);
    expect(filter.Variant_consequence_calculated).toEqual(['missense_variant']);
    expect(filter.Variant_frequency_as_text).toEqual(['Rare']);
  });

  it('converts min and max to strings', () => {
    // Given / When
    const filter = genomicV3ToFilter([
      { key: 'Gene_with_variant', min: 0.001, max: 0.05 },
    ]) as GenomicFilterInterface;

    // Then
    expect(filter.min).toBe('0.001');
    expect(filter.max).toBe('0.05');
  });

  it('omits min/max when not present', () => {
    // Given / When
    const filter = genomicV3ToFilter([
      { key: 'Gene_with_variant', values: ['BRCA1'] },
    ]) as GenomicFilterInterface;

    // Then
    expect(filter.min).toBeUndefined();
    expect(filter.max).toBeUndefined();
  });

  it('does not crash on an unknown key', () => {
    // Given / When
    const filter = genomicV3ToFilter([
      { key: 'Unknown_key', values: ['x'] },
    ]) as GenomicFilterInterface;

    // Then
    expect(filter.filterType).toBe('genomic');
    expect(filter.Gene_with_variant).toBeUndefined();
  });
});

describe('pathToSearchResult', () => {
  beforeEach(() => {
    mockGetConceptDetails.mockResolvedValue(makeSearchResult());
  });

  it('extracts dataset from the first path segment', async () => {
    // Given
    const path = '\\\\open_access-1000Genomes\\\\SUPERPOPULATION NAME\\\\';
    mockGetConceptDetails.mockResolvedValueOnce(
      makeSearchResult({ dataset: 'open_access-1000Genomes' }),
    );

    // When
    const result = await pathToSearchResult(path);

    // Then
    expect(result.dataset).toBe('open_access-1000Genomes');
    expect(mockGetConceptDetails).toHaveBeenLastCalledWith(path, 'open_access-1000Genomes');
  });

  it('maps API response fields onto the SearchResult', async () => {
    // Given
    mockGetConceptDetails.mockResolvedValue(
      makeSearchResult({
        name: 'API Name',
        display: 'API Display',
        studyAcronym: 'ACR',
        description: 'API Desc',
        allowFiltering: true,
      }),
    );

    // When
    const result = await pathToSearchResult('\\\\dataset\\\\variable\\\\');

    // Then
    expect(result.name).toBe('API Name');
    expect(result.display).toBe('API Display');
    expect(result.studyAcronym).toBe('ACR');
    expect(result.description).toBe('API Desc');
    expect(result.allowFiltering).toBe(true);
  });

  it('passes the given type through to the result', async () => {
    // Given
    mockGetConceptDetails.mockResolvedValueOnce(makeSearchResult({ type: 'Continuous' }));

    // When
    const result = await pathToSearchResult('\\\\dataset\\\\variable\\\\', 'Continuous');

    // Then
    expect(result.type).toBe('Continuous');
  });

  it('defaults type to Categorical', async () => {
    // When
    const result = await pathToSearchResult('\\\\dataset\\\\variable\\\\');

    // Then
    expect(result.type).toBe('Categorical');
  });
});

describe('queryToFilterTree', () => {
  beforeEach(() => {
    mockGetConceptDetails.mockResolvedValue(makeSearchResult());
    mockGetConceptTree.mockResolvedValue(
      makeSearchResult({
        children: [
          makeSearchResult({ conceptPath: '\\\\dataset\\\\variable\\\\child1\\\\' }),
          makeSearchResult({ conceptPath: '\\\\dataset\\\\variable\\\\child2\\\\' }),
        ],
      }),
    );
  });

  it('returns an empty tree when phenotypicClause is null', async () => {
    // Given
    const query = makeV3Query({ phenotypicClause: null });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then
    expect(errors).toHaveLength(0);
    expect(tree.leafNodes).toHaveLength(0);
  });

  it('handles a single top-level PhenotypicFilter', async () => {
    // Given
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\\\dataset\\\\sex\\\\',
        not: false,
        values: ['Male'],
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then
    expect(errors).toHaveLength(0);
    expect(tree.leafNodes).toHaveLength(1);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'Categorical' });
  });

  it('flattens a top-level AND subquery into root children', async () => {
    // Given
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicSubquery',
        operator: 'AND',
        not: false,
        phenotypicClauses: [
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: '\\\\dataset\\\\apples\\\\',
            not: false,
            values: ['x'],
          },
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: '\\\\dataset\\\\banana\\\\',
            not: false,
            values: ['y'],
          },
        ],
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — both filters are direct children of root, no extra wrapping group
    expect(errors).toHaveLength(0);
    expect(tree.root.children).toHaveLength(2);
    expect(tree.leafNodes).toHaveLength(2);
  });

  it('OR root group is retained', async () => {
    // Given
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicSubquery',
        operator: 'OR',
        not: false,
        phenotypicClauses: [
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: '\\\\dataset\\\\apples\\\\',
            not: false,
            values: ['x'],
          },
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: '\\\\dataset\\\\banana\\\\',
            not: false,
            values: ['y'],
          },
        ],
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — root has one OR group child containing both filters
    expect(errors).toHaveLength(0);
    expect(tree.root.children).toHaveLength(2);
    expect((tree.root as FilterGroupInterface).operator).toBe('OR');
    expect(tree.leafNodes).toHaveLength(2);
  });

  it('creates a required filter for REQUIRED phenotypicFilterType', async () => {
    // Given
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'REQUIRED',
        conceptPath: '\\\\dataset\\\\variable\\\\',
        not: false,
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then
    expect(errors).toHaveLength(0);
    expect(tree.leafNodes).toHaveLength(1);
    // REQUIRED maps to a Categorical filter with displayType 'any'
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'Categorical', displayType: 'any' });
  });

  it('creates an AnyRecordOf filter using concept tree children', async () => {
    // Given — tree returns two children
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'ANY_RECORD_OF',
        conceptPath: '\\\\dataset\\\\variable\\\\',
        not: false,
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — concepts come from the tree children, not just the root path
    expect(errors).toHaveLength(0);
    expect(tree.leafNodes).toHaveLength(1);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'AnyRecordOf' });
    expect((tree.leafNodes[0] as AnyRecordOfFilterInterface).concepts).toEqual([
      '\\\\dataset\\\\variable\\\\child1\\\\',
      '\\\\dataset\\\\variable\\\\child2\\\\',
    ]);
  });

  it('calls getConceptTree with ENSURE_MAX_DEPTH and the concept path for ANY_RECORD_OF', async () => {
    // Given
    const conceptPath = '\\\\dataset\\\\variable\\\\';
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'ANY_RECORD_OF',
        conceptPath,
        not: false,
      },
    });

    // When
    await queryToFilterTree(query, []);

    // Then
    expect(mockGetConceptTree).toHaveBeenCalledWith('dataset', 100, conceptPath);
  });

  it('falls back to root path and records error when getConceptTree fails for ANY_RECORD_OF', async () => {
    // Given — concept details succeed but tree fetch fails
    mockGetConceptTree.mockRejectedValueOnce(new Error('tree API unavailable'));
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'ANY_RECORD_OF',
        conceptPath: '\\\\dataset\\\\variable\\\\',
        not: false,
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — filter is still created (degraded mode), error path is recorded
    expect(tree.leafNodes).toHaveLength(1);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'AnyRecordOf' });
    expect(errors).toContain('\\\\dataset\\\\variable\\\\');
  });

  it('records error and still creates AnyRecordOf filter when both detail and tree fetch fail', async () => {
    // Given — both API calls fail
    mockGetConceptDetails.mockRejectedValueOnce(new Error('detail API unavailable'));
    mockGetConceptTree.mockRejectedValueOnce(new Error('tree API unavailable'));
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'ANY_RECORD_OF',
        conceptPath: '\\\\dataset\\\\variable\\\\',
        not: false,
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — filter is still created (fully degraded), path appears in errors
    expect(tree.leafNodes).toHaveLength(1);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'AnyRecordOf' });
    expect(errors).toContain('\\\\dataset\\\\variable\\\\');
  });

  it('records the path and still creates a categorical filter when concept detail API fails', async () => {
    // Given
    const failingPath = '\\\\dataset\\\\sex\\\\';
    mockGetConceptDetails.mockRejectedValueOnce(new Error('detail API unavailable'));
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: failingPath,
        not: false,
        values: ['Male'],
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — filter still created with fallback, path in errors
    expect(errors).toEqual([failingPath]);
    expect(tree.leafNodes).toHaveLength(1);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'Categorical' });
  });

  it('records the path and still creates a required filter when concept detail API fails', async () => {
    // Given
    const failingPath = '\\\\dataset\\\\variable\\\\';
    mockGetConceptDetails.mockRejectedValueOnce(new Error('detail API unavailable'));
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'REQUIRED',
        conceptPath: failingPath,
        not: false,
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — required filter still created with fallback, path in errors
    expect(errors).toEqual([failingPath]);
    expect(tree.leafNodes).toHaveLength(1);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'Categorical', displayType: 'any' });
  });

  it('records the path and still creates a numeric filter when concept detail API fails', async () => {
    // Given
    const failingPath = '\\\\dataset\\\\age\\\\';
    mockGetConceptDetails.mockRejectedValueOnce(new Error('detail API unavailable'));
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: failingPath,
        not: false,
        min: 18,
        max: 65,
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — numeric filter still created with fallback, path in errors
    expect(errors).toEqual([failingPath]);
    expect(tree.leafNodes).toHaveLength(1);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'numeric', min: '18', max: '65' });
  });

  it('records errors for each failing filter in a multi-clause subquery', async () => {
    // Given — two filters, both fail concept detail lookup
    const path1 = '\\\\dataset\\\\sex\\\\';
    const path2 = '\\\\dataset\\\\age\\\\';
    mockGetConceptDetails
      .mockRejectedValueOnce(new Error('detail API unavailable'))
      .mockRejectedValueOnce(new Error('detail API unavailable'));
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicSubquery',
        operator: 'AND',
        not: false,
        phenotypicClauses: [
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: path1,
            not: false,
            values: ['Male'],
          },
          {
            type: 'PhenotypicFilter',
            phenotypicFilterType: 'FILTER',
            conceptPath: path2,
            not: false,
            min: 18,
          },
        ],
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then — both filters still created (degraded), both paths in errors
    expect(errors).toEqual(expect.arrayContaining([path1, path2]));
    expect(errors).toHaveLength(2);
    expect(tree.leafNodes).toHaveLength(2);
  });

  it('creates a numeric filter when min or max is set', async () => {
    // Given
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\\\dataset\\\\age\\\\',
        not: false,
        min: 18,
        max: 65,
      },
    });
    const errors: string[] = [];

    // When
    const tree = await queryToFilterTree(query, errors);

    // Then
    expect(errors).toHaveLength(0);
    expect(tree.leafNodes[0]).toMatchObject({ filterType: 'numeric', min: '18', max: '65' });
  });
});

describe('loadQuerySummaryData', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mockGetConceptDetails.mockImplementation((conceptPath: string, _dataset: string) =>
      Promise.resolve(makeSearchResult({ conceptPath })),
    );
  });

  it('V3: returns select paths as fields and maps genomicFilters', async () => {
    // Given
    const query = makeV3Query({
      select: ['\\\\dataset\\\\variable1\\\\', '\\\\dataset\\\\variable2\\\\'],
      genomicFilters: [{ key: 'Gene_with_variant', values: ['BRCA1'] }],
    });

    // When
    const data = await loadQuerySummaryData(query, QueryVersion.V3);
    const exports = data.exports.map(({ conceptPath }) => conceptPath);

    // Then
    expect(exports).toEqual(['\\\\dataset\\\\variable1\\\\', '\\\\dataset\\\\variable2\\\\']);
    expect(data.genomicFilters).toHaveLength(1);
    expect(data.genomicFilters[0].filterType).toBe('genomic');
    expect(data.filterTree.leafNodes).toHaveLength(0);
  });

  it('V3: builds filterTree from phenotypicClause', async () => {
    // Given
    const query = makeV3Query({
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\\\dataset\\\\sex\\\\',
        not: false,
        values: ['Male'],
      },
    });

    // When
    const data = await loadQuerySummaryData(query, QueryVersion.V3);

    // Then
    expect(data.filterTree.leafNodes).toHaveLength(1);
  });

  it('V2: builds filterTree from categoryFilters', async () => {
    // Given
    const query = makeV2Query({
      categoryFilters: { '\\\\dataset\\\\sex\\\\': ['Male'] },
      fields: ['\\\\dataset\\\\age\\\\'],
    });

    // When
    const data = await loadQuerySummaryData(query, QueryVersion.V2);

    // Then
    expect(data.filterTree.leafNodes).toHaveLength(1);
    expect(data.filterTree.leafNodes[0]).toMatchObject({ filterType: 'Categorical' });
  });

  it('V2: fields contains only fields and crossCountFields (not requiredFields or anyRecordOf)', async () => {
    // Given
    const query = makeV2Query({
      fields: ['\\\\dataset\\\\age\\\\'],
      crossCountFields: ['\\\\dataset\\\\sex\\\\'],
      requiredFields: ['\\\\dataset\\\\required\\\\'],
      anyRecordOf: ['\\\\dataset\\\\aro\\\\'],
    });

    // When
    const data = await loadQuerySummaryData(query, QueryVersion.V2);
    const exports = data.exports.map(({ conceptPath }) => conceptPath);

    // Then — requiredFields and anyRecordOf are now filter nodes, not field selections
    expect(exports).toEqual(['\\\\dataset\\\\age\\\\', '\\\\dataset\\\\sex\\\\']);
  });

  it('V2: requiredFields and anyRecordOf produce filter nodes in the filterTree', async () => {
    // Given
    const query = makeV2Query({
      requiredFields: ['\\\\dataset\\\\required\\\\'],
      anyRecordOf: ['\\\\dataset\\\\aro\\\\'],
    });
    mockGetConceptTree.mockResolvedValue(
      makeSearchResult({
        children: [makeSearchResult({ conceptPath: '\\\\dataset\\\\aro\\\\child\\\\' })],
      }),
    );

    // When
    const data = await loadQuerySummaryData(query, QueryVersion.V2);

    // Then
    expect(data.filterTree.leafNodes).toHaveLength(2);
    const types = data.filterTree.leafNodes.map((n) => n.filterType);
    expect(types).toContain('Categorical'); // required maps to Categorical displayType:'any'
    expect(types).toContain('AnyRecordOf');
  });

  it('V2: maps variantInfoFilters to genomicFilters', async () => {
    // Given
    const query = makeV2Query({
      variantInfoFilters: [
        {
          categoryVariantInfoFilters: { Gene_with_variant: ['BRCA1'] },
          numericVariantInfoFilters: {},
        },
      ],
    });

    // When
    const data = await loadQuerySummaryData(query, QueryVersion.V2);

    // Then
    expect(data.genomicFilters).toHaveLength(1);
    expect(data.genomicFilters[0].filterType).toBe('genomic');
  });

  it('V2: records errors from concept detail API failures', async () => {
    // Given
    const failingPath = '\\\\dataset\\\\sex\\\\';
    mockGetConceptDetails.mockRejectedValueOnce(new Error('detail API unavailable'));
    const query = makeV2Query({ categoryFilters: { [failingPath]: ['Male'] } });

    // When
    const data = await loadQuerySummaryData(query, QueryVersion.V2);

    // Then — filter still created (degraded), path recorded in errors
    expect(data.errors).toEqual([failingPath]);
    expect(data.filterTree.leafNodes).toHaveLength(1);
  });
});
