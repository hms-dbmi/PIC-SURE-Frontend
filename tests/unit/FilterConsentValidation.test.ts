import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { explorer: { open: false }, login: { open: false }, discover: false } },
  routes: [],
  resetConfig: () => {},
}));
vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('$lib/toaster', () => ({ toaster: { error: vi.fn() }, isToastShowing: () => false }));
vi.mock('$lib/stores/Dictionary', () => ({ getConceptDetails: vi.fn() }));

import { user, tokenStatus } from '$lib/stores/User';
import type { ConsentsMap } from '$lib/models/User';
import {
  addFilter,
  clearFilters,
  filters,
  genomicFilters,
  hasInvalidFilter,
  removeInvalidFilters,
} from '$lib/stores/Filter';
import { createCategoricalFilter, createGenomicFilter } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

function filterOn(dataset: string) {
  return createCategoricalFilter(
    {
      conceptPath: `\\${dataset}\\variable\\`,
      dataset,
      name: 'variable',
      display: 'variable',
      studyAcronym: dataset,
      description: '',
      type: 'Categorical',
      allowFiltering: true,
      children: [],
    } as SearchResult,
    ['value'],
  );
}

const genomicFilter = () =>
  createGenomicFilter({ Gene_with_variant: ['CHD8'], Variant_consequence_calculated: [] });

function loggedInWith(consents: ConsentsMap | undefined) {
  tokenStatus.set(true);
  user.set({ uuid: '1234', email: 'test@pic-sure.org', consents });
}

const datasetsOf = () => get(filters).map((filter) => filter.dataset);

beforeEach(() => {
  clearFilters();
  tokenStatus.set(false);
  user.set({});
});

describe('hasInvalidFilter', () => {
  it('flags a filter on a study the user holds no consent group for', () => {
    loggedInWith({ '\\_consents\\': ['phs999901.c1'] });
    addFilter(filterOn('phs999902'));

    expect(get(hasInvalidFilter)).toBe(true);
  });

  it('accepts a filter on a study the user holds a consent group for', () => {
    loggedInWith({ '\\_consents\\': ['phs999901.c1', 'phs999901.c3'] });
    addFilter(filterOn('phs999901'));

    expect(get(hasInvalidFilter)).toBe(false);
  });

  it('accepts a filter on a study granted with no consent group attached', () => {
    loggedInWith({ '\\_consents\\': ['Synthea'] });
    addFilter(filterOn('Synthea'));

    expect(get(hasInvalidFilter)).toBe(false);
  });

  it('does not accept a study whose accession is a prefix of a consented one', () => {
    loggedInWith({ '\\_consents\\': ['phs999901.c1'] });
    addFilter(filterOn('phs99990'));

    expect(get(hasInvalidFilter)).toBe(true);
  });

  it('stays silent while the consents map has not loaded', () => {
    loggedInWith(undefined);
    addFilter(filterOn('phs999902'));

    expect(get(hasInvalidFilter)).toBe(false);
  });

  it('stays silent without a token, even with a consents map left in the store', () => {
    user.set({ consents: { '\\_consents\\': ['phs999901.c1'] } });
    tokenStatus.set(false);
    addFilter(filterOn('phs999902'));

    expect(get(hasInvalidFilter)).toBe(false);
  });

  it('stays silent when there are no filters at all', () => {
    loggedInWith({ '\\_consents\\': [] });

    expect(get(hasInvalidFilter)).toBe(false);
  });
});

describe('removeInvalidFilters', () => {
  it('removes only the filters on studies the user holds no consent for', () => {
    loggedInWith({ '\\_consents\\': ['phs999901.c1'] });
    addFilter(filterOn('phs999901'));
    addFilter(filterOn('phs999902'));

    removeInvalidFilters();

    expect(datasetsOf()).toEqual(['phs999901']);
  });

  it('keeps every filter when the consents map has not loaded', () => {
    loggedInWith(undefined);
    addFilter(filterOn('phs999901'));
    addFilter(filterOn('phs999902'));

    removeInvalidFilters();

    expect(datasetsOf()).toEqual(['phs999901', 'phs999902']);
  });

  it('removes genomic filters when the user holds no topmed consent', () => {
    loggedInWith({ '\\_consents\\': ['phs999901.c1'] });
    addFilter(genomicFilter());

    removeInvalidFilters();

    expect(get(genomicFilters)).toEqual([]);
  });

  it('keeps genomic filters when the user holds a topmed consent', () => {
    loggedInWith({
      '\\_consents\\': ['phs999902.c1'],
      '\\_topmed_consents\\': ['phs999902.c1'],
    });
    addFilter(genomicFilter());

    removeInvalidFilters();

    expect(get(genomicFilters)).toHaveLength(1);
  });
});
