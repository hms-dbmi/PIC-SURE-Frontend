import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

const mockGetConfig = vi.fn();
vi.mock('$lib/server/configCache', () => ({
  getConfig: (...args: unknown[]) => mockGetConfig(...args),
}));

import { GET } from '../../src/routes/api/v1/config/refresh/+server';
import type { RequestEvent } from '../../.svelte-kit/types/src/routes/api/v1/config/refresh/$types';

function mockFetchResponse(overrides: { ok?: boolean; status?: number; body?: unknown }) {
  const { ok = true, status = 200, body = {} } = overrides;
  return { ok, status, json: vi.fn().mockResolvedValue(body) };
}

function makeEvent(headers?: Record<string, string>): RequestEvent {
  return {
    request: new Request('http://localhost/api/config/refresh', { headers }),
  } as RequestEvent;
}

describe('GET /api/config/refresh', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mockGetConfig.mockResolvedValue({ settings: [], features: [], branding: [] });
  });

  it('returns 401 when no Authorization header is present', async () => {
    const res = await GET(makeEvent());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('returns 401 when the upstream user lookup rejects the token', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 401 }));

    const res = await GET(makeEvent({ Authorization: 'Bearer bad-token' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('returns 401 when the upstream user lookup throws', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('forwards the Authorization header to psama/user/me', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: { privileges: ['SUPER_ADMIN'] } }));

    await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('psama/user/me'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer some-token' },
      }),
    );
  });

  it('returns 403 when the user lacks SUPER privileges', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: { privileges: ['ADMIN'] } }));

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('returns 403 when the user has no privileges at all', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: {} }));

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('forces a fresh fetch and returns it for a SUPER privileged user', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: { privileges: ['SUPER_ADMIN'] } }));
    const freshConfig = { settings: [{ key: 'a' }], features: [], branding: [] };
    mockGetConfig.mockResolvedValue(freshConfig);

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(mockGetConfig).toHaveBeenCalledTimes(1);
    expect(mockGetConfig).toHaveBeenCalledWith(true);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(freshConfig);
  });

  it('returns 500 when reloading the config fails', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: { privileges: ['SUPER_ADMIN'] } }));
    mockGetConfig.mockRejectedValue(new Error('boom'));

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to load configuration' });
  });
});
