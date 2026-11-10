import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import { request } from '#lib/api/client.ts';
import { createConfigRow, getConfigRows } from '#lib/api/picsure/configuration.ts';

const respond = vi.mocked(request);

beforeEach(() => respond.mockReset());

describe('configuration', () => {
  it('reads one kind of rows', async () => {
    const row = { uuid: 'u1', name: 'flag', value: 'true' };
    respond.mockResolvedValue([row]);

    await expect(getConfigRows('ui:featureFlag')).resolves.toEqual([row]);
    expect(respond).toHaveBeenCalledWith('picsure/operations/configuration', {
      query: { kind: 'ui:featureFlag' },
      auth: 'open',
    });
  });

  it('rejects a saved row that comes back without its value', async () => {
    respond.mockResolvedValue({ errorType: 'error', message: 'invalid' });
    await expect(createConfigRow({ name: 'flag', kind: 'k', value: 'x' })).rejects.toThrow(
      'Invalid configuration response',
    );
  });
});
