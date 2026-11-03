import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/env', () => ({ browser: false }));
vi.mock('#lib/utils/ssrWrite.ts', () => ({ assertNoSsrWrite: vi.fn() }));
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { user: {}, ensureConsentsLoaded: vi.fn(), onAccessDenied: vi.fn() },
}));
vi.mock('#lib/explorer/Dictionary.ts', () => ({ getConceptDetails: vi.fn() }));

import { filterState } from '#lib/query/filters.svelte.ts';
import {
  createFilterGroup as createGroup,
  createAnyRecordOfFilter,
  createCategoricalFilter,
  createGenomicFilter,
  createNumericFilter,
  createRequiredFilter,
  createSnpsFilter,
  type Filter,
  type FilterInterface,
} from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { Operator, queryLeaves } from '#lib/query/query.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';
import { buildRequest, filterConcepts } from '#lib/query/build.ts';

function searchResult(conceptPath: string, children: SearchResult[] = []): SearchResult {
  return {
    conceptPath,
    dataset: 'phs000001',
    name: conceptPath,
    display: conceptPath,
    description: null,
    allowFiltering: true,
    children,
  } as unknown as SearchResult;
}

// The only place that knows where the filters live; the expectations below are the
// request JSON the backend receives.
function setFilters(nodes: FilterInterface[], genomic: Filter[] = []) {
  const tree = new LogicTree<FilterInterface>(createGroup);
  tree.add(...nodes);
  filterState.restore(tree, genomic);
}

function requestFor(nodes: FilterInterface[], genomic: Filter[] = []) {
  setFilters(nodes, genomic);
  return buildRequest(filterState.queryFilters);
}

// Every phenotypic tree is wrapped in the root AND group, even a single filter.
const rootOf = (...phenotypicClauses: object[]) => ({
  operator: 'AND',
  phenotypicClauses,
  not: false,
});

beforeEach(() => setFilters([]));

