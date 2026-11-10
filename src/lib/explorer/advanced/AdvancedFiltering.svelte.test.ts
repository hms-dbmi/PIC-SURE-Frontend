// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/auth/User.ts', () => ({
  user: { subscribe: (run: (user: object) => void) => (run({}), () => {}) },
  ensureConsentsLoaded: vi.fn(),
}));
vi.mock('#lib/explorer/Dictionary.ts', () => ({ getConceptDetails: vi.fn() }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  registerAssociatedStudies: vi.fn(),
  getPageContext: vi.fn(),
}));

import AdvancedFiltering from '#lib/explorer/advanced/AdvancedFiltering.svelte';
import { discardingQuery } from '#lib/auth/discardingQuery.ts';
import { addFilter, clearFilters, filterTree } from '#lib/query/filters.ts';
import { createCategoricalFilter } from '#lib/query/filter.svelte.ts';
import type { SearchResult } from '#lib/explorer/types.ts';

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
    discardingQuery.set(false);
    clearFilters();
    addFilter(deniedFilter('first'));
    addFilter(deniedFilter('second'));
  });

  it('drops an unsaved draft so it cannot hold back the logout', async () => {
    const { component } = render(AdvancedFiltering);
    await fireEvent.click(screen.getAllByTitle('Remove Filter')[0]);
    expect(component.hasUnsavedChanges()).toBe(true);

    discardingQuery.set(true);

    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('does not save the denied filters again once the logout has finished', () => {
    const { component } = render(AdvancedFiltering);
    discardingQuery.set(true);
    discardingQuery.set(false);

    component.applyChanges();

    expect(get(filterTree).root.children).toHaveLength(0);
    expect(storedFilterCount()).toBe(0);
  });
});
