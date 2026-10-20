import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushSync } from 'svelte';

const mockSession = vi.hoisted(() => ({
  user: {} as { consents?: Record<string, string[]> },
  ensureConsentsLoaded: vi.fn(),
}));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/auth/session.svelte.ts', () => ({ session: mockSession }));
vi.mock('#lib/explorer/Dictionary.ts', () => ({ getConceptDetails: vi.fn() }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
  registerAssociatedStudies: vi.fn(),
}));

import { FilterState } from '#lib/query/filters.svelte.ts';
import { buildRequest } from '#lib/query/build.ts';
import { getConceptDetails } from '#lib/explorer/Dictionary.ts';
import {
  createCategoricalFilter,
  createFilterGroup,
  createGenomicFilter,
  createNumericFilter,
  isFilterGroup,
  type FilterInterface,
} from '#lib/query/filter.svelte.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { createQuery, type PhenotypicFilter } from '#lib/query/query.ts';
import { queryToFilterTree } from '#lib/query/restore.ts';
// sessionStorage as the code before FilterState wrote it, and the request it sent for it.
import savedSession from '#lib/query/filters.fixture.json';

function mockSearchResult(conceptPath: string, dataset = 'test-dataset'): SearchResult {
  return {
    conceptPath,
    name: conceptPath.split('\\').pop() || conceptPath,
    display: conceptPath.split('\\').pop() || conceptPath,
    type: 'Categorical',
    description: '',
    allowFiltering: true,
    dataset,
    studyAcronym: 'TEST',
    children: [],
  } as SearchResult;
}

const withoutUuid = (filters: { uuid?: string }[]) =>
  filters.map((filter) => {
    const copy = { ...filter };
    delete copy.uuid;
    return copy;
  });

let filters: FilterState;

beforeEach(() => {
  sessionStorage.clear();
  mockSession.user = {};
  mockSession.ensureConsentsLoaded.mockReset();
  filters = new FilterState();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.error).mockRestore();
});

describe('restoring a saved session', () => {
  beforeEach(() => {
    sessionStorage.setItem('filterTree', savedSession.filterTree);
    sessionStorage.setItem('genomicFilters', savedSession.genomicFilters);
    filters = new FilterState();
  });

  it('rebuilds the tree and genomic filters from sessionStorage', () => {
    const [sex, orGroup] = filters.tree.root.children;
    expect(sex.id).toBe('\\phs1\\sex\\');
    expect(isFilterGroup(orGroup) && orGroup.operator).toBe('OR');
    expect(filters.phenotypic.map((f) => f.id)).toEqual([
      '\\phs1\\sex\\',
      '\\phs1\\age\\',
      '\\phs2\\smoker\\',
    ]);
    expect(filters.genomic.map((f) => f.filterType)).toEqual(['genomic', 'snp']);
    expect(filters.associatedStudies).toEqual(['phs1', 'phs2']);
  });

  it('sends the same request bytes as before', () => {
    expect(JSON.stringify(buildRequest(filters.queryFilters))).toBe(savedSession.request);
  });

  it('writes the keys back in the same shape', () => {
    filters.setTree(filters.tree);

    expect(sessionStorage.getItem('filterTree')).toBe(savedSession.filterTree);
    // Genomic uuids are content hashes in a per-page-load namespace, recomputed on restore.
    expect(withoutUuid(JSON.parse(sessionStorage.getItem('genomicFilters')!))).toEqual(
      withoutUuid(JSON.parse(savedSession.genomicFilters)),
    );
  });

  it('keeps restored filters removable and editable', () => {
    const age = filters.phenotypic[1];
    filters.remove(age.uuid);
    expect(filters.phenotypic.map((f) => f.id)).toEqual(['\\phs1\\sex\\', '\\phs2\\smoker\\']);

    const edited = createCategoricalFilter(mockSearchResult('\\phs1\\sex\\', 'phs1'), ['Male']);
    filters.update(filters.phenotypic[0].uuid, edited);
    expect(filters.phenotypic[0]).toMatchObject({ categoryValues: ['Male'] });
  });
});

describe('restoring a saved dataset', () => {
  it('keeps its top-level filters removable', async () => {
    const lookup = {
      getConceptDetails: async (conceptPath: string) => mockSearchResult(conceptPath, 'phs1'),
      getConceptTree: async (_dataset: string, conceptPath: string) =>
        mockSearchResult(conceptPath, 'phs1'),
      bypassConceptLookup: [],
    };
    const leaf = (conceptPath: string): PhenotypicFilter => ({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'FILTER',
      conceptPath,
      values: ['x'],
      not: false,
    });
    const query = createQuery({
      phenotypicClause: {
        type: 'PhenotypicSubquery',
        operator: 'AND',
        phenotypicClauses: [leaf('\\phs1\\sex\\'), leaf('\\phs1\\smoker\\')],
        not: false,
      },
    });
    filters.restore(await queryToFilterTree(lookup, query, []), []);

    filters.remove(filters.phenotypic[0].uuid);

    expect(filters.phenotypic.map((f) => f.id)).toEqual(['\\phs1\\smoker\\']);
  });
});

