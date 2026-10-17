import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get as getStore } from 'svelte/store';

vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import { request } from '#lib/api/client.ts';
import { ApiError } from '#lib/api/errors.ts';
import {
  loadApiKeys,
  revokeApiKey,
  mintPlatformKey,
  listVersion,
  refreshApiKeys,
} from '#lib/admin/apiKeys/ApiKeys.ts';

const mockRequest = vi.mocked(request);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ApiKeys store', () => {
  it('loads a page of keys from the admin endpoint', async () => {
    const page = { keys: [], totalCount: 0, page: 2, size: 50 };
    mockRequest.mockResolvedValue(page);

    const result = await loadApiKeys(2, 50);

    expect(mockRequest).toHaveBeenCalledWith('psama/apiKey', {
      query: { page: 2, size: 50, keyType: undefined },
    });
    expect(result).toEqual(page);
  });

  it('defaults to page 0 with size 100', async () => {
    mockRequest.mockResolvedValue({ keys: [], totalCount: 0, page: 0, size: 100 });

    await loadApiKeys();

    expect(mockRequest).toHaveBeenCalledWith('psama/apiKey', {
      query: { page: 0, size: 100, keyType: undefined },
    });
  });

  it('revokes a key via PUT and bumps the list version', async () => {
    const revoked = { uuid: 'uuid-1', revokedAt: '2026-07-14T00:00:00Z' };
    mockRequest.mockResolvedValue(revoked);
    const before = getStore(listVersion);

    const result = await revokeApiKey('uuid-1');

    expect(mockRequest).toHaveBeenCalledWith('psama/apiKey/uuid-1/revoke', { method: 'PUT' });
    expect(result).toEqual(revoked);
    expect(getStore(listVersion)).toBe(before + 1);
  });

  it('mints a platform key via POST and bumps the list version', async () => {
    const minted = {
      apiKey: 'picsure_FAKE-TEST-FIXTURE-VALUE-0000000000000000000',
      uuid: 'uuid-2',
      displayPrefix: 'abc12345',
      keyType: 'PLATFORM',
      expiresAt: null,
    };
    mockRequest.mockResolvedValue(minted);
    const keyRequest = { name: 'Pipeline', email: 'ops@example.org' };
    const before = getStore(listVersion);

    const result = await mintPlatformKey(keyRequest);

    expect(mockRequest).toHaveBeenCalledWith('psama/apiKey/platform', {
      method: 'POST',
      body: keyRequest,
    });
    expect(result).toEqual(minted);
    expect(getStore(listVersion)).toBe(before + 1);
  });

  it('does not bump the list version when the mutation fails', async () => {
    mockRequest.mockRejectedValue(
      new ApiError(400, 'http', { message: 'unknown uuid' }, '{"message":"unknown uuid"}'),
    );
    const before = getStore(listVersion);

    await expect(revokeApiKey('bad-uuid')).rejects.toBeTruthy();

    expect(getStore(listVersion)).toBe(before);
  });

  it('refreshApiKeys increments the list version', () => {
    const before = getStore(listVersion);
    refreshApiKeys();
    expect(getStore(listVersion)).toBe(before + 1);
  });
});
