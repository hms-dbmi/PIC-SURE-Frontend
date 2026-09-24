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

// Must import after mocks are set up
const { GET, POST } = await import('./[...path]/+server');

function makeEvent(
  method: string,
  path: string,
  options: { search?: string; body?: string; headers?: Record<string, string> } = {},
) {
  const url = new URL(`http://localhost/api/v1/open/${path}${options.search || ''}`);
  const request = new Request(url, {
    method,
    headers: options.headers,
    body: options.body,
  });
  return {
    request,
    params: { path },
    url,
    getClientAddress: () => '203.0.113.9',
  } as unknown as Parameters<typeof POST>[0];
}

function upstreamResponse(body = '{"ok":true}', status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
}

describe('+server /api/v1/open/[...path]', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockEnv = { PICSURE_PLATFORM_API_KEY: 'picsure_platformKey123' };
    fetchMock = vi.fn().mockResolvedValue(upstreamResponse());
    vi.stubGlobal('fetch', fetchMock);
  });

  it('attaches the platform key and forwards to the upstream data API with the query string', async () => {
    const event = makeEvent('GET', 'picsure/proxy/dictionary-api/facets', { search: '?q=age' });

    const response = await GET(event);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [target, init] = fetchMock.mock.calls[0];
    expect(String(target)).toBe('http://localhost/picsure/proxy/dictionary-api/facets?q=age');
    expect(init.headers['X-PICSURE-API-Key']).toBe('picsure_platformKey123');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    await expect(response.text()).resolves.toBe('{"ok":true}');
  });

  it('forwards only the trusted client address, discarding a spoofed X-Forwarded-For', async () => {
    const bare = makeEvent('GET', 'picsure/query/sync');
    await GET(bare);
    expect(fetchMock.mock.calls[0][1].headers['X-Forwarded-For']).toBe('203.0.113.9');
    expect(fetchMock.mock.calls[0][1].headers['X-Forwarded-Host']).toBe('localhost');

    const spoofed = makeEvent('GET', 'picsure/query/sync', {
      headers: { 'X-Forwarded-For': '1.2.3.4' },
    });
    await GET(spoofed);
    expect(fetchMock.mock.calls[1][1].headers['X-Forwarded-For']).toBe('203.0.113.9');
  });

  it('reaches the API through the configured internal origin', async () => {
    mockEnv.PICSURE_INTERNAL_API_ORIGIN = 'http://api-host:8080';
    const event = makeEvent('GET', 'picsure/query/sync');

    await GET(event);

    expect(String(fetchMock.mock.calls[0][0])).toBe('http://api-host:8080/picsure/query/sync');
  });

  it('still rejects traversal outside picsure under a custom internal origin', async () => {
    mockEnv.PICSURE_INTERNAL_API_ORIGIN = 'http://api-host:8080';
    const event = makeEvent('GET', 'picsure/../psama/user/me');

    await expect(GET(event)).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards POST bodies and content type', async () => {
    const event = makeEvent('POST', 'picsure/query/sync', {
      body: '{"query":{}}',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': 'session-1' },
    });

    await POST(event);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toContain('application/json');
    expect(init.headers['X-Session-Id']).toBe('session-1');
    expect(new TextDecoder().decode(init.body)).toBe('{"query":{}}');
  });

  it('forwards the Accept header for content negotiation', async () => {
    const event = makeEvent('GET', 'picsure/query/sync', {
      headers: { Accept: 'application/json' },
    });

    await GET(event);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Accept']).toBe('application/json');
  });

  it('never forwards Authorization or Cookie headers upstream', async () => {
    const event = makeEvent('GET', 'picsure/query/sync', {
      headers: { Authorization: 'Bearer stale.jwt', Cookie: 'session=abc' },
    });

    await GET(event);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Authorization']).toBeUndefined();
    expect(init.headers['Cookie']).toBeUndefined();
  });

  it('rejects non picsure paths without contacting the upstream', async () => {
    const event = makeEvent('GET', 'psama/user/me');

    await expect(GET(event)).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects path traversal that normalizes outside picsure', async () => {
    // decoded ".." segments would normalize to a non-picsure upstream if only the raw string were checked
    for (const path of ['picsure/../psama/user/me', 'picsure/../../psama/admin']) {
      const event = makeEvent('GET', path);
      await expect(GET(event)).rejects.toMatchObject({ status: 404 });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards without a key and logs an error when the platform key is unset', async () => {
    mockEnv = {};
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const event = makeEvent('GET', 'picsure/query/sync');

    await GET(event);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['X-PICSURE-API-Key']).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('passes upstream error statuses through', async () => {
    fetchMock.mockResolvedValue(upstreamResponse('denied', 401));
    const event = makeEvent('GET', 'picsure/query/sync');

    const response = await GET(event);

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe('denied');
  });

  it('returns 502 when the upstream is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const event = makeEvent('GET', 'picsure/query/sync');

    await expect(GET(event)).rejects.toMatchObject({ status: 502 });
    expect(errorSpy).toHaveBeenCalled();
  });
});
