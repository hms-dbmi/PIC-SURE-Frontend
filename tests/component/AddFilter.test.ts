// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import AddFilter from '$lib/components/explorer/AddFilter.svelte';
import { getConceptDetails } from '$lib/stores/Dictionary';
import { addFilter, enrichFilterDetails } from '$lib/stores/Filter';
import type { SearchResult } from '$lib/models/Search';

vi.mock('$app/environment', () => ({ browser: false }));

vi.mock('$lib/stores/Dictionary', () => ({
  getConceptDetails: vi.fn(),
}));

vi.mock('$lib/stores/Filter', () => ({
  addFilter: vi.fn(),
  updateFilter: vi.fn(),
  enrichFilterDetails: vi.fn(),
}));

vi.mock('$lib/toaster', () => ({
  toaster: { error: vi.fn() },
}));

vi.mock('$lib/stores/ExpandableRow', async () => {
  const { writable } = await import('svelte/store');
  return { activeRow: writable('') };
});

vi.mock('$lib/stores/SidePanel', async () => {
  const { writable } = await import('svelte/store');
  return { panelOpen: writable(true) };
});

const mockGetConceptDetails = vi.mocked(getConceptDetails);
const mockAddFilter = vi.mocked(addFilter);
const mockEnrichFilterDetails = vi.mocked(enrichFilterDetails);

const numericSearchResult = {
  conceptPath: '\\test\\concept\\',
  dataset: 'dataset-1',
  name: 'variable-accession',
  display: 'Variable Display',
  studyAcronym: 'Study Acronym',
  description: 'Variable description',
  type: 'Continuous',
  allowFiltering: true,
} as SearchResult;

describe('AddFilter', () => {
  beforeEach(() => {
    mockGetConceptDetails.mockReset();
    mockAddFilter.mockReset();
    mockEnrichFilterDetails.mockReset();
  });

  it('adds a numeric filter immediately and enriches dataset/study in the background', async () => {
    render(AddFilter, { data: numericSearchResult });

    await fireEvent.click(await screen.findByTestId('add-filter'));

    expect(mockAddFilter).toHaveBeenCalledTimes(1);
    const addedFilter = mockAddFilter.mock.calls[0][0];
    expect(mockEnrichFilterDetails).toHaveBeenCalledWith(
      addedFilter,
      '\\test\\concept\\',
      'dataset-1',
    );
    // The component must not block adding on the detail fetch.
    expect(mockGetConceptDetails).not.toHaveBeenCalled();
  });
});
