// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { TableHandler } from '@vincjo/datatables';

import tourConfig from '#lib/assets/TourConfiguration.json';

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

// Actions.svelte gates the hierarchy/export buttons behind these flags. The
// deployments that ship these tours (see TourConfiguration.json) run with
// both enabled - see ENABLE_HIERARCHY/ALLOW_EXPORT_ENABLED in config/schema.ts.
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: {
      explorer: {
        enableHierarchy: true,
        exportsEnableExport: true,
      },
    },
  },
}));

vi.mock('#lib/explorer/mode.ts', () => ({
  isOpenAccess: vi.fn(() => false),
}));

import ResultsTable from '#lib/explorer/components/ResultsTable.svelte';
import { markFirstFilterableRow } from '#lib/explorer/components/tour/tourActions.ts';
import type { Column } from '#lib/ui/datatable/types.ts';
import type { SearchResult } from '#lib/explorer/types.ts';
import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
import { isOpenAccess } from '#lib/explorer/mode.ts';

// Explorer.svelte renders the row's info, filter or hierarchy view here.
const expandedRow = createRawSnippet(() => ({ render: () => '<div>expanded</div>' }));

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(isOpenAccess).mockReturnValue(false);
  explorerPanel.closeRow();
});

// The default branding columns (Dataset, Variable Name). The tour's "row-0-col-2" selectors
// assume the Actions column ResultsTable appends lands at index 2.
const columns: Column<SearchResult>[] = [
  { label: 'Dataset', dataElement: 'dataset' },
  { label: 'Variable Name', dataElement: 'name' },
];

function makeRow(i: number) {
  return {
    conceptPath: `\\demographic\\VAR_${i}\\`,
    dataset_id: `ds-${i}`,
    dataset: `Dataset ${i}`,
    name: `Variable ${i}`,
    display: `Variable ${i}`,
  } as unknown as SearchResult;
}

function renderExplorerTable() {
  const rows = [makeRow(0), makeRow(1)];
  const handler = new TableHandler(rows, { rowsPerPage: 10 });

  // Row 0 is expanded, as it is by the time the tour reaches its
  // "active-row"/"row-0-col-2" steps (it drives the row open first).
  explorerPanel.toggleRow(rows[0].conceptPath);

  return render(ResultsTable, { handler, columns, expandedRow });
}

type Tour = { steps: { element: string }[] };
const tours = tourConfig as unknown as Record<string, Tour>;

// Every step selector that targets the search-results table's own markup
// (as opposed to page-level chrome like #explorer-facet-sidebar, rendered elsewhere).
const tableScopedSelectors = new Set(
  Object.values(tours)
    .flatMap((tour) => tour.steps.map((step) => step.element))
    .filter(
      (selector) => selector.includes('explorer-table') || selector.includes('non-stigmatized-row'),
    ),
);

describe('TourConfiguration.json selectors against the real datatable markup', () => {
  it('collected at least one table-scoped selector to check', () => {
    expect(tableScopedSelectors.size).toBeGreaterThan(0);
  });

  it.each([...tableScopedSelectors])(
    '"%s" resolves against a rendered ExplorerTable',
    (selector) => {
      const { container } = renderExplorerTable();
      markFirstFilterableRow();

      expect(container.querySelector(selector)).not.toBeNull();
    },
  );
});

describe('markFirstFilterableRow under open access', () => {
  it('skips row 0 when its filter button is disabled and marks row 1 instead', () => {
    vi.mocked(isOpenAccess).mockReturnValue(true);

    const rows = [
      { ...makeRow(0), allowFiltering: false },
      { ...makeRow(1), allowFiltering: true },
    ];
    const handler = new TableHandler(rows, { rowsPerPage: 10 });

    const { container } = render(ResultsTable, { handler, columns, expandedRow });

    markFirstFilterableRow();

    expect(container.querySelector('#explorer-table-row-0')).not.toHaveClass('non-stigmatized-row');
    expect(container.querySelector('#explorer-table-row-1')).toHaveClass('non-stigmatized-row');
  });
});
