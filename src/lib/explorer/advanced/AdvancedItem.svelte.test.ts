// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import { FilterTreeEditor } from '#lib/explorer/advanced/FilterTreeEditor.svelte.ts';
import { createFilterGroup, type FilterInterface } from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import AdvancedItemHost from '../../../../tests/support/fixtures/AdvancedItemHost.svelte';
import type { SearchResult } from '#lib/explorer/types.ts';

type SearchResultFixture = Partial<Omit<SearchResult, 'studyAcronym'>> & {
  studyAcronym?: string | null;
};

vi.mock('#lib/ui/sortable/sortable.ts', () => ({
  CollisionPriority: {},
  createSortable: () => ({
    attach: vi.fn(),
    attachHandle: vi.fn(),
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
  const editor = new FilterTreeEditor(new LogicTree(createFilterGroup));
  render(AdvancedItemHost, {
    props: { filter: makeFilter(searchResult), editor },
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
