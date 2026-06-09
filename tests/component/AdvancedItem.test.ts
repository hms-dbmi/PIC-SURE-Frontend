// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import AdvancedItem from '$lib/components/explorer/advanced/AdvancedItem.svelte';
import type { FilterInterface } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

type SearchResultFixture = Partial<Omit<SearchResult, 'studyAcronym'>> & {
  studyAcronym?: string | null;
};

vi.mock('@dnd-kit-svelte/svelte/sortable', () => ({
  useSortable: () => ({
    ref: vi.fn(),
    handleRef: vi.fn(),
  }),
}));

function makeFilter(searchResult: SearchResultFixture): FilterInterface {
  return {
    parent: undefined,
    uuid: 'filter-1',
    id: '\\test\\filter\\',
    filterType: 'Categorical',
    displayType: 'restrict',
    searchResult: {
      conceptPath: '\\test\\filter\\',
      dataset: '',
      name: 'Filter',
      display: 'Filter',
      studyAcronym: '',
      description: '',
      type: 'Categorical',
      allowFiltering: true,
      ...searchResult,
    } as SearchResult,
    variableName: 'Filter',
    allowFiltering: true,
    dataset: searchResult.dataset ?? '',
  };
}

function renderAdvancedItem(searchResult: SearchResultFixture) {
  render(AdvancedItem, {
    filter: makeFilter(searchResult),
    onRemove: vi.fn(),
  });
}

describe('AdvancedItem', () => {
  it('renders study and dataset metadata on one comma-separated line', () => {
    renderAdvancedItem({
      studyAcronym: 'demographics',
      table: { display: 'Demographics Dataset' } as SearchResult,
    });

    expect(
      screen.getByText('Study: demographics, Dataset: Demographics Dataset'),
    ).toBeInTheDocument();
  });

  it('renders only dataset metadata when studyAcronym is null', () => {
    renderAdvancedItem({
      studyAcronym: null,
      table: { display: 'Demographics Dataset' } as SearchResult,
    });

    expect(screen.getByText('Dataset: Demographics Dataset')).toBeInTheDocument();
    expect(screen.queryByText(/Study:/)).not.toBeInTheDocument();
  });

  it('prefers the table display name over the dataset id', () => {
    renderAdvancedItem({
      studyAcronym: 'demographics',
      table: { display: 'Demographics Dataset', dataset: 'pht12345' } as SearchResult,
    });

    expect(
      screen.getByText('Study: demographics, Dataset: Demographics Dataset'),
    ).toBeInTheDocument();
  });

  it('falls back to the table dataset id when the display name is missing', () => {
    renderAdvancedItem({
      studyAcronym: 'demographics',
      table: { dataset: 'pht12345' } as SearchResult,
    });

    expect(screen.getByText('Study: demographics, Dataset: pht12345')).toBeInTheDocument();
  });

  it('omits dataset metadata when the table is absent', () => {
    renderAdvancedItem({ studyAcronym: 'demographics', table: null });

    expect(screen.getByText('Study: demographics')).toBeInTheDocument();
    expect(screen.queryByText(/Dataset:/)).not.toBeInTheDocument();
  });
});
