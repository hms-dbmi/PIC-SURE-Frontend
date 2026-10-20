import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/query/filters.svelte.ts', () => ({
  filterState: { add: vi.fn(), update: vi.fn(), enrich: vi.fn() },
}));

import { saveFilter } from '#lib/explorer/saveFilter.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
import type { Filter } from '#lib/query/filter.svelte.ts';

const filter = { id: '\\demo\\age\\', dataset: 'ds', uuid: 'new' } as Filter;

describe('saveFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    explorerPanel.hide();
    explorerPanel.toggleRow('\\demo\\age\\', { view: 'filter', table: 'ExplorerTable' });
  });

  it('adds the filter, fills in its labels, and shows it in the open panel', () => {
    saveFilter(filter);

    expect(filterState.add).toHaveBeenCalledWith(filter);
    expect(filterState.enrich).toHaveBeenCalledWith(filter, '\\demo\\age\\', 'ds');
    expect(explorerPanel.activeRow).toBe('');
    expect(explorerPanel.open).toBe(true);
  });

  it('replaces an existing filter in place', () => {
    saveFilter(filter, { replacing: 'old' });

    expect(filterState.update).toHaveBeenCalledWith('old', filter);
    expect(filterState.add).not.toHaveBeenCalled();
  });

  it('leaves the labels alone when asked not to enrich', () => {
    saveFilter(filter, { enrich: false });

    expect(filterState.add).toHaveBeenCalledWith(filter);
    expect(filterState.enrich).not.toHaveBeenCalled();
    expect(explorerPanel.open).toBe(true);
  });
});
