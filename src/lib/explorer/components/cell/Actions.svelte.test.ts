// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import Actions from '#lib/explorer/components/cell/Actions.svelte';
import { exportState, mapSearchResultAsExport } from '#lib/explorer/export/export.svelte.ts';
import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';

vi.mock('#lib/telemetry/logger.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#lib/telemetry/logger.ts')>()),
  log: vi.fn(),
}));
vi.mock('#lib/explorer/mode.ts', () => ({ isOpenAccess: () => false }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { explorer: { exportsEnableExport: true, enableHierarchy: true } } },
}));

const row = {
  conceptPath: '\\phs1\\age\\',
  name: 'age',
  display: 'Age',
  dataset: 'phs1',
  type: 'Continuous',
  allowFiltering: true,
} as unknown as SearchResult;

describe('search result row actions', () => {
  beforeEach(() => exportState.clear());
  afterEach(() => {
    explorerPanel.closeRow();
    explorerPanel.hide();
  });

  it.each([
    ['Information (i)', 'info'],
    ['Filter (f)', 'filter'],
    ['Data Hierarchy (h)', 'hierarchy'],
  ])('%s opens its panel for the row', async (name, view) => {
    render(Actions, { row });

    await fireEvent.click(screen.getByRole('button', { name }));

    expect(explorerPanel.activeRow).toBe(row.conceptPath);
    expect(explorerPanel.activeView).toBe(view);
  });

  it('adds the variable for analysis, then removes it', async () => {
    render(Actions, { row });

    await fireEvent.click(screen.getByRole('button', { name: 'Add for Analysis (e)' }));
    expect(exportState.variables.map((e) => e.conceptPath)).toEqual([row.conceptPath]);
    expect(explorerPanel.open).toBe(true);

    await fireEvent.click(screen.getByRole('button', { name: 'Remove from Analysis (e)' }));
    expect(exportState.variables).toEqual([]);
    expect(screen.getByRole('button', { name: 'Add for Analysis (e)' })).toBeVisible();
  });

  it('removes an export that was added somewhere else', async () => {
    exportState.add(mapSearchResultAsExport({ ...row }));
    render(Actions, { row });

    await fireEvent.click(screen.getByRole('button', { name: 'Remove from Analysis (e)' }));

    expect(screen.getByRole('button', { name: 'Add for Analysis (e)' })).toBeVisible();
  });
});
