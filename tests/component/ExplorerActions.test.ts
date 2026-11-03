// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));

vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { explorer: { enableHierarchy: true, exportsEnableExport: true } } },
}));

vi.mock('$lib/AccessState', () => ({
  isOpenAccess: vi.fn(() => false),
}));

// The real store eagerly imports explorer components that touch localStorage at module load.
vi.mock('$lib/stores/ExpandableRow', () => ({ setActiveRow: vi.fn() }));

import Actions from '$lib/components/explorer/cell/Actions.svelte';
import type { SearchResult } from '$lib/models/Search';
import { setActiveRow } from '$lib/stores/ExpandableRow';
import { exports, clearExports } from '$lib/stores/Export';
import { panelOpen } from '$lib/stores/SidePanel';

const row = {
  conceptPath: '\\demographic\\AGE\\',
  name: 'AGE',
  display: 'Age',
  dataset: 'demographic',
  allowFiltering: true,
};

function renderActions() {
  // Actions types `data` as SearchResult, but Row.svelte passes it { tableName, index, row, cell }.
  const data = { tableName: 'ExplorerTable', index: 0, row, cell: undefined };
  render(Actions, { data: data as unknown as SearchResult });
}

afterEach(() => {
  vi.clearAllMocks();
  clearExports();
  panelOpen.set(false);
});

describe('Explorer row actions', () => {
  it.each([
    ['View Information (i)', 'info'],
    ['View Filter (f)', 'filter'],
    ['View Data Hierarchy (h)', 'hierarchy'],
  ])('%s opens its panel for the row', async (name, component) => {
    renderActions();

    await fireEvent.click(screen.getByRole('button', { name }));

    expect(setActiveRow).toHaveBeenCalledWith({
      row: row.conceptPath,
      component,
      table: 'ExplorerTable',
    });
  });

  it('adds the variable for analysis, then removes it', async () => {
    renderActions();

    await fireEvent.click(screen.getByRole('button', { name: 'Add for Analysis (e)' }));
    expect(get(exports).map((e) => e.conceptPath)).toEqual([row.conceptPath]);
    expect(get(panelOpen)).toBe(true);

    await fireEvent.click(screen.getByRole('button', { name: 'Remove from Analysis (e)' }));
    expect(get(exports)).toEqual([]);
    expect(screen.getByRole('button', { name: 'Add for Analysis (e)' })).toBeTruthy();
  });
});
