import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

const mockGetConfig = vi.fn();
vi.mock('$lib/server/configCache', () => ({
  getConfig: (...args: unknown[]) => mockGetConfig(...args),
}));

import type { GET as GetHandler } from '../../src/routes/api/v1/config/refresh/+server';
import type { RequestEvent } from '../../.svelte-kit/types/src/routes/api/v1/config/refresh/$types';

const ENV_KEYS = ['VITE_ORIGIN'];
const savedEnv: Record<string, string | undefined> = {};

// ORIGIN is read into a module-level const at import time, so each test that needs
// a specific VITE_ORIGIN value must reset the module registry and re-import fresh.
async function loadHandler(): Promise<typeof GetHandler> {
  vi.resetModules();
  const mod = await import('../../src/routes/api/v1/config/refresh/+server');
  return mod.GET;
}

function mockFetchResponse(overrides: { ok?: boolean; status?: number; body?: unknown }) {
  const { ok = true, status = 200, body = {} } = overrides;
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

function makeEvent(headers?: Record<string, string>): RequestEvent {
  return {
    request: new Request('http://localhost/api/config/refresh', { headers }),
  } as RequestEvent;
}

describe('GET /api/config/refresh', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = import.meta.env[key];
    }
    import.meta.env.VITE_ORIGIN = 'http://origin.test';

    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mockGetConfig.mockResolvedValue({ settings: [], features: [], branding: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete import.meta.env[key];
      } else {
        import.meta.env[key] = savedEnv[key];
      }
    }
  });

  it('returns 401 when no Authorization header is present', async () => {
    const GET = await loadHandler();
    const res = await GET(makeEvent());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('returns 500 when VITE_ORIGIN is not configured', async () => {
    import.meta.env.VITE_ORIGIN = '';
    const GET = await loadHandler();

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Server misconfigured' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('returns 401 when the upstream user lookup rejects the token', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ ok: false, status: 401 }));
    const GET = await loadHandler();

    const res = await GET(makeEvent({ Authorization: 'Bearer bad-token' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('returns 401 when the upstream user lookup throws', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));
    const GET = await loadHandler();

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('forwards the Authorization header to psama/user/me', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: { privileges: ['SUPER_ADMIN'] } }));
    const GET = await loadHandler();

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
    const GET = await loadHandler();

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('returns 403 when the user has no privileges at all', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: {} }));
    const GET = await loadHandler();

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('forces a fresh fetch and returns it for a SUPER privileged user', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: { privileges: ['SUPER_ADMIN'] } }));
    const freshConfig = { settings: [{ key: 'a' }], features: [], branding: [] };
    mockGetConfig.mockResolvedValue(freshConfig);
    const GET = await loadHandler();

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(mockGetConfig).toHaveBeenCalledTimes(1);
    expect(mockGetConfig).toHaveBeenCalledWith(true);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(freshConfig);
  });

  it('returns 500 when reloading the config fails', async () => {
    fetchMock.mockResolvedValue(mockFetchResponse({ body: { privileges: ['SUPER_ADMIN'] } }));
    mockGetConfig.mockRejectedValue(new Error('boom'));
    const GET = await loadHandler();

    const res = await GET(makeEvent({ Authorization: 'Bearer some-token' }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to load configuration' });
  });
});
