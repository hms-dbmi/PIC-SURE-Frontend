import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import { request } from '#lib/api/client.ts';
import { getDistributions } from '#lib/api/picsure/visualization.ts';
import type { QueryJson } from '#lib/query/query.ts';

const respond = vi.mocked(request);
const query = { expectedResultType: 'COUNT' } as QueryJson;

beforeEach(() => respond.mockReset());

describe('getDistributions', () => {
  it.each([
    [false, 'picsure/visualization/auth/distributions'],
    [true, 'picsure/visualization/open/distributions'],
  ])('with openEndpoint %s posts to %s with open credentials', async (openEndpoint, path) => {
    respond.mockResolvedValue({});
    await getDistributions(query, { openEndpoint });

    expect(respond).toHaveBeenCalledWith(path, { method: 'POST', body: { query }, auth: 'open' });
  });

  it('reads a response without plot lists as no plots', async () => {
    respond.mockResolvedValue({ categoricalData: null });
    await expect(getDistributions(query, { openEndpoint: true })).resolves.toEqual({
      categoricalData: [],
      continuousData: [],
    });
  });
});
