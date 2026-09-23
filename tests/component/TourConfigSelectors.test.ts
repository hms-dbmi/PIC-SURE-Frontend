// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { TableHandler } from '@vincjo/datatables';

import tourConfig from '$lib/assets/TourConfiguration.json';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

// Actions.svelte gates the hierarchy/export buttons behind these flags. The
// deployments that ship these tours (see TourConfiguration.json) run with
// both enabled - see ENABLE_HIERARCHY/ALLOW_EXPORT_ENABLED in Configuration.ts.
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features: {
      explorer: {
        enableHierarchy: true,
        exportsEnableExport: true,
      },
    },
  },
}));

vi.mock('$lib/AccessState', () => ({
  isOpenAccess: vi.fn(() => false),
}));

// Same minimal store stub used by DatatableRow.test.ts / DatatableKeyboardNav.test.ts:
// the real store eagerly imports explorer components that touch localStorage at
// module load, which isn't available in this environment.
vi.mock('$lib/stores/ExpandableRow', () => {
  const make = (value: unknown) => {
    let current = value;
    const subscribers = new Set<(v: unknown) => void>();
    return {
      subscribe(fn: (v: unknown) => void) {
        fn(current);
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
      set(next: unknown) {
        current = next;
        subscribers.forEach((fn) => fn(current));
      },
    };
  };
  return {
    activeTable: make(''),
    activeRow: make(''),
    activeComponent: make(undefined),
    setActiveRow: vi.fn(),
    closeActiveRow: vi.fn(),
  };
});

import RemoteTable from '$lib/components/datatable/RemoteTable.svelte';
import Actions from '$lib/components/explorer/cell/Actions.svelte';
import { activeTable, activeRow } from '$lib/stores/ExpandableRow';
import { isOpenAccess } from '$lib/AccessState';

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(isOpenAccess).mockReturnValue(false);
  activeTable.set('');
  activeRow.set('');
});

// Mirrors Explorer.svelte's real columns: default branding columns (Dataset, Variable
// Name) plus the Actions column it always appends. The tour's "row-0-col-2" selectors
// assume Actions lands at index 2 - this fixture is what pins that assumption down.
const columns = [
  { label: 'Dataset', dataElement: 'dataset' },
  { label: 'Variable Name', dataElement: 'name' },
  { dataElement: 'id', label: 'Actions' },
];

function makeRow(i: number) {
  return {
    conceptPath: `\\demographic\\VAR_${i}\\`,
    dataset_id: `ds-${i}`,
    dataset: `Dataset ${i}`,
    name: `Variable ${i}`,
    display: `Variable ${i}`,
  };
}

function renderExplorerTable() {
  const rows = [makeRow(0), makeRow(1)];
  const handler = new TableHandler(rows, { rowsPerPage: 10 });

  // Row 0 is expanded, as it is by the time the tour reaches its
  // "active-row"/"row-0-col-2" steps (it drives the row open first).
  activeTable.set('ExplorerTable');
  activeRow.set(rows[0].conceptPath);

  return render(RemoteTable, {
    tableName: 'ExplorerTable',
    handler,
    columns,
    cellOverides: { id: Actions },
    isClickable: true,
    expandable: true,
  });
}

// Mirrors ExplorerTour.svelte's findAndSetFirstNonStigmatizedAvailableFilterThenNext
// hook (find the first row with a filter button, mark it non-stigmatized) - reproduced
// here since the hook is inline in that component and isn't exported.
function markFirstRowNonStigmatized(container: HTMLElement) {
  const table = container.querySelector('#ExplorerTable-table') as HTMLTableElement;
  const row = Array.from(table.querySelectorAll('tr')).find((tr) =>
    tr.querySelector('button.row-action-filter:not(:disabled)'),
  );
  row?.classList.add('non-stigmatized-row');
}

type Tour = { steps: { element: string }[] };
const tours = tourConfig as unknown as Record<string, Tour>;

// Every step selector that targets the search-results table's own markup
// (as opposed to page-level chrome like #facet-side-bar, rendered elsewhere).
const tableScopedSelectors = new Set(
  Object.values(tours)
    .flatMap((tour) => tour.steps.map((step) => step.element))
    .filter(
      (selector) => selector.includes('ExplorerTable') || selector.includes('non-stigmatized-row'),
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
      markFirstRowNonStigmatized(container);

      expect(container.querySelector(selector)).not.toBeNull();
    },
  );
});

describe('markFirstRowNonStigmatized under open access', () => {
  it('skips row 0 when its filter button is disabled and marks row 1 instead', () => {
    vi.mocked(isOpenAccess).mockReturnValue(true);

    const rows = [
      { ...makeRow(0), allowFiltering: false },
      { ...makeRow(1), allowFiltering: true },
    ];
    const handler = new TableHandler(rows, { rowsPerPage: 10 });

    const { container } = render(RemoteTable, {
      tableName: 'ExplorerTable',
      handler,
      columns,
      cellOverides: { id: Actions },
      isClickable: true,
      expandable: true,
    });

    markFirstRowNonStigmatized(container);

    expect(container.querySelector('#ExplorerTable-row-0')).not.toHaveClass('non-stigmatized-row');
    expect(container.querySelector('#ExplorerTable-row-1')).toHaveClass('non-stigmatized-row');
  });
});
