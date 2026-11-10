import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({
  resolve: (path: string) => (path.startsWith('/') ? path : `/${path}`),
}));

import { resultProviders, type QueryCountProvider } from '#lib/query/counts/providers.ts';
import type { QueryDescriptor } from '#lib/query/descriptor.svelte.ts';

const descriptor: QueryDescriptor = {
  isOpenAccess: false,
  phenotypicClause: null,
  genomicFilters: [],
};

describe('query:patientCount provider', () => {
  const provider: QueryCountProvider = resultProviders['query:patientCount'];

  it('builds a COUNT request for the auth (non-open) path', () => {
    const req = provider.buildRequest(descriptor);
    expect(req).not.toHaveProperty('resourceUUID');
    expect(req.query.expectedResultType).toBe('COUNT');
  });

  it('builds a CROSS_COUNT request for the open-access path', () => {
    const openDescriptor: QueryDescriptor = { ...descriptor, isOpenAccess: true };
    const req = provider.buildRequest(openDescriptor);
    expect(req).not.toHaveProperty('resourceUUID');
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

  it('openEndpoint() is false for an authed descriptor (default features)', () => {
    expect(provider.openEndpoint(descriptor)).toBe(false);
  });

  it('openEndpoint() picks the aggregate endpoint for an open-access descriptor', () => {
    expect(provider.openEndpoint({ ...descriptor, isOpenAccess: true })).toBe(true);
  });
});
