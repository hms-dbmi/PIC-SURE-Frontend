import type { DriverHook } from 'driver.js';
import type { TourHooks } from '#lib/explorer/components/tour/tourSteps.ts';

// The tour drives the page by clicking its controls. Every selector it uses outside
// TourConfiguration.json is here.
const SEARCH_BOX = '#explorer-search-box';
const RESULTS_TABLE = '#explorer-table';
const RESULTS_PANEL = '#results-side-panel';
const RESULTS_PANEL_TOGGLE = '#results-panel-toggle';
const ENABLED_ROW_FILTER = 'button.row-action-filter:not(:disabled)';
const NON_STIGMATIZED_ROW = 'non-stigmatized-row';
const rowControl = (rowId: string | undefined, testid: string) =>
  `#${rowId} [data-testid="${testid}"]`;

function click(selector: string) {
  document.querySelector<HTMLElement>(selector)?.click();
}

export function openResultsPanel() {
  click(RESULTS_PANEL_TOGGLE);
}

export function closeResultsPanel() {
  if (document.querySelector(RESULTS_PANEL)?.classList.contains('open-panel')) {
    click(RESULTS_PANEL_TOGGLE);
  }
}

/** Shows a term in the search box, which `explorerSearch.setTerm` doesn't update. */
export function setSearchBox(value: string, { focus = false } = {}) {
  const searchBox = document.querySelector<HTMLInputElement>(SEARCH_BOX);
  if (!searchBox) return;
  searchBox.value = value;
  if (focus) searchBox.focus();
}

/**
 * Marks the first search result that can be filtered, so later steps can point at it: open access
 * disables filtering on stigmatized variables.
 */
export function markFirstFilterableRow() {
  const rows = document.querySelector(RESULTS_TABLE)?.querySelectorAll('tr') ?? [];
  Array.from(rows)
    .find((row) => row.querySelector(ENABLED_ROW_FILTER))
    ?.classList.add(NON_STIGMATIZED_ROW);
}

/** The hooks TourConfiguration.json can name. `moveNext` advances the running tour. */
export function tourHooks(moveNext: () => void, resetSearch: () => void): TourHooks {
  const highlight =
    (on: boolean): DriverHook =>
    (element) =>
      (element as HTMLElement).classList.toggle('highlight', on);

  // A categorical filter needs an option picked before it can be added.
  const applyFilterThenNext: DriverHook = (element) => {
    const rowId = element?.id;
    if (document.querySelector(rowControl(rowId, 'filter-numerical'))) {
      click(rowControl(rowId, 'filter-add'));
      moveNext();
      return;
    }
    click(rowControl(rowId, 'ui-options-selection-list-select-all'));
    setTimeout(() => {
      click(rowControl(rowId, 'filter-add'));
      moveNext();
    }, 200);
  };

  return {
    disablePrevious: () => {},
    clickElement: (element) => (element as HTMLElement)?.click(),
    clickElementThenNext: (element) => {
      (element as HTMLElement)?.click();
      moveNext();
    },
    addHighlightClass: highlight(true),
    removeHighlightClass: highlight(false),
    resetSearch,
    applyFilterThenNext,
    findAndSetFirstNonStigmatizedAvailableFilterThenNext: () => {
      markFirstFilterableRow();
      moveNext();
    },
  };
}
