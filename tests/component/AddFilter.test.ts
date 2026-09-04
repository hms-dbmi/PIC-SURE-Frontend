// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import AddFilter from '$lib/components/explorer/AddFilter.svelte';
import { getConceptDetails } from '$lib/stores/Dictionary';
import { addFilter, enrichFilterDetails } from '$lib/stores/Filter';
import type { SearchResult } from '$lib/models/Search';
import { optionsIn } from './helpers';

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

const values = Array.from({ length: 60 }, (_, i) => `value-${i}`);

const categoricalSearchResult = {
  conceptPath: '\\test\\categorical\\',
  dataset: 'dataset-1',
  name: 'categorical-accession',
  display: 'Categorical Display',
  type: 'Categorical',
  allowFiltering: true,
  values,
} as SearchResult;

// Await the loaded values themselves: the filter renders from the incoming prop, before
// getConceptDetails resolves, so waiting on the container would not prove it is populated.
function valuesHaveLoaded() {
  return screen.findByRole('checkbox', { name: values[0] });
}

function renderCategoricalFilter() {
  mockGetConceptDetails.mockResolvedValue(categoricalSearchResult);
  render(AddFilter, { data: { ...categoricalSearchResult, values: undefined } as SearchResult });
  return valuesHaveLoaded();
}

function uncheckFirstSelected() {
  const selected = document.getElementById('selected-options-container');
  return fireEvent.click(selected!.querySelector('input[type="checkbox"]')!);
}

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
  it('moves an unchecked value back into the options list', async () => {
    await renderCategoricalFilter();

    await fireEvent.click(screen.getByRole('checkbox', { name: values[0] }));
    await uncheckFirstSelected();

    expect(optionsIn('selected-options-container')).toEqual([]);
    expect(optionsIn('options-container')).toEqual(values.slice(0, 20));
  });

  it('pages through every value exactly once across selection changes', async () => {
    await renderCategoricalFilter();
    const optionsContainer = document.getElementById('options-container')!;

    // Selecting and unselecting shifts the list the pager reads from, which used to make
    // it skip values and hand back ones already listed.
    await fireEvent.click(screen.getByRole('checkbox', { name: values[0] }));
    await fireEvent.scroll(optionsContainer);
    await uncheckFirstSelected();
    await fireEvent.scroll(optionsContainer);

    // Every value, in source order, none missing and none repeated.
    expect(optionsIn('options-container')).toEqual(values);
  });
});
