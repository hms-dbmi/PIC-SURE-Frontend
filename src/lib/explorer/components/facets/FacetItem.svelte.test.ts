// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import FacetItem from '#lib/explorer/components/facets/FacetItem.svelte';
import { explorerSearch, nestedFacetKey } from '#lib/explorer/search.svelte.ts';
import type { Facet, DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/explorer/Dictionary.ts', () => ({
  searchDictionary: vi.fn(),
  searchFacets: vi.fn(),
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));

const facetCategory: DictionaryFacetResult = {
  name: 'test-category',
  display: 'Test Category',
  description: '',
  facets: [],
};

const makeFacet = (name: string): Facet => ({
  name,
  display: `${name} display`,
  description: '',
  count: 10,
  category: 'test-category',
  children: [
    {
      name: `${name}-child-1`,
      display: `${name} child 1`,
      description: '',
      count: 6,
      category: 'test-category',
    },
    {
      name: `${name}-child-2`,
      display: `${name} child 2`,
      description: '',
      count: 4,
      category: 'test-category',
    },
  ],
});

const renderFacetItem = (name = 'parent-facet') =>
  render(FacetItem, {
    facet: makeFacet(name),
    facetCategory,
    textFilterValue: '',
  });

describe('FacetItem nested facet expansion', () => {
  beforeEach(() => {
    explorerSearch.setFacets([]);
    explorerSearch.collapseNestedFacets();
  });

  it('shows children and records the facet in expandedNestedFacets when the arrow is clicked', async () => {
    renderFacetItem();

    expect(screen.queryByTestId('explorer-facet-children-parent-facet')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('explorer-facet-toggle-parent-facet'));

    expect(screen.getByTestId('explorer-facet-children-parent-facet')).toBeInTheDocument();
    expect(screen.getByTestId('explorer-facet-label-parent-facet-child-1')).toBeInTheDocument();
    expect(explorerSearch.expandedNestedFacets).toContain(
      nestedFacetKey('test-category', 'parent-facet'),
    );
  });

  it('keeps children expanded when the component remounts, as on a facet reload', async () => {
    const first = renderFacetItem();
    await fireEvent.click(screen.getByTestId('explorer-facet-toggle-parent-facet'));
    first.unmount();

    renderFacetItem();

    expect(screen.getByTestId('explorer-facet-children-parent-facet')).toBeInTheDocument();
  });

  it('updates expansion when the facet prop changes', async () => {
    const view = renderFacetItem('parent-facet');
    await fireEvent.click(screen.getByTestId('explorer-facet-toggle-parent-facet'));
    expect(screen.getByTestId('explorer-facet-children-parent-facet')).toBeInTheDocument();

    await view.rerender({ facet: makeFacet('other-facet') });

    expect(screen.queryByTestId('explorer-facet-children-other-facet')).not.toBeInTheDocument();
    expect(explorerSearch.expandedNestedFacets).toEqual([
      nestedFacetKey('test-category', 'parent-facet'),
    ]);
  });

  it('keys expansion by category, so a same-named facet in another category stays collapsed', async () => {
    explorerSearch.toggleNestedFacet(nestedFacetKey('some-other-category', 'parent-facet'));
    renderFacetItem();

    expect(screen.queryByTestId('explorer-facet-children-parent-facet')).not.toBeInTheDocument();
  });

  it('collapses children and removes the facet from expandedNestedFacets on a second click', async () => {
    explorerSearch.toggleNestedFacet(nestedFacetKey('test-category', 'parent-facet'));
    renderFacetItem();

    expect(screen.getByTestId('explorer-facet-children-parent-facet')).toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('explorer-facet-toggle-parent-facet'));

    expect(screen.queryByTestId('explorer-facet-children-parent-facet')).not.toBeInTheDocument();
    expect(explorerSearch.expandedNestedFacets).not.toContain(
      nestedFacetKey('test-category', 'parent-facet'),
    );
  });

  it('keeps an explicitly collapsed facet collapsed across a remount', async () => {
    explorerSearch.toggleNestedFacet(nestedFacetKey('test-category', 'parent-facet'));
    const first = renderFacetItem();
    await fireEvent.click(screen.getByTestId('explorer-facet-toggle-parent-facet'));
    first.unmount();

    renderFacetItem();

    expect(screen.queryByTestId('explorer-facet-children-parent-facet')).not.toBeInTheDocument();
  });
});
