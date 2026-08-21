import { describe, it, expect, vi, beforeEach } from 'vitest';

// These assert at the fetch layer on purpose. What matters is the wire, not which argument produced it.
let mockPathname = '/discover';

vi.mock('$app/environment', () => ({
  get browser() {
    return true;
  },
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

vi.mock('$app/state', () => ({
  page: {
    get url() {
      return new URL(`http://localhost${mockPathname}`);
    },
  },
}));

const mockSearch = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable: w } = require('svelte/store') as typeof import('svelte/store');
  return { searchTermStore: w(''), selectedFacetsStore: w<unknown[]>([]) };
});

vi.mock('$lib/stores/Search', () => ({
  searchTerm: mockSearch.searchTermStore,
  selectedFacets: mockSearch.selectedFacetsStore,
}));

const mockUser = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable: w } = require('svelte/store') as typeof import('svelte/store');
  return {
    accessUnavailable: w(false),
    consentedStudies: w(['phs000001']),
    consentsSettled: vi.fn().mockResolvedValue(undefined),
    showAccessUnavailable: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
  };
});

vi.mock('$lib/stores/User', () => ({
  ACCESS_UNAVAILABLE_MESSAGE: 'unavailable',
  accessUnavailable: mockUser.accessUnavailable,
  consentedStudies: mockUser.consentedStudies,
  consentsSettled: mockUser.consentsSettled,
  showAccessUnavailable: mockUser.showAccessUnavailable,
  logout: mockUser.logout,
  login: mockUser.login,
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn((...args: unknown[]) => args),
  getSessionId: () => 'test-session-id',
}));

vi.mock('@sveltejs/kit', () => ({
  error: (status: number, message: string) => {
    throw new Error(`${status}: ${message}`);
  },
}));

import {
  searchDictionary,
  updateFacetsFromSearch,
  getConceptCount,
  getFacetCategoryCount,
} from '$lib/stores/Dictionary';
import { searchTerm, selectedFacets } from '$lib/stores/Search';

function jsonResponse(body: string) {
  const headers = new Map([['Content-Type', 'application/json']]);
  return {
    ok: true,
    status: 200,
    headers: { get: (k: string) => headers.get(k) ?? null },
    text: vi.fn().mockResolvedValue(body),
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

function sentHeaders() {
  return fetchMock.mock.calls[0][1].headers as Record<string, string>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname = '/discover';
  searchTerm.set('');
  selectedFacets.set([]);
  fetchMock = vi.fn().mockResolvedValue(jsonResponse('[]'));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (key === 'token' ? 'a-real-token' : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

describe('dictionary requests on the discover tab', () => {
  it('sends the facets request anonymously even though a token is stored', async () => {
    await updateFacetsFromSearch();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentHeaders()).not.toHaveProperty('Authorization');
    expect(sentHeaders()['request-source']).toBe('Open');
  });

  it('sends the concept search anonymously even though a token is stored', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"content":[],"totalElements":0}'));

    await searchDictionary('cancer', [], { pageNumber: 0, pageSize: 10 });

    expect(sentHeaders()).not.toHaveProperty('Authorization');
    expect(sentHeaders()['request-source']).toBe('Open');
  });

  it('still authenticates the same calls away from discover', async () => {
    mockPathname = '/explorer';

    await updateFacetsFromSearch();

    expect(sentHeaders()['Authorization']).toBe('Bearer a-real-token');
    expect(sentHeaders()['request-source']).toBe('Authorized');
  });
});

describe('open-access dictionary counts', () => {
  it('sends the concept count anonymously when open access is requested', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"totalElements":42}'));

    await getConceptCount(true);

    expect(sentHeaders()).not.toHaveProperty('Authorization');
  });

  it('sends the facet category count anonymously when open access is requested', async () => {
    await getFacetCategoryCount(true, 'study');

    expect(sentHeaders()).not.toHaveProperty('Authorization');
  });

  it('still authenticates the concept count when open access is NOT requested', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"totalElements":42}'));

    await getConceptCount(false);

    expect(sentHeaders()['Authorization']).toBe('Bearer a-real-token');
  });
});
