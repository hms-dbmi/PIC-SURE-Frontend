import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import { request } from '#lib/api/client.ts';
import { getDistributions } from '#lib/api/picsure/visualization.ts';
import type { QueryInterfaceV3 } from '#lib/query/query.ts';

const respond = vi.mocked(request);
const query = { expectedResultType: 'COUNT' } as QueryInterfaceV3;

beforeEach(() => respond.mockReset());

describe('getDistributions', () => {
  it('picks the endpoint and the credentials separately', async () => {
    respond.mockResolvedValue({});
    await getDistributions(query, { openEndpoint: false, anonymous: true });

    expect(respond).toHaveBeenCalledWith('picsure/visualization/auth/distributions', {
      method: 'POST',
      body: { query },
      auth: 'anonymous',
    });
  });

  it('reads a response without plot lists as no plots', async () => {
    respond.mockResolvedValue({ categoricalData: null });
    await expect(
      getDistributions(query, { openEndpoint: true, anonymous: false }),
    ).resolves.toEqual({ categoricalData: [], continuousData: [] });
  });
});