describe('QueryBuilder request JSON', () => {
  it('sends an empty COUNT query when there are no filters', () => {
    expect(buildRequest(filterState.queryFilters)).toEqual({
      query: {
        select: [],
        authorizationFilters: [],
        phenotypicClause: null,
        genomicFilters: [],
        expectedResultType: 'COUNT',
        picsureId: null,
        id: null,
      },
    });
  });

  // Serialisation strips every `type` key, so clauses carry no PhenotypicFilter/Subquery tag.
  it.each([
    {
      name: 'categorical with values',
      filter: () => createCategoricalFilter(searchResult('\\a\\'), ['x', 'y']),
      clause: {
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\a\\',
        not: false,
        values: ['x', 'y'],
      },
    },
    {
      name: 'categorical without values becomes REQUIRED',
      filter: () => createCategoricalFilter(searchResult('\\a\\'), []),
      clause: { phenotypicFilterType: 'REQUIRED', conceptPath: '\\a\\', not: false },
    },
    {
      name: 'required (a Categorical filter with no values)',
      filter: () => createRequiredFilter(searchResult('\\a\\')),
      clause: { phenotypicFilterType: 'REQUIRED', conceptPath: '\\a\\', not: false },
    },
    {
      name: "filterType 'required'",
      filter: () => ({
        ...createRequiredFilter(searchResult('\\a\\')),
        filterType: 'required' as const,
      }),
      clause: { phenotypicFilterType: 'REQUIRED', conceptPath: '\\a\\', not: false },
    },
    {
      name: 'numeric between, with grouping separators',
      filter: () => createNumericFilter(searchResult('\\n\\'), '1,000', '2 500.5'),
      clause: {
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\n\\',
        not: false,
        min: 1000,
        max: 2500.5,
      },
    },
    {
      name: 'numeric min only',
      filter: () => createNumericFilter(searchResult('\\n\\'), '-3'),
      clause: { phenotypicFilterType: 'FILTER', conceptPath: '\\n\\', not: false, min: -3 },
    },
    {
      name: 'numeric max only',
      filter: () => createNumericFilter(searchResult('\\n\\'), undefined, '0'),
      clause: { phenotypicFilterType: 'FILTER', conceptPath: '\\n\\', not: false, max: 0 },
    },
    {
      name: 'numeric with no bounds becomes REQUIRED',
      filter: () => createNumericFilter(searchResult('\\n\\')),
      clause: { phenotypicFilterType: 'REQUIRED', conceptPath: '\\n\\', not: false },
    },
    {
      // Quirk: an unparseable or empty bound is dropped, leaving an unbounded FILTER.
      name: 'numeric with unparseable bounds stays an unbounded FILTER',
      filter: () => createNumericFilter(searchResult('\\n\\'), 'abc', ''),
      clause: { phenotypicFilterType: 'FILTER', conceptPath: '\\n\\', not: false },
    },
    {
      // The expanded concept list is not sent; only the parent concept path is.
      name: 'any record of',
      filter: () =>
        createAnyRecordOfFilter(
          searchResult('\\p\\'),
          searchResult('\\p\\', [searchResult('\\p\\c1\\'), searchResult('\\p\\c2\\')]),
        ),
      clause: { phenotypicFilterType: 'ANY_RECORD_OF', conceptPath: '\\p\\', not: false },
    },
  ])('$name', ({ filter, clause }) => {
    expect(requestFor([filter()]).query.phenotypicClause).toEqual(rootOf(clause));
  });

  it('keeps AND/OR groups and their order', () => {
    const a = createCategoricalFilter(searchResult('\\a\\'), ['1']);
    const b = createNumericFilter(searchResult('\\b\\'), '1');
    const c = createRequiredFilter(searchResult('\\c\\'));
    const d = createCategoricalFilter(searchResult('\\d\\'), ['2']);

    const request = requestFor([
      a,
      createGroup([b, createGroup([c, d], Operator.AND)], Operator.OR),
    ]);

    expect(request.query.phenotypicClause).toEqual(
      rootOf(
        { phenotypicFilterType: 'FILTER', conceptPath: '\\a\\', not: false, values: ['1'] },
        {
          operator: 'OR',
          not: false,
          phenotypicClauses: [
            { phenotypicFilterType: 'FILTER', conceptPath: '\\b\\', not: false, min: 1 },
            {
              operator: 'AND',
              not: false,
              phenotypicClauses: [
                { phenotypicFilterType: 'REQUIRED', conceptPath: '\\c\\', not: false },
                { phenotypicFilterType: 'FILTER', conceptPath: '\\d\\', not: false, values: ['2'] },
              ],
            },
          ],
        },
      ),
    );
  });

  it.each([
    {
      name: 'gene filter values, in key order',
      filters: () => [
        createGenomicFilter({
          Variant_frequency_as_text: ['Rare'],
          Gene_with_variant: ['BRCA1', 'TP53'],
          Variant_consequence_calculated: ['HIGH'],
        }),
      ],
      genomic: [
        { key: 'Gene_with_variant', values: ['BRCA1', 'TP53'] },
        { key: 'Variant_consequence_calculated', values: ['HIGH'] },
        { key: 'Variant_frequency_as_text', values: ['Rare'] },
      ],
    },
    {
      name: 'gene range only',
      filters: () => [createGenomicFilter({ min: '0.1', max: '1,000' })],
      genomic: [{ key: 'genomic_range', min: 0.1, max: 1000 }],
    },
    {
      name: 'gene range with an empty min',
      filters: () => [createGenomicFilter({ min: '', max: '5' })],
      genomic: [{ key: 'genomic_range', max: 5 }],
    },
    {
      // Quirk: the range is dropped when any categorical value is present.
      name: 'gene range is ignored next to categorical values',
      filters: () => [createGenomicFilter({ Gene_with_variant: ['BRCA1'], min: '1', max: '2' })],
      genomic: [{ key: 'Gene_with_variant', values: ['BRCA1'] }],
    },
    {
      name: 'gene filter with nothing set',
      filters: () => [createGenomicFilter({})],
      genomic: [],
    },
    {
      name: 'SNP constraints split on commas, one entry per SNP',
      filters: () => [
        createSnpsFilter([
          { search: 'chr1,100,A,T', constraint: '0/1,1/1' },
          { search: 'chr2,200,G,C', constraint: '1/1' },
        ]),
      ],
      genomic: [
        { key: 'chr1,100,A,T', values: ['0/1', '1/1'] },
        { key: 'chr2,200,G,C', values: ['1/1'] },
      ],
    },
    {
      name: 'gene then SNP filters, in store order',
      filters: () => [
        createGenomicFilter({ Gene_with_variant: ['BRCA1'] }),
        createSnpsFilter([{ search: 'chr1,100,A,T', constraint: '0/1' }]),
      ],
      genomic: [
        { key: 'Gene_with_variant', values: ['BRCA1'] },
        { key: 'chr1,100,A,T', values: ['0/1'] },
      ],
    },
  ])('genomic: $name', ({ filters, genomic }) => {
    const request = requestFor([], filters());
    expect(request.query.phenotypicClause).toBeNull();
    expect(request.query.genomicFilters).toEqual(genomic);
  });

  // toEqual ignores key order; this pins the bytes the backend receives.
  it('sends the request keys in a fixed order', () => {
    const request = requestFor(
      [
        createGroup(
          [
            createNumericFilter(searchResult('\\n\\'), '1', '2'),
            createCategoricalFilter(searchResult('\\a\\'), ['x']),
          ],
          Operator.OR,
        ),
      ],
      [createGenomicFilter({ min: '1', max: '2' })],
    );

    expect(JSON.stringify(request)).toBe(
      JSON.stringify({
        query: {
          select: [],
          authorizationFilters: [],
          phenotypicClause: {
            operator: 'AND',
            phenotypicClauses: [
              {
                operator: 'OR',
                phenotypicClauses: [
                  {
                    phenotypicFilterType: 'FILTER',
                    conceptPath: '\\n\\',
                    not: false,
                    min: 1,
                    max: 2,
                  },
                  {
                    phenotypicFilterType: 'FILTER',
                    conceptPath: '\\a\\',
                    not: false,
                    values: ['x'],
                  },
                ],
                not: false,
              },
            ],
            not: false,
          },
          genomicFilters: [{ key: 'genomic_range', min: 1, max: 2 }],
          expectedResultType: 'COUNT',
          picsureId: null,
          id: null,
        },
      }),
    );
  });

  it('applies the result type and mutator after the filters are added', () => {
    const request = requestFor(
      [createRequiredFilter(searchResult('\\a\\'))],
      [createGenomicFilter({ Gene_with_variant: ['BRCA1'] })],
    );
    const mutated = buildRequest(filterState.queryFilters, 'CROSS_COUNT', (query) => {
      query.select = queryLeaves(query).map((leaf) => leaf.conceptPath);
      return query;
    });

    expect(mutated.query).toEqual({
      ...request.query,
      select: ['\\a\\'],
      expectedResultType: 'CROSS_COUNT',
    });
  });

  it('builds a blank query that ignores the filter stores', () => {
    setFilters(
      [createRequiredFilter(searchResult('\\a\\'))],
      [createGenomicFilter({ Gene_with_variant: ['BRCA1'] })],
    );

    const request = buildRequest(null, 'DATAFRAME', (query) => {
      query.select = ['\\s\\'];
      return query;
    });

    expect(request.query).toMatchObject({
      select: ['\\s\\'],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType: 'DATAFRAME',
    });
  });

  it('lists filter concepts, expanding any-record-of filters from the filter store', () => {
    const anyRecord = createAnyRecordOfFilter(
      searchResult('\\p\\'),
      searchResult('\\p\\', [searchResult('\\p\\c1\\', [searchResult('\\p\\c1\\g\\')])]),
    );
    setFilters([
      createRequiredFilter(searchResult('\\a\\')),
      createGroup([anyRecord, createNumericFilter(searchResult('\\b\\'), '1')], Operator.OR),
    ]);

    // filterConcepts needs the unserialised query, so it runs in the mutator, as in the export step.
    const request = buildRequest(filterState.queryFilters, 'DATAFRAME', (query) => {
      query.select = filterConcepts(query, filterState.phenotypic);
      return query;
    });
    expect(request.query.select).toEqual(['\\a\\', '\\p\\c1\\', '\\p\\c1\\g\\', '\\b\\']);
  });
});
