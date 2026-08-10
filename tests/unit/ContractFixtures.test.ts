import { describe, it, expect, vi, beforeEach } from 'vitest';

import queryStatusResponse from '../fixtures/contracts/query-status-response.json';
import signedUrlResponse from '../fixtures/contracts/signed-url-response.json';
import searchRequest from '../fixtures/contracts/search-request.json';
import paginatedResponse from '../fixtures/contracts/paginated-response.json';
import dispatchResponse from '../fixtures/contracts/dispatch-response.json';
import userConsentsResponse from '../fixtures/contracts/user-consents-response.json';

const mockFeatures = vi.hoisted(() => ({
  requireConsents: false,
  explorer: { open: false },
  login: { open: false },
  federated: false,
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: mockFeatures, branding: {}, settings: {} },
}));
vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('$lib/toaster', () => ({ toaster: { add: vi.fn(), error: vi.fn() } }));

import { getBlankQueryRequestV3, getQueryRequestV3 } from '$lib/utilities/QueryBuilder';
import { Picsure } from '$lib/paths';
import type {
  PaginatedResponse,
  QueryStatus,
  QueryStatusResponse,
  SignedUrlResponse,
} from '$lib/models/api/QueryStatus';
import type { DictionaryConceptResult } from '$lib/models/api/Dictionary';
import {
  CONSENTS_PATH,
  HARMONIZED_CONSENTS_PATH,
  TOPMED_CONSENTS_PATH,
  consentValues,
  type UserConsentsResponse,
} from '$lib/models/UserConsents';
import type { SearchRequest } from '$lib/models/api/Dictionary';

/**
 * The JSON under `tests/fixtures/contracts/` is copied verbatim from the
 * server monorepo's `pic-sure-contracts` test resources — the same bytes the
 * Java contract tests and the Python adapter's shape tests read. These
 * assertions fail the moment the frontend's hand-written models and the
 * server disagree about a wire shape.
 */

// Member names the v3 Query record declares (docs/api/*.openapi.json ->
// components.schemas.Query). The server deserializes STRICTLY, so anything
// outside this set is a 400 and the client must never emit it.
const V3_QUERY_FIELDS = [
  'authorizationFilters',
  'expectedResultType',
  'genomicFilters',
  'id',
  'phenotypicClause',
  'picsureId',
  'select',
];

describe('QueryStatusResponse', () => {
  // A real typed binding, not a double cast: every member of the fixture is
  // checked against the hand-written model, so svelte-check fails if either
  // side drifts. Only `status` is narrowed — importing JSON widens its string
  // literal, which no assertion here can recover — and the runtime check below
  // covers exactly that field.
  const status: QueryStatusResponse = {
    ...queryStatusResponse,
    status: queryStatusResponse.status as QueryStatus,
  };

  it('has exactly the contract fields', () => {
    expect(Object.keys(queryStatusResponse).sort()).toEqual(
      [
        'duration',
        'expiration',
        'picsureId',
        'resourceResultId',
        'resourceStatus',
        'resultMetadata',
        'sizeInBytes',
        'startTime',
        'status',
      ].sort(),
    );
  });

  it('drops the retired id fields', () => {
    // picsureResultId was renamed to picsureId; resourceID is gone entirely.
    expect(queryStatusResponse).not.toHaveProperty('picsureResultId');
    expect(queryStatusResponse).not.toHaveProperty('resourceID');
  });

  it('parses into the hand-written model', () => {
    expect(typeof status.picsureId).toBe('string');
    expect(status.picsureId).toBeTruthy();
    expect(typeof status.sizeInBytes).toBe('number');
    expect(typeof status.startTime).toBe('number');
  });

  it('reports one of the four real status values', () => {
    // 'SUCCESS' was never a real value and must not be polled for.
    expect(['QUEUED', 'PENDING', 'ERROR', 'AVAILABLE']).toContain(status.status);
  });

  it('keeps resourceResultId distinct from the PIC-SURE id', () => {
    // resourceResultId belongs to the BACKING RESOURCE and must never be used
    // as the /query/{id} path parameter.
    expect(status.resourceResultId).not.toEqual(status.picsureId);
  });
});

