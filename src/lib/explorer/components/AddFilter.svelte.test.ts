// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import AddFilter from '#lib/explorer/components/AddFilter.svelte';
import { getConceptDetails } from '#lib/explorer/Dictionary.ts';
import type { SearchResult } from '#lib/explorer/types.ts';
import { createCategoricalFilter } from '#lib/query/filter.svelte.ts';
import { optionsIn } from '../../../../tests/support/helpers';

vi.mock('$app/env', () => ({ browser: false }));

vi.mock('#lib/explorer/Dictionary.ts', () => ({
  getConceptDetails: vi.fn(),
}));

vi.mock('#lib/ui/toaster.ts', () => ({
  toaster: { error: vi.fn() },
}));

const mockGetConceptDetails = vi.mocked(getConceptDetails);
const onadded = vi.fn();

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
  render(AddFilter, {
    data: { ...categoricalSearchResult, values: undefined } as SearchResult,
    onadded,
  });
  return valuesHaveLoaded();
}

function uncheckFirstSelected() {
  const selected = screen.getByTestId('ui-options-selection-list-selected');
  return fireEvent.click(selected.querySelector('input[type="checkbox"]')!);
}

describe('AddFilter', () => {
  beforeEach(() => {
    mockGetConceptDetails.mockReset();
    onadded.mockReset();
  });

  it('hands a numeric filter over without waiting for the concept details', async () => {
    render(AddFilter, { data: numericSearchResult, onadded });

    await fireEvent.click(await screen.findByTestId('filter-add'));

    expect(onadded).toHaveBeenCalledTimes(1);
    expect(onadded.mock.calls[0][0]).toMatchObject({
      filterType: 'numeric',
      displayType: 'any',
      id: numericSearchResult.conceptPath,
    });
    expect(mockGetConceptDetails).not.toHaveBeenCalled();
  });

  it('builds a categorical filter from the loaded details', async () => {
    await renderCategoricalFilter();

    await fireEvent.click(screen.getByRole('checkbox', { name: values[1] }));
    await fireEvent.click(screen.getByTestId('filter-add'));

    const filter = onadded.mock.calls[0][0];
    expect(filter).toMatchObject({ displayType: 'restrict', categoryValues: [values[1]] });
    expect(filter.searchResult).toBe(categoricalSearchResult);
  });

  it('keeps the selection when the row is re-rendered with the same concept', async () => {
    mockGetConceptDetails.mockResolvedValue(categoricalSearchResult);
    const row = { ...categoricalSearchResult, values: undefined } as SearchResult;
    const { rerender } = render(AddFilter, { data: row, onadded });
    await valuesHaveLoaded();
    await fireEvent.click(screen.getByRole('checkbox', { name: values[0] }));

    await rerender({ data: { ...row }, onadded });

    expect(mockGetConceptDetails).toHaveBeenCalledTimes(1);
    expect(optionsIn('selected')).toEqual([values[0]]);
    expect(screen.getByTestId('filter-add')).toBeEnabled();
  });

  it('starts an edit from the existing filter and its concept', async () => {
    const filter = createCategoricalFilter(categoricalSearchResult, [values[2]]);
    render(AddFilter, { data: categoricalSearchResult, existingFilter: filter, onadded });

    expect(optionsIn('selected')).toEqual([values[2]]);
    expect(screen.getByText(`Variable Name: ${categoricalSearchResult.display}`)).toBeVisible();
    expect(mockGetConceptDetails).not.toHaveBeenCalled();
  });
  it('moves an unchecked value back into the options list', async () => {
    await renderCategoricalFilter();

    await fireEvent.click(screen.getByRole('checkbox', { name: values[0] }));
    await uncheckFirstSelected();

    expect(optionsIn('selected')).toEqual([]);
    expect(optionsIn('available')).toEqual(values.slice(0, 20));
  });

  it('pages through every value exactly once across selection changes', async () => {
    await renderCategoricalFilter();
    const optionsContainer = screen.getByTestId('ui-options-selection-list-available');

    // Selecting and unselecting shifts the list the pager reads from, which used to make
    // it skip values and hand back ones already listed.
    await fireEvent.click(screen.getByRole('checkbox', { name: values[0] }));
    await fireEvent.scroll(optionsContainer);
    await uncheckFirstSelected();
    await fireEvent.scroll(optionsContainer);

    // Every value, in source order, none missing and none repeated.
    expect(optionsIn('available')).toEqual(values);
  });
});
