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
const { POST } = await import('./+server');

// The server-side proxy forwards audit events to the gateway's clean logging route
// (was the legacy /proxy/pic-sure-logging relay).
const LOGGING_TARGET = 'http://localhost/picsure/logging/audit';

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
      LOGGING_API_KEY: 'test-api-key-123',
    };
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

  it('forwards the event to the logging route with src_ip and the API key header', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    const logEvent = { event_type: 'QUERY' };
    const response = await POST(
      makeEvent(makeRequest(logEvent, { Authorization: 'Bearer aaa.bbb.ccc' })),
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ result: 'accepted' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(LOGGING_TARGET);
    expect(opts?.method).toBe('POST');

    const headers = opts?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer aaa.bbb.ccc');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-API-Key']).toBe('test-api-key-123');

    // The raw LogEvent (with src_ip added) is forwarded — not wrapped in a query envelope.
    const sentBody = JSON.parse(opts?.body as string);
    expect(sentBody).toEqual({ ...logEvent, src_ip: '127.0.0.1' });
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

  it('does not include X-API-Key header when LOGGING_API_KEY is not set', async () => {
    mockEnv = {};
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    await POST(makeEvent(makeRequest({ event_type: 'QUERY' })));

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Logging API Key not set'));
  });

  it('does not forward Authorization header when not present', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    await POST(makeEvent(makeRequest({ event_type: 'QUERY' })));

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('does not forward a malformed (non-JWT) Authorization header', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 202 }));

    await POST(
      makeEvent(makeRequest({ event_type: 'QUERY' }, { Authorization: 'Bearer not-a-jwt' })),
    );

    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });
});
