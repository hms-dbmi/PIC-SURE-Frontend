import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import { request } from '#lib/api/client.ts';
import {
  countVariants,
  getQueryStatus,
  getSignedUrl,
  getVariantExcerpt,
  runSyncQuery,
} from '#lib/api/picsure/query.ts';
import type { QueryRequestBody } from '#lib/api/picsure/query.types.ts';

const respond = vi.mocked(request);
const query = { query: { expectedResultType: 'COUNT' } } as QueryRequestBody;

beforeEach(() => respond.mockReset());

describe('runSyncQuery', () => {
  it('sends open-access queries to the aggregate endpoint', async () => {
    respond.mockResolvedValue(1);
    await runSyncQuery(query, { openEndpoint: true });
    await runSyncQuery(query);
    expect(respond.mock.calls.map(([path]) => path)).toEqual([
      'picsure/hpds/open/query/sync',
      'picsure/hpds/auth/query/sync',
    ]);
  });
});

describe('variant results', () => {
  it('reads the variant count', async () => {
    respond.mockResolvedValue({ count: 12 });
    await expect(countVariants(query)).resolves.toBe(12);
  });

  it('rejects a count response without a number', async () => {
    respond.mockResolvedValue({ errorType: 'error', message: 'bad' });
    await expect(countVariants(query)).rejects.toThrow('Invalid variant count response');
  });

  it('rejects an excerpt that is not text', async () => {
    respond.mockResolvedValue({ errorType: 'error' });
    await expect(getVariantExcerpt(query)).rejects.toThrow('Invalid variant excerpt response');
  });
});

describe('export queries', () => {
  it('keeps only the status fields it understands', async () => {
    respond.mockResolvedValue({ picsureResultId: 'r1', status: 7, extra: true });
    await expect(getQueryStatus('r1', query)).resolves.toEqual({
      picsureResultId: 'r1',
      status: undefined,
    });
    expect(respond).toHaveBeenCalledWith('picsure/hpds/auth/query/r1/status', {
      method: 'POST',
      body: query,
      auth: 'open',
    });
  });

  it('answers null when the backend has no signed URL', async () => {
    respond.mockResolvedValue({ signedUrl: '' });
    await expect(getSignedUrl('r1', query)).resolves.toBeNull();
  });
});
