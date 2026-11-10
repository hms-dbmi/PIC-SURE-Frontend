// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import QuerySummary from '#lib/datasets/components/QuerySummary.svelte';
import { loadQuerySummaryData } from '#lib/query/restore.ts';
import { QueryVersion } from '#lib/datasets/dataset.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { QueryV3 } from '#lib/query/query.ts';
import type { QueryV2 } from '#lib/query/v2.ts';
import type { FilterInterface, FilterGroupInterface } from '#lib/query/filter.svelte.ts';

const mockBypassPath = 'some_path';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
const mockConfig = vi.hoisted(() => ({
  features: { restoreV2queries: false },
  settings: { dataset: { bypassConceptLookup: ['\\some_path\\'] } },
}));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: mockConfig }));

vi.mock('#lib/query/filters.ts', async () => {
  const { writable } = await import('svelte/store');
  const { createFilterGroup } = await import('#lib/query/filter.svelte.ts');
  return {
    allFilters: writable([]),
    genomicFilters: writable([]),
    setFilterTree: vi.fn(),
    createGroup: createFilterGroup,
  };
});

const mockConceptPath = vi.hoisted(() => vi.fn());
vi.mock('#lib/explorer/Dictionary.ts', async () => {
  return {
    getConceptDetails: mockConceptPath,
  };
});

vi.mock('#lib/explorer/export/Export.ts', async () => {
  const { writable } = await import('svelte/store');
  return {
    exports: writable([]),
    mapSearchResultAsExport: vi.fn((searchResult) => ({ conceptPath: searchResult?.conceptPath })),
  };
});

vi.mock('#lib/query/restore.ts', () => ({
  loadQuerySummaryData: vi.fn(),
  pathToSearchResult: vi.fn(),
  estimateV3: vi.fn().mockReturnValue({ filters: 3, exports: 3 }),
}));

const mockLoadQuerySummaryData = vi.mocked(loadQuerySummaryData);

// Minimal filterTree shape that satisfies FiltersSummary's property accesses
function makeFilterTree() {
  return {
    length: 0,
    leafNodes: [],
    root: {
      filterType: 'FilterGroup',
      displayType: 'group',
      variableName: 'none',
      dataset: '',
      allowFiltering: true,
      children: [] as FilterInterface[],
      operator: 'AND',
    } as FilterGroupInterface,
  } as unknown as LogicTree<FilterInterface>;
}

const baseData = {
  filterTree: Promise.resolve(makeFilterTree()),
  genomicFilters: Promise.resolve([]),
  exports: Promise.resolve([]),
  errors: Promise.resolve([]),
};

const baseProps = { query: new QueryV3(), version: QueryVersion.V3 };
const queryV2: QueryV2 = {
  fields: [],
  categoryFilters: {},
  numericFilters: {},
  requiredFields: [],
  anyRecordOf: [],
  anyRecordOfMulti: [],
  crossCountFields: [],
  variantInfoFilters: [],
  expectedResultType: 'COUNT',
};

describe('QuerySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.features.restoreV2queries = false;
  });

  it('shows the enabled Restore Filters button when there are no errors', async () => {
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, baseProps);

    // Wait for the {#await} block to resolve
    await screen.findByTestId('dataset-filters-container');

    expect(screen.getByTestId('dataset-restore-filters-trigger')).toBeEnabled();
    expect(screen.queryByTestId('ui-error-alert')).not.toBeInTheDocument();
  });

  it('passes a V3 summary through to loadQuerySummaryData without filtering system fields', async () => {
    const query = new QueryV3({
      select: ['\\dataset\\age\\', '\\_consents\\'],
      authorizationFilters: [],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType: 'COUNT',
      picsureId: null,
      id: null,
    });
    mockLoadQuerySummaryData.mockReturnValue(baseData);

    render(QuerySummary, { query, version: QueryVersion.V3 });
    await screen.findByTestId('dataset-filters-container');

    expect(mockLoadQuerySummaryData).toHaveBeenCalledWith(
      expect.objectContaining({ select: ['\\dataset\\age\\', '\\_consents\\'] }),
    );
    expect(query.select).toEqual(['\\dataset\\age\\', '\\_consents\\']);
  });

  it('passes a V3 summary through to loadQuerySummaryData not reaching out to bypassed fields', async () => {
    const select = ['\\dataset\\age\\', '\\_consents\\', `\\${mockBypassPath}\\`];
    const query = new QueryV3({
      select,
      authorizationFilters: [],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType: 'COUNT',
      picsureId: null,
      id: null,
    });
    const actual =
      await vi.importActual<typeof import('#lib/query/restore.ts')>('#lib/query/restore.ts');
    mockLoadQuerySummaryData.mockImplementation(actual.loadQuerySummaryData);

    render(QuerySummary, { query, version: QueryVersion.V3 });
    await screen.findByTestId('dataset-filters-container');

    expect(mockConceptPath).toHaveBeenCalledWith(select[0], 'dataset');
    expect(mockConceptPath).toHaveBeenCalledWith(select[1], '_consents');
    expect(mockConceptPath).not.toHaveBeenCalledWith(select[2], mockBypassPath);
  });

  it('disables the Restore Filters button and shows an error alert when data.errors is non-empty', async () => {
    mockLoadQuerySummaryData.mockReturnValue({
      ...baseData,
      errors: Promise.resolve(['\\phs001\\']),
    });
    render(QuerySummary, baseProps);

    await screen.findByTestId('dataset-filters-container');

    // Dialog trigger is replaced by the disabled Popover button
    expect(screen.queryByTestId('dataset-restore-filters-trigger')).not.toBeInTheDocument();
    expect(screen.getByTestId('dataset-restore-popover-trigger')).toBeDisabled();
    expect(screen.getByTestId('ui-error-alert')).toBeInTheDocument();
    expect(screen.getByTestId('ui-error-alert')).toHaveTextContent('\\phs001\\');
  });

  it('keeps restoring a saved V2 query disabled when the compatibility flag is off', async () => {
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.queryByTestId('dataset-restore-filters-trigger')).not.toBeInTheDocument();
    expect(screen.getByTestId('dataset-restore-popover-trigger')).toBeDisabled();
  });

  it('enables restoring a saved V2 query when the compatibility flag is on', async () => {
    mockConfig.features.restoreV2queries = true;
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.getByTestId('dataset-restore-filters-trigger')).toBeEnabled();
  });

  it('hides the Restore Filters button for V2 queries when restoreV2queries is false', async () => {
    mockConfig.features.restoreV2queries = false;
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.queryByTestId('dataset-restore-filters-trigger')).not.toBeInTheDocument();
    const popover = screen.getByTestId('dataset-restore-popover-trigger');
    expect(popover).toBeDisabled();
    expect(popover).toHaveTextContent('Restore Filters');
  });

  it('shows the enabled Restore Filters button for V2 queries when restoreV2queries is true', async () => {
    mockConfig.features.restoreV2queries = true;
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.getByTestId('dataset-restore-filters-trigger')).toBeEnabled();
    expect(screen.queryByTestId('dataset-restore-popover-trigger')).not.toBeInTheDocument();
  });
});
