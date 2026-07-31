import { describe, it, expect, vi, beforeEach } from 'vitest';

import queryStatusResponse from '../fixtures/contracts/query-status-response.json';
import signedUrlResponse from '../fixtures/contracts/signed-url-response.json';
import searchRequest from '../fixtures/contracts/search-request.json';
import paginatedResponse from '../fixtures/contracts/paginated-response.json';
import dispatchResponse from '../fixtures/contracts/dispatch-response.json';

const mockFeatures = vi.hoisted(() => ({
  requireConsents: false,
  useQueryTemplate: false,
  explorer: { open: false },
  login: { open: false },
  federated: false,
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/configuration', () => ({ features: mockFeatures, branding: {}, settings: {} }));
vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('$lib/toaster', () => ({ toaster: { add: vi.fn(), error: vi.fn() } }));

import { getBlankQueryRequestV3, getQueryRequestV3 } from '$lib/utilities/QueryBuilder';
import { Picsure } from '$lib/paths';
import type { QueryStatusResponse, SignedUrlResponse } from '$lib/models/api/QueryStatus';
import type { DictionaryConceptResult } from '$lib/models/api/Dictionary';
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
  const status: QueryStatusResponse = queryStatusResponse as unknown as QueryStatusResponse;

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
  it('is an object, not the bare URL string it used to be', () => {
    const res: SignedUrlResponse = signedUrlResponse as SignedUrlResponse;
    expect(typeof signedUrlResponse).toBe('object');
    expect(Object.keys(signedUrlResponse)).toEqual(['signedUrl']);
    expect(res.signedUrl).toMatch(/^https:\/\//);
  });
});

describe('SearchRequest', () => {
  it('is a single free-text query member', () => {
    const req: SearchRequest = searchRequest as SearchRequest;
    expect(Object.keys(searchRequest)).toEqual(['query']);
    expect(typeof req.query).toBe('string');
  });
});

describe('PaginatedResponse', () => {
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

  it('is what the dictionary concept result reads', () => {
    const page = paginatedResponse as unknown as DictionaryConceptResult;
    expect(page.results).toHaveLength(page.total);
    expect(page.page).toBe(0); // /concepts is ZERO-based
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
    mockFeatures.useQueryTemplate = false;
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

describe('HPDS routes are all /v3', () => {
  it('routes open-access queries through /hpds/open/v3', () => {
    // The non-versioned aliases were deleted server-side, open access included.
    expect(Picsure.QueryOpenSync).toBe('picsure/hpds/open/v3/query/sync');
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
