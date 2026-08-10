import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Writable } from 'svelte/store';

/**
 * The v3 `authorizationFilters` wire shape is pinned by server-side tests: an
 * ordered array of `{ conceptPath, values }`, one entry per consent path, with
 * empty paths OMITTED rather than sent as empty lists.
 *
 * The SOURCE of those values changed — the user's consents map from
 * `GET /psama/user/me/consents`, not a `categoryFilters` block dug out of the
 * deleted v2 query template — and the bytes on the wire did not. These tests
 * assert the serialized array exactly, so a reshape cannot pass unnoticed.
 */

const mockFeatures = vi.hoisted(() => ({
  requireConsents: true,
  explorer: { open: false },
  login: { open: false },
  federated: false,
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: mockFeatures, branding: {}, settings: {} },
}));
vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('$lib/toaster', () => ({ toaster: { add: vi.fn(), error: vi.fn() } }));

const stores = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {} as { user: Writable<any> };
});

vi.mock('$lib/stores/User', async () => {
  const { writable } = await import('svelte/store');
  stores.user = writable({});
  return { user: stores.user, isUserLoggedIn: () => true, logout: vi.fn(), login: vi.fn() };
});

import { getBlankQueryRequestV3 } from '$lib/utilities/QueryBuilder';
import type { QueryV3 } from '$lib/models/query/Query';

// One fixture, the shape PSAMA's BdcConsentsBuilder produces: every authorized
// consent under `\_consents\`, the harmonized subset and the genomic subset
// filed separately under their own concept paths.
const CONSENTS_FIXTURE = {
  '\\_consents\\': ['phs000007.c1', 'phs000007.c2', 'open_access-1000Genomes'],
  '\\_harmonized_consent\\': ['phs000007.c1'],
  '\\_topmed_consents\\': ['phs000007.c2'],
};

const HARMONIZED_CONCEPT = '\\DCC Harmonized data set\\demographic\\age\\';

function filtersOf(body: ReturnType<typeof getBlankQueryRequestV3>) {
  return JSON.stringify(body.authorizationFilters);
}

describe('v3 authorizationFilters', () => {
  beforeEach(() => {
    mockFeatures.requireConsents = true;
    stores.user.set({ consents: CONSENTS_FIXTURE });
  });

  it('emits all three paths, in order, when the query needs all three', () => {
    // Harmonized survives only with a harmonized concept in play; topmed only
    // with a genomic filter. This query has both, so nothing is trimmed.
    const body = getBlankQueryRequestV3(false, 'COUNT', (query: QueryV3) => {
      query.select = [HARMONIZED_CONCEPT];
      query.genomicFilters = [{ key: 'Gene_with_variant', values: ['CHD8'] }];
      return query;
    });

    expect(filtersOf(body)).toBe(
      '[' +
        '{"conceptPath":"\\\\_consents\\\\","values":["phs000007.c1","phs000007.c2","open_access-1000Genomes"]},' +
        '{"conceptPath":"\\\\_harmonized_consent\\\\","values":["phs000007.c1"]},' +
        '{"conceptPath":"\\\\_topmed_consents\\\\","values":["phs000007.c2"]}' +
        ']',
    );
  });

  it('trims harmonized and topmed for a plain phenotypic query', () => {
    const body = getBlankQueryRequestV3(false, 'COUNT');

    expect(filtersOf(body)).toBe(
      '[{"conceptPath":"\\\\_consents\\\\","values":["phs000007.c1","phs000007.c2","open_access-1000Genomes"]}]',
    );
  });

  it('keeps topmed for a genomic query and still drops harmonized', () => {
    const body = getBlankQueryRequestV3(false, 'COUNT', (query: QueryV3) => {
      query.genomicFilters = [{ key: 'Gene_with_variant', values: ['CHD8'] }];
      return query;
    });

    expect(filtersOf(body)).toBe(
      '[' +
        '{"conceptPath":"\\\\_consents\\\\","values":["phs000007.c1","phs000007.c2","open_access-1000Genomes"]},' +
        '{"conceptPath":"\\\\_topmed_consents\\\\","values":["phs000007.c2"]}' +
        ']',
    );
  });

  it('keeps harmonized when the harmonized concept is only in the phenotypic clause', () => {
    const body = getBlankQueryRequestV3(false, 'COUNT', (query: QueryV3) => {
      query.phenotypicClause = {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'REQUIRED',
        conceptPath: HARMONIZED_CONCEPT,
        not: false,
      };
      return query;
    });

    expect(JSON.parse(filtersOf(body)).map((f: { conceptPath: string }) => f.conceptPath)).toEqual([
      '\\_consents\\',
      '\\_harmonized_consent\\',
    ]);
  });

  it('emits no authorizationFilters at all for a user with no consents record', () => {
    // `{ userId, consents: {} }` — the answer PSAMA gives when nothing is stored.
    stores.user.set({ consents: {} });

    expect(filtersOf(getBlankQueryRequestV3(false, 'COUNT'))).toBe('[]');
  });

  it('emits no authorizationFilters when the user was never hydrated', () => {
    stores.user.set({});

    expect(filtersOf(getBlankQueryRequestV3(false, 'COUNT'))).toBe('[]');
  });

  it('omits a path whose list is empty rather than sending an empty values array', () => {
    stores.user.set({ consents: { '\\_consents\\': [], '\\_harmonized_consent\\': [] } });

    expect(filtersOf(getBlankQueryRequestV3(false, 'COUNT'))).toBe('[]');
  });

  it('omits a malformed path instead of sending a non-list through', () => {
    // `values` binds to List<String>; anything else 400s the whole query.
    stores.user.set({ consents: { '\\_consents\\': { phs000007: 'c1' } } });

    expect(filtersOf(getBlankQueryRequestV3(false, 'COUNT'))).toBe('[]');
  });

  it('adds nothing on the open-access path', () => {
    // Open/discover never authenticates, so it never has consents to send and
    // must not grow an authorization filter from a stale store.
    expect(filtersOf(getBlankQueryRequestV3(true, 'COUNT'))).toBe('[]');
  });

  it('adds nothing when consent enforcement is off', () => {
    mockFeatures.requireConsents = false;

    expect(filtersOf(getBlankQueryRequestV3(false, 'COUNT'))).toBe('[]');
  });
});