describe('persistence and reactivity', () => {
  it('saves both keys on every change', () => {
    const filter = createNumericFilter(mockSearchResult('\\demo\\age\\'), '1', '2');
    filters.add(filter);
    filters.add(createGenomicFilter({ Gene_with_variant: ['BRCA1'] }));

    const restored = new FilterState();
    expect(restored.phenotypic.map((f) => f.uuid)).toEqual([filter.uuid]);
    expect(restored.genomic).toHaveLength(1);

    filters.clear();
    expect(new FilterState().all).toHaveLength(0);
  });

  it('updates derived values as filters change', () => {
    const counts: number[] = [];
    const stop = $effect.root(() => {
      $effect(() => {
        counts.push(filters.all.length);
      });
    });
    flushSync();

    filters.add(createCategoricalFilter(mockSearchResult('\\a\\'), ['x']));
    flushSync();
    filters.add(createGenomicFilter({ Gene_with_variant: ['BRCA1'] }));
    flushSync();
    filters.clear();
    flushSync();
    stop();

    expect(counts).toEqual([0, 1, 2, 0]);
  });

  it('hands out query filters free of $state proxies', () => {
    filters.add(createCategoricalFilter(mockSearchResult('\\a\\'), ['x']));
    filters.add(createGenomicFilter({ Gene_with_variant: ['BRCA1'] }));

    expect(() => structuredClone(filters.queryFilters)).not.toThrow();
  });

  it('replaces the tree on setTree', () => {
    const tree = new LogicTree<FilterInterface>(createFilterGroup);
    tree.add(createCategoricalFilter(mockSearchResult('\\a\\'), ['x']));
    tree.add(createCategoricalFilter(mockSearchResult('\\b\\'), ['y']));

    filters.setTree(tree);

    expect(filters.phenotypic.map((f) => f.id)).toEqual(['\\a\\', '\\b\\']);
    expect(new FilterState().phenotypic.map((f) => f.id)).toEqual(['\\a\\', '\\b\\']);
  });
});

describe('consent-based filter access', () => {
  it('marks a Discover filter invalid using endpoint consents when query scopes are absent', () => {
    mockSession.user = { consents: { '\\_consents\\': ['authorized-dataset'] } };
    filters.add(createCategoricalFilter(mockSearchResult('\\demo\\denied\\'), ['value']));

    expect(filters.hasInvalidFilter).toBe(true);
  });

  it('removes only filters missing from the endpoint consent list', async () => {
    mockSession.user = { consents: { '\\_consents\\': ['authorized-dataset'] } };
    filters.add(
      createCategoricalFilter(mockSearchResult('\\demo\\authorized\\', 'authorized-dataset'), [
        'value',
      ]),
    );
    filters.add(
      createCategoricalFilter(mockSearchResult('\\demo\\denied\\', 'denied-dataset'), ['value']),
    );

    mockSession.ensureConsentsLoaded.mockResolvedValue({
      '\\_consents\\': ['authorized-dataset'],
    });
    await filters.removeInvalid();

    expect(filters.phenotypic.map((filter) => filter.dataset)).toEqual(['authorized-dataset']);
  });

  it('detects and removes a standalone genomic filter without consent', async () => {
    mockSession.user = { consents: { '\\_consents\\': ['authorized-dataset'] } };
    filters.add(createGenomicFilter({ Gene_with_variant: ['BRCA1'] }));

    expect(filters.phenotypic).toHaveLength(0);
    expect(filters.genomic).toHaveLength(1);
    expect(filters.hasInvalidFilter).toBe(true);

    mockSession.ensureConsentsLoaded.mockResolvedValue({
      '\\_consents\\': ['authorized-dataset'],
    });
    await filters.removeInvalid();

    expect(filters.genomic).toHaveLength(0);
  });

  it('loads missing consents before removing invalid filters', async () => {
    mockSession.ensureConsentsLoaded.mockResolvedValue({
      '\\_consents\\': ['authorized-dataset'],
    });
    filters.add(createCategoricalFilter(mockSearchResult('\\demo\\denied\\'), ['value']));

    expect(filters.hasInvalidFilter).toBe(false);
    await filters.removeInvalid();

    expect(mockSession.ensureConsentsLoaded).toHaveBeenCalledOnce();
    expect(filters.phenotypic).toHaveLength(0);
  });
});

