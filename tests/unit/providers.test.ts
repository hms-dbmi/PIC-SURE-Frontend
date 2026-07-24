import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import { resultProviders, type CountProvider } from '$lib/services/counts/providers';
import type { QueryDescriptor } from '$lib/services/counts/queryDescriptor.svelte';

const descriptor: QueryDescriptor = {
  isOpenAccess: false,
  phenotypicClause: null,
  genomicFilters: [],
};

describe('resultProviders registry', () => {
  it('contains the patientCount provider keyed by id', () => {
    expect(Object.keys(resultProviders).sort()).toEqual(['query:patientCount']);
  });

  it('each provider has id, path, buildRequest, parse', () => {
    for (const provider of Object.values(resultProviders)) {
      expect(typeof provider.id).toBe('string');
      expect(typeof provider.path).toBe('function');
      expect(typeof provider.buildRequest).toBe('function');
      expect(typeof provider.parse).toBe('function');
    }
  });
});

describe('query:patientCount provider', () => {
  const provider: CountProvider = resultProviders['query:patientCount'];

  it('builds a COUNT request for the auth (non-open) path', () => {
    const req = provider.buildRequest(descriptor, 'res-1');
    expect(req.resourceUUID).toBe('res-1');
    expect(req.query.expectedResultType).toBe('COUNT');
  });

  it('builds a CROSS_COUNT request for the open-access path', () => {
    const openDescriptor: QueryDescriptor = { ...descriptor, isOpenAccess: true };
    const req = provider.buildRequest(openDescriptor, 'res-open');
    expect(req.query.expectedResultType).toBe('CROSS_COUNT');
  });

  it('parse() returns the raw scalar count for auth COUNT responses', () => {
    expect(provider.parse(1234)).toBe(1234);
    expect(provider.parse('< 10')).toBe('< 10');
  });

  it('parse() reduces the open-access cross-count map via the _studies_consents_ key', () => {
    expect(provider.parse({ '\\_studies_consents\\': 1234 })).toBe(1234);
  });

  it('parse() returns 0 when the open-access response is missing the _studies_consents_ key', () => {
    expect(provider.parse({})).toBe(0);
  });

  it('parse() coerces a null _studies_consents_ to 0 (regression guard against ?? vs !== undefined)', () => {
    expect(provider.parse({ '\\_studies_consents\\': null as never })).toBe(0);
  });

  it('path() returns Picsure.QueryV3Sync for an authed descriptor (default features)', () => {
    expect(provider.path(descriptor)).toMatch(/query\/sync$/);
  });
});
