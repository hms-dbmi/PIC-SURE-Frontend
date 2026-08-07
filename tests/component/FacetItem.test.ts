// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { fireEvent, render, screen } from '@testing-library/svelte';

import FacetItem from '$lib/components/explorer/FacetItem.svelte';
import { expandedNestedFacets } from '$lib/stores/NestedFacets';
import type { Facet } from '$lib/models/Search';
import type { DictionaryFacetResult } from '$lib/models/api/Dictionary';

vi.mock('$lib/stores/Search', async () => {
  const { writable } = await import('svelte/store');
  const selectedFacets = writable<Facet[]>([]);
  const updateFacets = vi.fn();
  return { default: { updateFacets, selectedFacets }, updateFacets, selectedFacets };
});

const facetCategory = {
  name: 'test-category',
  display: 'Test Category',
  description: '',
  facets: [],
} as DictionaryFacetResult;

const makeFacet = (name: string): Facet =>
  ({
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
  }) as Facet;

const renderFacetItem = (name = 'parent-facet') =>
  render(FacetItem, {
    facet: makeFacet(name),
    facetCategory,
    textFilterValue: '',
  });

describe('FacetItem nested facet expansion', () => {
  beforeEach(() => {
    expandedNestedFacets.set([]);
  });

  it('shows children and records the facet in expandedNestedFacets when the arrow is clicked', async () => {
    renderFacetItem();

    expect(screen.queryByTestId('facet-parent-facet-children')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('facet-parent-facet-arrow'));

    expect(screen.getByTestId('facet-parent-facet-children')).toBeInTheDocument();
    expect(screen.getByTestId('facet-parent-facet-child-1-label')).toBeInTheDocument();
    expect(get(expandedNestedFacets)).toContain('parent-facet');
  });

  it('keeps children expanded when the component remounts, as on a facet reload', async () => {
    const first = renderFacetItem();
    await fireEvent.click(screen.getByTestId('facet-parent-facet-arrow'));
    first.unmount();

    renderFacetItem();

    expect(screen.getByTestId('facet-parent-facet-children')).toBeInTheDocument();
  });

  it('ties expansion to the facet, not the component position in the list', async () => {
    // Facet lists rerender unkeyed, so after a selection reorders them a component
    // instance can receive a different facet. Expansion must follow the name.
    const view = renderFacetItem('parent-facet');
    await fireEvent.click(screen.getByTestId('facet-parent-facet-arrow'));
    expect(screen.getByTestId('facet-parent-facet-children')).toBeInTheDocument();

    await view.rerender({ facet: makeFacet('other-facet') });

    expect(screen.queryByTestId('facet-other-facet-children')).not.toBeInTheDocument();
    expect(get(expandedNestedFacets)).toEqual(['parent-facet']);
  });

  it('collapses children and removes the facet from expandedNestedFacets on a second click', async () => {
    expandedNestedFacets.set(['parent-facet']);
    renderFacetItem();

    expect(screen.getByTestId('facet-parent-facet-children')).toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('facet-parent-facet-arrow'));

    expect(screen.queryByTestId('facet-parent-facet-children')).not.toBeInTheDocument();
    expect(get(expandedNestedFacets)).not.toContain('parent-facet');
  });

  it('keeps an explicitly collapsed facet collapsed across a remount', async () => {
    expandedNestedFacets.set(['parent-facet']);
    const first = renderFacetItem();
    await fireEvent.click(screen.getByTestId('facet-parent-facet-arrow'));
    first.unmount();

    renderFacetItem();

    expect(screen.queryByTestId('facet-parent-facet-children')).not.toBeInTheDocument();
  });
});