describe('adding, updating and removing', () => {
  it('allows duplicate phenotypic filters on the same concept, with unique uuids', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value1']);

    filters.add(filter1);
    filters.add(filter2);

    expect(filters.phenotypic).toHaveLength(2);
    expect(filter1.uuid).not.toBe(filter2.uuid);
  });

  it('removing one duplicate does not remove the other', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value2']);
    filters.add(filter1);
    filters.add(filter2);

    filters.remove(filter1.uuid);

    expect(filters.phenotypic.map((f) => f.uuid)).toEqual([filter2.uuid]);
  });

  it('removes a filter from inside a group and prunes the group', () => {
    const [a, b, c] = ['\\a\\', '\\b\\', '\\c\\'].map((path) =>
      createCategoricalFilter(mockSearchResult(path), ['x']),
    );
    [a, b, c].forEach((filter) => filters.add(filter));
    filters.tree.toggleOperator(filters.tree.root.children[1], filters.tree.root.children[2]);

    filters.remove(c.uuid);

    expect(filters.tree.root.children.map((node) => node.uuid)).toEqual([a.uuid, b.uuid]);
  });

  it('update replaces a filter in place and preserves uuid and position', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value2']);
    filters.add(filter1);
    filters.add(filter2);

    filters.update(filter1.uuid, createCategoricalFilter(search, ['value1', 'extra']));

    const leaves = filters.phenotypic;
    expect(leaves.map((f) => f.uuid)).toEqual([filter1.uuid, filter2.uuid]);
    expect(leaves[0]).toMatchObject({ categoryValues: ['value1', 'extra'] });
  });

  it('update is a no-op when the uuid does not exist', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    filters.add(filter1);

    filters.update('nonexistent-uuid', createCategoricalFilter(search, ['value2']));

    expect(filters.phenotypic.map((f) => f.uuid)).toEqual([filter1.uuid]);
  });

  it('keeps one genomic filter per id, replacing the old one', () => {
    filters.add(createGenomicFilter({ Gene_with_variant: ['BRCA1'] }));
    filters.add(createGenomicFilter({ Gene_with_variant: ['TP53'] }));

    expect(filters.genomic).toHaveLength(1);
    expect(filters.genomic[0]).toMatchObject({ Gene_with_variant: ['TP53'] });
    expect(filters.hasGenomicFilter).toBe(true);
  });

  it('removes unallowed filters from both lists', () => {
    const allowed = createCategoricalFilter(mockSearchResult('\\a\\'), ['x']);
    const unallowed = createCategoricalFilter(
      { ...mockSearchResult('\\b\\'), allowFiltering: false },
      ['y'],
    );
    filters.add(allowed);
    filters.add(unallowed);
    expect(filters.hasUnallowedFilter).toBe(true);

    filters.removeUnallowed();

    expect(filters.phenotypic.map((f) => f.uuid)).toEqual([allowed.uuid]);
    expect(filters.hasUnallowedFilter).toBe(false);
  });
});

describe('enrich', () => {
  beforeEach(() => {
    vi.mocked(getConceptDetails).mockReset();
  });

  it('patches table and study onto the stored filter and saves them', async () => {
    const search = mockSearchResult('\\demo\\numeric\\enrich\\');
    const filter = createNumericFilter(search, '0', '10');
    filters.add(filter);

    const table = { display: 'Dataset Display' } as SearchResult;
    const study = { display: 'Study Display' } as SearchResult;
    vi.mocked(getConceptDetails).mockResolvedValue({ ...search, table, study } as SearchResult);

    filters.enrich(filter, search.conceptPath, search.dataset);

    await vi.waitFor(() =>
      expect(filters.phenotypic[0].searchResult?.table).toEqual({ display: 'Dataset Display' }),
    );
    expect(filters.phenotypic[0].searchResult?.study).toEqual({ display: 'Study Display' });
    expect(new FilterState().phenotypic[0].searchResult?.table).toEqual(table);
    expect(getConceptDetails).toHaveBeenCalledWith(search.conceptPath, search.dataset);
  });

  it('leaves the filter unchanged when the detail fetch fails', async () => {
    const search = mockSearchResult('\\demo\\numeric\\fail\\');
    const filter = createNumericFilter(search, '0', '10');
    filters.add(filter);
    vi.mocked(getConceptDetails).mockRejectedValue(new Error('boom'));

    filters.enrich(filter, search.conceptPath, search.dataset);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(filters.phenotypic[0].searchResult?.table).toBeUndefined();
  });

  it('does not fetch when conceptPath or dataset is missing', () => {
    const search = mockSearchResult('\\demo\\numeric\\guard\\');
    const filter = createNumericFilter(search, '0', '10');

    filters.enrich(filter, '', search.dataset);

    expect(getConceptDetails).not.toHaveBeenCalled();
  });

  it('does not fetch when the filter is already enriched with table details', () => {
    const enriched = { ...mockSearchResult('\\demo\\numeric\\enriched\\') };
    enriched.table = { display: 'Existing Dataset' } as SearchResult;
    const filter = createNumericFilter(enriched, '0', '10');

    filters.enrich(filter, enriched.conceptPath, enriched.dataset);

    expect(getConceptDetails).not.toHaveBeenCalled();
  });
});
