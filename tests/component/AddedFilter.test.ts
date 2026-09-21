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

vi.mock('$lib/stores/GenomicDraft', () => ({ loadDraftForEditing: vi.fn() }));

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

import AddedFilter from '$lib/components/explorer/results/AddedFilter.svelte';
import { goto } from '$app/navigation';
import { log } from '$lib/logger';
import type { Filter } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';
import { loadDraftForEditing } from '$lib/stores/GenomicDraft';

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

const snpFilter = {
  parent: undefined,
  uuid: 'snp-uuid',
  id: 'snp-variant',
  filterType: 'snp',
  variableName: 'Variant Filter',
  snpValues: [{ search: 'chr17,35269878,GT,A', constraint: '0/1' }],
} as unknown as Filter;

describe('AddedFilter', () => {
  beforeEach(() => {
    vi.mocked(log).mockClear();
    vi.mocked(goto).mockClear();
    vi.mocked(loadDraftForEditing).mockClear();
  });

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

  // The Genotypes tab shows the filter's own state, so editing one is a navigation to that
  // tab and nothing else - no edit mode to deep link into.
  it.each([
    { label: 'a genomic', filter: genomicFilter },
    { label: 'an SNP', filter: snpFilter },
  ])('sends $label filter to the Genotypes tab with the filter loaded', async ({ filter }) => {
    render(AddedFilter, { filter });

    await fireEvent.click(screen.getByRole('button', { name: 'Edit Filter' }));

    expect(loadDraftForEditing).toHaveBeenCalledWith(filter);
    expect(goto).toHaveBeenCalledWith('/explorer/genotypes');
  });
});
