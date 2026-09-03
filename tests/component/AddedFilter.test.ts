// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((eventType: any, action: any, metadata: any) => ({
    event_type: eventType,
    action,
    metadata,
  })),
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$lib/stores/GeneFilter', () => ({ populateFromGeneFilter: vi.fn() }));

vi.mock('$lib/stores/SNPFilter', () => ({ populateFromSNPFilter: vi.fn() }));

vi.mock('$lib/stores/Filter', async () => {
  const { writable } = await import('svelte/store');
  return {
    removeFilter: vi.fn(),
    activeFilter: writable(undefined),
    activeSearch: writable(undefined),
  };
});

vi.mock('$lib/stores/Dictionary', () => ({ getConceptDetails: vi.fn() }));

vi.mock('$lib/stores/ExpandableRow', async () => {
  const { writable } = await import('svelte/store');
  return { activeRow: writable('') };
});

vi.mock('$lib/stores/SidePanel', async () => {
  const { writable } = await import('svelte/store');
  return { panelOpen: writable(true) };
});

import AddedFilter from '$lib/components/explorer/results/AddedFilter.svelte';
import { log } from '$lib/logger';
import type { Filter } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

const searchResult = {
  conceptPath: '\\test\\concept\\',
  dataset: 'dataset-1',
  name: 'variable-accession',
  display: 'Variable Display',
  description: 'Variable description',
  type: 'Categorical',
  allowFiltering: true,
} as SearchResult;

const categoricalFilter = {
  parent: undefined,
  uuid: 'filter-uuid',
  id: searchResult.conceptPath,
  filterType: 'Categorical',
  displayType: 'restrict',
  searchResult,
  categoryValues: ['value-1'],
  variableName: 'Variable Display',
  description: searchResult.description,
  allowFiltering: true,
  dataset: 'dataset-1',
} as Filter;

const genomicFilter = {
  parent: undefined,
  uuid: 'genomic-uuid',
  id: 'genomic-id',
  filterType: 'genomic',
  variableName: 'Gene With Variant',
  categoryValues: [],
} as unknown as Filter;

describe('AddedFilter', () => {
  beforeEach(() => vi.mocked(log).mockClear());

  // Regression guard for ALS-12904: the edit control for phenotypic filters is
  // Modal's trigger button, which is a different code path from the genomic
  // button below and previously logged nothing.
  it('logs filter.edit_click when a phenotypic filter is edited', async () => {
    render(AddedFilter, { filter: categoricalFilter });

    await fireEvent.click(screen.getByRole('button', { name: 'Edit Filter' }));

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'ACTION',
        action: 'filter.edit_click',
        metadata: { variable: 'Variable Display' },
      }),
    );
  });

  it('logs filter.edit_click when a genomic filter is edited', async () => {
    render(AddedFilter, { filter: genomicFilter });

    await fireEvent.click(screen.getByRole('button', { name: 'Edit Filter' }));

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'ACTION',
        action: 'filter.edit_click',
        metadata: { variable: 'Gene With Variant' },
      }),
    );
  });
});
