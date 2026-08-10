import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import { getBlankQueryRequestV2, getBlankQueryRequestV3 } from '$lib/utilities/QueryBuilder';

describe('query request envelopes', () => {
  it('builds V2 requests without resourceUUID', () => {
    expect(getBlankQueryRequestV2()).not.toHaveProperty('resourceUUID');
  });

  it('builds V3 requests without resourceUUID', () => {
    expect(getBlankQueryRequestV3()).not.toHaveProperty('resourceUUID');
  });
});
