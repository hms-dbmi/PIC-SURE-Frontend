// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

const discardListeners = vi.hoisted(() => [] as Array<() => (() => void) | void>);
vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: {
    user: {},
    ensureConsentsLoaded: vi.fn(),
    onQueryDiscard: (listener: () => (() => void) | void) => {
      discardListeners.push(listener);
      return () => discardListeners.splice(discardListeners.indexOf(listener), 1);
    },
  },
}));
vi.mock('#lib/explorer/Dictionary.ts', () => ({ getConceptDetails: vi.fn() }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  registerAssociatedStudies: vi.fn(),
  getPageContext: vi.fn(),
}));

import AdvancedFiltering from '#lib/explorer/advanced/AdvancedFiltering.svelte';
import { filterState } from '#lib/query/filters.svelte.ts';
import { createCategoricalFilter } from '#lib/query/filter.svelte.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';

/** Discards the query as a logout does. Returns what runs once the logout has navigated. */
function discardQuery() {
  const lifts = discardListeners.map((listener) => listener());
  return () => lifts.forEach((lift) => lift?.());
}

function deniedFilter(variable: string) {
  return createCategoricalFilter(
    {
      conceptPath: `\\denied-study\\${variable}\\`,
      name: variable,
      display: variable,
      type: 'Categorical',
      description: '',
      allowFiltering: true,
      dataset: 'denied-study',
      studyAcronym: 'DENIED',
      children: [],
    } as unknown as SearchResult,
    ['Yes'],
  );
}

function storedFilterCount() {
  return JSON.parse(sessionStorage.getItem('filterTree') ?? '{"children":[]}').children.length;
}

describe('advanced filtering after a forbidden logout', () => {
  beforeEach(() => {
    filterState.clear();
    filterState.add(deniedFilter('first'));
    filterState.add(deniedFilter('second'));
  });

  it('drops an unsaved draft so it cannot hold back the logout', async () => {
    const { component } = render(AdvancedFiltering);
    await fireEvent.click(screen.getAllByTitle('Remove Filter')[0]);
    expect(component.hasUnsavedChanges()).toBe(true);

    const lift = discardQuery();

    expect(component.hasUnsavedChanges()).toBe(false);
    lift();
  });

  it('does not save the denied filters again once the logout has finished', () => {
    const { component } = render(AdvancedFiltering);
    discardQuery()();

    component.applyChanges();

    expect(filterState.tree.root.children).toHaveLength(0);
    expect(storedFilterCount()).toBe(0);
  });
});