describe('SignedUrlResponse', () => {
  const res: SignedUrlResponse = signedUrlResponse;

  it('is an object, not the bare URL string it used to be', () => {
    expect(typeof signedUrlResponse).toBe('object');
    expect(Object.keys(signedUrlResponse)).toEqual(['signedUrl']);
    expect(res.signedUrl).toMatch(/^https:\/\//);
  });
});

describe('SearchRequest', () => {
  const req: SearchRequest = searchRequest;

  it('is a single free-text query member', () => {
    expect(Object.keys(searchRequest)).toEqual(['query']);
    expect(typeof req.query).toBe('string');
  });
});

describe('PaginatedResponse', () => {
  // Typed binding against the generic envelope — this fixture is the shared
  // paging record, not a dictionary page, so its `results` stay generic.
  const page: PaginatedResponse<{ id: string; name: string }> = paginatedResponse;

  it('has exactly results / page / total', () => {
    expect(Object.keys(paginatedResponse).sort()).toEqual(['page', 'results', 'total']);
  });

  it('carries no Spring Page field', () => {
    for (const retired of [
      'content',
      'totalElements',
      'totalPages',
      'number',
      'numberOfElements',
      'first',
      'last',
      'empty',
      'pageable',
      'sort',
    ]) {
      expect(paginatedResponse).not.toHaveProperty(retired);
    }
  });

  it('reports a total consistent with the page it carries', () => {
    // No assertion on the VALUE of `page`: the base is defined by the serving
    // endpoint, not by this record (the dictionary's /concepts is 0-based,
    // HPDS's /search/values is 1-based), so a regen with page:1 is not drift.
    expect(page.results).toHaveLength(page.total);
    expect(typeof page.page).toBe('number');
  });

  it('is the envelope the dictionary concept result reads', () => {
    // Type-level: the paging members carry straight into the dictionary's own
    // result type, so a drift back to the Spring Page shape fails to compile.
    const conceptPage: DictionaryConceptResult = { ...paginatedResponse, results: [] };
    expect(conceptPage.total).toBe(page.total);
    expect(conceptPage.page).toBe(page.page);
  });
});

describe('dispatch queryJson', () => {
  it('serializes the bare query, with no envelope', () => {
    const inner = JSON.parse(dispatchResponse.queryJson);
    expect(inner).not.toHaveProperty('query');
    expect(inner).not.toHaveProperty('resourceUUID');
    expect(inner).not.toHaveProperty('resourceCredentials');
    expect(inner.expectedResultType).toBe('COUNT');
  });
});

describe('the query request body is the bare v3 Query', () => {
  beforeEach(() => {
    mockFeatures.requireConsents = false;
  });

  it('has no { query, resourceUUID } envelope', () => {
    const body = getBlankQueryRequestV3(false, 'COUNT');
    expect(body).not.toHaveProperty('query');
    expect(body).not.toHaveProperty('resourceUUID');
    expect(body.expectedResultType).toBe('COUNT');
  });

  it('has no registry-era or federation members', () => {
    const body = getBlankQueryRequestV3(false, 'DATAFRAME');
    for (const retired of [
      'resourceUUID',
      'resourceCredentials',
      '@type',
      'commonAreaUUID',
      'institutionOfOrigin',
      'requesterEmail',
    ]) {
      expect(body).not.toHaveProperty(retired);
    }
  });

  it('emits only members the v3 Query record declares', () => {
    // Strict deserialization: an unknown member is a 400.
    const body = getQueryRequestV3(false, 'COUNT');
    expect(Object.keys(body).filter((k) => !V3_QUERY_FIELDS.includes(k))).toEqual([]);
  });

  it('strips the client-only clause discriminator', () => {
    // `type` tags PhenotypicFilter vs PhenotypicSubquery for the UI only; the
    // server infers clause kind structurally and rejects the extra member.
    const body = getQueryRequestV3(false, 'COUNT');
    expect(JSON.stringify(body)).not.toContain('"type"');
  });
});

describe('UserConsentsResponse', () => {
  // A real typed binding, not a cast: the fixture is checked member by member
  // against the hand-written model, so svelte-check fails if either side drifts.
  const consents: UserConsentsResponse = userConsentsResponse;

  it('has exactly the contract fields', () => {
    // Two keys. The response used to be PSAMA's `user_consents` JPA entity,
    // which also shipped the persisted row's own `uuid`; that is storage, not
    // answer, and reading it would bind this client to PSAMA's schema.
    expect(Object.keys(userConsentsResponse).sort()).toEqual(['consents', 'userId']);
    expect(userConsentsResponse).not.toHaveProperty('uuid');
  });

  it('is keyed by the concept paths BdcConsentsBuilder writes, byte for byte', () => {
    // The client's constants are the only thing that reaches into this map. A
    // drift on either side reads as "no consents" and silently drops every
    // authorization filter rather than failing.
    expect(Object.keys(consents.consents ?? {}).sort()).toEqual(
      [CONSENTS_PATH, HARMONIZED_CONSENTS_PATH, TOPMED_CONSENTS_PATH].sort(),
    );
  });

  it('parses each concept path through the real helper, identifiers verbatim', () => {
    // Consent ids are matched against dictionary values and put into a v3
    // query's authorizationFilters as-is — never parsed or reformatted.
    expect(consentValues(consents.consents, CONSENTS_PATH)).toEqual([
      'phs000007.c1',
      'phs000179.c2',
      'open_access-1000Genomes',
    ]);
    expect(consentValues(consents.consents, HARMONIZED_CONSENTS_PATH)).toEqual(['phs000007.c1']);
    expect(consentValues(consents.consents, TOPMED_CONSENTS_PATH)).toEqual([
      'phs000179.c2',
      'open_access-1000Genomes',
    ]);
  });

  it('reads an unknown concept path as nothing authorized, not as an error', () => {
    // The server documents its keys as KNOWN, not exhaustive.
    expect(consentValues(consents.consents, '\\_future_consent\\')).toEqual([]);
  });
});

describe('HPDS routes are all /v3', () => {
  it('routes open-access queries through /hpds/open/v3', () => {
    // The non-versioned aliases were deleted server-side, open access included.
    expect(Picsure.QueryOpenV3Sync).toBe('picsure/hpds/open/v3/query/sync');
  });

  it('routes genomic value search through /hpds/auth/v3', () => {
    expect(Picsure.SearchValues).toBe('picsure/hpds/auth/v3/search/values');
  });

  it('no longer exposes the deleted v1 query/search constants', () => {
    const picsure = Picsure as Record<string, unknown>;
    expect(picsure.QueryV2).toBeUndefined();
    expect(picsure.QueryV2Sync).toBeUndefined();
    expect(picsure.Search).toBeUndefined();
  });
});
