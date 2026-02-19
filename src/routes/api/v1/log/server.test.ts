import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockEnv: Record<string, string | undefined> = {};

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(
    {},
    {
      get: (_, key: string) => mockEnv[key],
    },
  ),
}));

vi.mock('$lib/paths', () => ({
  Picsure: {
    QuerySync: 'picsure/query/sync',
  },
}));

const TEST_ORIGIN = 'https://picsure.example.com/';
import.meta.env.VITE_ORIGIN = TEST_ORIGIN;

// Must import after mocks are set up
const { POST } = await import('./+server');

const TEST_RESOURCE_UUID = '00000000-0000-0000-0000-000000000001';

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function makeInvalidRequest(): Request {
  return new Request('http://localhost/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json',
  });
}

function makeEvent(request: Request) {
  return { request, getClientAddress: () => '127.0.0.1' } as Parameters<typeof POST>[0];
}

describe('+server POST /api/log', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockEnv = {
      RESOURCE_LOG: TEST_RESOURCE_UUID,
      AUDIT_API_KEY: 'test-api-key-123',
    };
  });

  it('returns 202 with status dropped when RESOURCE_LOG is missing', async () => {
    mockEnv = {};
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await POST(makeEvent(makeRequest({ event_type: 'TEST' })));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ result: 'dropped' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not configured'));
  });

  it('returns 202 with status dropped for invalid JSON body', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await POST(makeEvent(makeInvalidRequest()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ result: 'dropped' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'));
  });

  it('returns 202 with status dropped when event_type is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await POST(makeEvent(makeRequest({ action: 'click' })));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ result: 'dropped' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing event_type'));
  });

  it('forwards request to PIC-SURE with resourceUUID and query body', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    const logEvent = { event_type: 'QUERY' };
    const response = await POST(
      makeEvent(makeRequest(logEvent, { Authorization: 'Bearer jwt-token' })),
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ result: 'accepted' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${TEST_ORIGIN}picsure/query/sync`);
    expect(opts?.method).toBe('POST');

    const headers = opts?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer jwt-token');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-API-Key']).toBe('test-api-key-123');

    const sentBody = JSON.parse(opts?.body as string);
    expect(sentBody.resourceUUID).toBe(TEST_RESOURCE_UUID);
    expect(sentBody.query).toEqual({ ...logEvent, src_ip: '127.0.0.1' });
  });

  it('returns 202 even when upstream returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(makeEvent(makeRequest({ event_type: 'QUERY' })));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ result: 'accepted' });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Upstream returned 500'));
  });

  it('returns 202 even when fetch throws a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(makeEvent(makeRequest({ event_type: 'QUERY' })));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ result: 'accepted' });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Network error'),
      expect.any(Error),
    );
  });

  it('does not include X-API-Key header when AUDIT_API_KEY is not set', async () => {
    mockEnv = { RESOURCE_LOG: TEST_RESOURCE_UUID };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    await POST(makeEvent(makeRequest({ event_type: 'QUERY' })));

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBeUndefined();
  });

  it('does not forward Authorization header when not present', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    await POST(makeEvent(makeRequest({ event_type: 'QUERY' })));

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });
});

describe('+server POST /api/log - origin fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockEnv = {
      RESOURCE_LOG: TEST_RESOURCE_UUID,
      AUDIT_API_KEY: 'test-api-key-123',
    };
  });

  // Note: VITE_ORIGIN is set at module level and can't be unset per-test since
  // it's captured at import time. These tests verify the fallback logic by
  // reimporting with VITE_ORIGIN unset.

  it('falls back to X-Forwarded-Proto + X-Forwarded-Host', async () => {
    // Save and clear VITE_ORIGIN
    const saved = import.meta.env.VITE_ORIGIN;
    import.meta.env.VITE_ORIGIN = '';

    const { POST: FallbackPOST } = await import('./+server');

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    const response = await FallbackPOST(
      makeEvent(
        makeRequest(
          { event_type: 'QUERY' },
          { 'X-Forwarded-Proto': 'https', 'X-Forwarded-Host': 'my-alb.example.com' },
        ),
      ),
    );

    expect(response.status).toBe(202);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://my-alb.example.com/picsure/query/sync');

    import.meta.env.VITE_ORIGIN = saved;
  });

  it('falls back to Host header when forwarded headers are absent', async () => {
    const saved = import.meta.env.VITE_ORIGIN;
    import.meta.env.VITE_ORIGIN = '';

    const { POST: FallbackPOST } = await import('./+server');

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    const request = new Request('http://localhost/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Host: 'internal-host:8080' },
      body: JSON.stringify({ event_type: 'QUERY' }),
    });

    const response = await FallbackPOST(makeEvent(request));

    expect(response.status).toBe(202);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://internal-host:8080/picsure/query/sync');

    import.meta.env.VITE_ORIGIN = saved;
  });
});
