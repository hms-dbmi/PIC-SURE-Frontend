import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Writable } from 'svelte/store';

import type { Facet } from '$lib/models/Search';

/**
 * The dictionary service binds request bodies strictly
 * (`FAIL_ON_UNKNOWN_PROPERTIES`). Its top-level `Filter` record is tolerant,
 * but the NESTED `Facet` record — `Facet(name, display, description, fullName,
 * count, children, category, meta)` — is not, and `consents` binds to
 * `List<String>`. These tests pin what actually goes out on the wire, because
 * the frontend's `Facet` type carries UI-only members (`categoryRef`,
 * `parentRef`) that the server has never heard of and that used to 400 every
 * search with a facet selected.
 */

const mockPage = { url: new URL('http://localhost/explorer') };
vi.mock('$app/state', () => ({
  get page() {
    return mockPage;
  },
}));
vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn(), getSessionId: () => 'test' }));

// `vi.hoisted` runs before this file's imports, so the stores are built inside
// the (lazy, async) mock factories and handed back through this box. A
// `vi.resetModules()` re-runs the factories and replaces them, which is what
// the "warn once" case below needs.
const stores = vi.hoisted(() => {
  return {} as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: Writable<any>;
    consentedStudies: Writable<string[]>;
    accessUnavailable: Writable<boolean>;
    searchTerm: Writable<string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedFacets: Writable<any[]>;
  };
});

vi.mock('$lib/stores/User', async () => {
  const { writable } = await import('svelte/store');
  stores.user = writable(undefined);
  stores.consentedStudies = writable([]);
  stores.accessUnavailable = writable(false);
  return {
    user: stores.user,
    consentedStudies: stores.consentedStudies,
    accessUnavailable: stores.accessUnavailable,
    consentsSettled: () => Promise.resolve(),
    showAccessUnavailable: vi.fn(),
    ACCESS_UNAVAILABLE_MESSAGE: 'access unavailable',
    logout: vi.fn(),
    login: vi.fn(),
  };
});

vi.mock('$lib/stores/Search', async () => {
  const { writable } = await import('svelte/store');
  stores.searchTerm = writable('');
  stores.selectedFacets = writable([]);
  return { searchTerm: stores.searchTerm, selectedFacets: stores.selectedFacets };
});

import * as api from '$lib/api';
import { searchDictionary, toFacetFilter, updateFacetsFromSearch } from '$lib/stores/Dictionary';

const post = api.post as Mock;

/**
 * What the server actually receives: `api.post` JSON-stringifies its body, so
 * round-tripping is the only honest way to assert a key is absent rather than
 * merely undefined.
 */
function sentBody(call = 0): Record<string, unknown> {
  return JSON.parse(JSON.stringify(post.mock.calls[call][1]));
}

/** A facet exactly as `processFacetResults` leaves it in `selectedFacets`. */
const decoratedFacet: Facet = {
  name: 'phs000007',
  display: 'Framingham Heart Study',
  description: 'A study of cardiovascular disease',
  count: 4321,
  category: 'study_ids_dataset_ids',
  children: [
    {
      name: 'phs000007.v1',
      display: 'v1',
      description: 'version 1',
      count: 12,
      category: 'study_ids_dataset_ids',
    },
  ],
  categoryRef: {
    name: 'study_ids_dataset_ids',
    display: 'Study',
    description: 'The study a variable belongs to',
  },
  parentRef: {
    name: 'parent',
    display: 'Parent',
    description: 'The parent facet',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  post.mockResolvedValue({ results: [], total: 0 });
  stores.user.set(undefined);
  stores.consentedStudies.set([]);
  stores.accessUnavailable.set(false);
  stores.searchTerm.set('');
  stores.selectedFacets.set([]);
  mockPage.url = new URL('http://localhost/explorer');
});

describe('toFacetFilter', () => {
  it('keeps only the (name, category) filter key', () => {
    expect(toFacetFilter([decoratedFacet])).toEqual([
      { name: 'phs000007', category: 'study_ids_dataset_ids' },
    ]);
  });

  it('drops every member the server would reject, not just the ref back-pointers', () => {
    const keys = Object.keys(toFacetFilter([decoratedFacet])[0]).sort();
    expect(keys).toEqual(['category', 'name']);
  });

  it('tolerates an empty or absent list', () => {
    expect(toFacetFilter([])).toEqual([]);
    expect(toFacetFilter()).toEqual([]);
  });
});

describe('outbound facets', () => {
  it('POST /dictionary/concepts sends exactly {name, category} per facet', async () => {
    await searchDictionary('heart', [decoratedFacet], { pageNumber: 0, pageSize: 10 });

    const body = sentBody();
    expect(body.facets).toEqual([{ name: 'phs000007', category: 'study_ids_dataset_ids' }]);
    // Absent, not undefined: these are the members that 400 the request.
    const facet = (body.facets as Record<string, unknown>[])[0];
    expect(facet).not.toHaveProperty('categoryRef');
    expect(facet).not.toHaveProperty('parentRef');
    expect(facet).not.toHaveProperty('count');
    expect(facet).not.toHaveProperty('display');
    expect(facet).not.toHaveProperty('description');
    expect(facet).not.toHaveProperty('children');
  });

  it('POST /dictionary/facets sends exactly {name, category} per selected facet', async () => {
    post.mockResolvedValue([]);
    stores.selectedFacets.set([decoratedFacet]);
    stores.searchTerm.set('heart');

    await updateFacetsFromSearch();

    const facet = (sentBody().facets as Record<string, unknown>[])[0];
    expect(Object.keys(facet).sort()).toEqual(['category', 'name']);
  });

  it('does not mutate the facet held in the store', async () => {
    await searchDictionary('heart', [decoratedFacet], { pageNumber: 0, pageSize: 10 });

    expect(decoratedFacet.categoryRef).toBeDefined();
    expect(decoratedFacet.count).toBe(4321);
  });
});
