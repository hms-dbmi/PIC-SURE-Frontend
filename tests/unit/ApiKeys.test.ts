import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get as getStore } from 'svelte/store';

vi.mock('$lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

import * as api from '$lib/api';
import {
  loadApiKeys,
  revokeApiKey,
  mintPlatformKey,
  listVersion,
  refreshApiKeys,
} from '$lib/stores/ApiKeys';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ApiKeys store', () => {
  it('loads a page of keys from the admin endpoint', async () => {
    const page = { keys: [], totalCount: 0, page: 2, size: 50 };
    mockGet.mockResolvedValue(page);

    const result = await loadApiKeys(2, 50);

    expect(mockGet).toHaveBeenCalledWith('psama/apiKey?page=2&size=50');
    expect(result).toEqual(page);
  });

  it('defaults to page 0 with size 100', async () => {
    mockGet.mockResolvedValue({ keys: [], totalCount: 0, page: 0, size: 100 });

    await loadApiKeys();

    expect(mockGet).toHaveBeenCalledWith('psama/apiKey?page=0&size=100');
  });

  it('revokes a key via PUT and bumps the list version', async () => {
    const revoked = { uuid: 'uuid-1', revokedAt: '2026-07-14T00:00:00Z' };
    mockPut.mockResolvedValue(revoked);
    const before = getStore(listVersion);

    const result = await revokeApiKey('uuid-1');

    expect(mockPut).toHaveBeenCalledWith('psama/apiKey/uuid-1/revoke', undefined);
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
    mockPost.mockResolvedValue(minted);
    const request = { name: 'Pipeline', email: 'ops@example.org' };
    const before = getStore(listVersion);

    const result = await mintPlatformKey(request);

    expect(mockPost).toHaveBeenCalledWith('psama/apiKey/platform', request);
    expect(result).toEqual(minted);
    expect(getStore(listVersion)).toBe(before + 1);
  });

  it('does not bump the list version when the mutation fails', async () => {
    mockPut.mockRejectedValue({ status: 400, body: { message: 'unknown uuid' } });
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
