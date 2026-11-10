// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';

vi.mock('#lib/telemetry/logger.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#lib/telemetry/logger.ts')>()),
  log: vi.fn(),
}));
vi.mock('#lib/explorer/mode.ts', () => ({ isOpenAccess: () => false }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { explorer: { exportsEnableExport: true, enableHierarchy: true } } },
}));
// The real store eagerly imports explorer components that touch localStorage at module load.
vi.mock('#lib/explorer/ExpandableRow.ts', () => ({ setActiveRow: vi.fn() }));

import Actions from '#lib/explorer/components/cell/Actions.svelte';
import {
  addExport,
  clearExports,
  exports,
  mapSearchResultAsExport,
} from '#lib/explorer/export/Export.ts';
import { setActiveRow } from '#lib/explorer/ExpandableRow.ts';
import { panelOpen } from '#lib/explorer/panel.ts';
import type { SearchResult } from '#lib/explorer/types.ts';

const row = {
  conceptPath: '\\phs1\\age\\',
  name: 'age',
  display: 'Age',
  dataset: 'phs1',
  type: 'Continuous',
  allowFiltering: true,
} as unknown as SearchResult;

describe('search result row actions', () => {
  beforeEach(() => clearExports());
  afterEach(() => {
    vi.clearAllMocks();
    panelOpen.set(false);
  });

  it.each([
    ['Information (i)', 'info'],
    ['Filter (f)', 'filter'],
    ['Data Hierarchy (h)', 'hierarchy'],
  ])('%s opens its panel for the row', async (name, component) => {
    render(Actions, { data: { tableName: 'ExplorerTable', row } });

    await fireEvent.click(screen.getByRole('button', { name }));

    expect(setActiveRow).toHaveBeenCalledWith({
      row: row.conceptPath,
      component,
      table: 'ExplorerTable',
    });
  });

  it('adds the variable for analysis, then removes it', async () => {
    render(Actions, { data: { tableName: 'ExplorerTable', row } });

    await fireEvent.click(screen.getByRole('button', { name: 'Add for Analysis (e)' }));
    expect(get(exports).map((e) => e.conceptPath)).toEqual([row.conceptPath]);
    expect(get(panelOpen)).toBe(true);

    await fireEvent.click(screen.getByRole('button', { name: 'Remove from Analysis (e)' }));
    expect(get(exports)).toEqual([]);
    expect(screen.getByRole('button', { name: 'Add for Analysis (e)' })).toBeVisible();
  });

  it('removes an export that was added somewhere else', async () => {
    addExport(mapSearchResultAsExport({ ...row }));
    render(Actions, { data: { row } });

    await fireEvent.click(screen.getByRole('button', { name: 'Remove from Analysis (e)' }));

    expect(screen.getByRole('button', { name: 'Add for Analysis (e)' })).toBeVisible();
  });
});
