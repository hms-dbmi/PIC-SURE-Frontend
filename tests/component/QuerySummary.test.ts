// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import QuerySummary from '$lib/components/query/QuerySummary.svelte';
import { loadQuerySummaryData } from '$lib/components/query/QueryConverters';
import { QueryVersion } from '$lib/models/Dataset';
import { LogicTree } from '$lib/models/LogicTree.svelte';
import { QueryV3 } from '$lib/models/query/Query';
import type { QueryV2 } from '$lib/compat/QueryV2';
import type { FilterInterface, FilterGroupInterface } from '$lib/models/Filter.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
const mockConfig = vi.hoisted(() => ({
  features: { restoreV2queries: false },
}));
vi.mock('$lib/configuration.svelte', () => ({ config: mockConfig }));

vi.mock('$lib/stores/Filter', async () => {
  const { writable } = await import('svelte/store');
  return {
    allFilters: writable([]),
    genomicFilters: writable([]),
    setFilterTree: vi.fn(),
  };
});

vi.mock('$lib/stores/Export', async () => {
  const { writable } = await import('svelte/store');
  return {
    exports: writable([]),
    mapSearchResultAsExport: vi.fn().mockReturnValue({}),
  };
});

vi.mock('$lib/components/query/QueryConverters', () => ({
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

    expect(screen.getByTestId('restore-filters-btn')).toBeEnabled();
    expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument();
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

  it('disables the Restore Filters button and shows an error alert when data.errors is non-empty', async () => {
    mockLoadQuerySummaryData.mockReturnValue({
      ...baseData,
      errors: Promise.resolve(['\\phs001\\']),
    });
    render(QuerySummary, baseProps);

    await screen.findByTestId('dataset-filters-container');

    // Modal trigger is replaced by the disabled Popover button
    expect(screen.queryByTestId('restore-filters-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('restore-popover-btn')).toBeDisabled();
    expect(screen.getByTestId('error-alert')).toBeInTheDocument();
    expect(screen.getByTestId('error-alert')).toHaveTextContent('\\phs001\\');
  });

  it('keeps restoring a saved V2 query disabled when the compatibility flag is off', async () => {
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.queryByTestId('restore-filters-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('restore-popover-btn')).toBeDisabled();
  });

  it('enables restoring a saved V2 query when the compatibility flag is on', async () => {
    mockConfig.features.restoreV2queries = true;
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.getByTestId('restore-filters-btn')).toBeEnabled();
  });

  it('hides the Restore Filters button for V2 queries when restoreV2queries is false', async () => {
    mockConfig.features.restoreV2queries = false;
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.queryByTestId('restore-filters-btn')).not.toBeInTheDocument();
    const popover = screen.getByTestId('restore-popover-btn');
    expect(popover).toBeDisabled();
    expect(popover).toHaveTextContent('Restore Filters');
  });

  it('shows the enabled Restore Filters button for V2 queries when restoreV2queries is true', async () => {
    mockConfig.features.restoreV2queries = true;
    mockLoadQuerySummaryData.mockReturnValue(baseData);
    render(QuerySummary, { query: queryV2, version: QueryVersion.V2 });

    await screen.findByTestId('dataset-filters-container');

    expect(screen.getByTestId('restore-filters-btn')).toBeEnabled();
    expect(screen.queryByTestId('restore-popover-btn')).not.toBeInTheDocument();
  });
});
