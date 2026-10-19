import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({
  resolve: (path: string) => (path.startsWith('/') ? path : `/${path}`),
}));

import { createQueryCountService } from '#lib/query/counts/service.ts';
import type { CountProvider, QueryCountProvider } from '#lib/query/counts/providers.ts';
import type { QueryDescriptor } from '#lib/query/descriptor.svelte.ts';

const descriptor: QueryDescriptor = {
  isOpenAccess: false,
  phenotypicClause: null,
  genomicFilters: [],
};

function makeProvider(
  parse: (raw: unknown) => number = (raw) => raw as number,
): QueryCountProvider {
  return {
    id: 'query:patientCount',
    openEndpoint: () => false,
    buildRequest: () => ({
      query: { expectedResultType: 'COUNT' } as never,
    }),
    parse,
  };
}

describe('QueryCountService.getCount', () => {
  it('calls transport once and returns a snapshot with the parsed count', async () => {
    const transport = vi.fn().mockResolvedValue(1234);
    const service = createQueryCountService({ transport });
    const snap = await service.getCount(descriptor, makeProvider());
    expect(transport).toHaveBeenCalledTimes(1);
    expect(snap.count).toBe(1234);
    expect(snap.summary.total).toBe(1234);
    expect(snap.summary.hasNonZero).toBe(true);
    expect(snap.summary.hasError).toBe(false);
  });

  it('unwraps API error envelopes BEFORE calling parse', async () => {
    const parseSpy = vi.fn().mockImplementation((raw) => raw as number);
    const provider: CountProvider = { ...makeProvider(), parse: parseSpy };
    const transport = vi.fn().mockResolvedValueOnce({ errorType: 'API_ERROR', message: 'boom' });
    const service = createQueryCountService({ transport });
    const snap = await service.getCount(descriptor, provider);
    expect(parseSpy).not.toHaveBeenCalled();
    expect(snap.count).toBe(0);
    expect(snap.summary.hasError).toBe(true);
  });

  it('coerces a rejected transport promise to 0 + hasError', async () => {
    const transport = vi.fn().mockRejectedValue(new Error('network'));
    const service = createQueryCountService({ transport });
    const snap = await service.getCount(descriptor, makeProvider());
    expect(snap.count).toBe(0);
    expect(snap.summary.hasError).toBe(true);
  });

  it('coerces a throw from provider.buildRequest to 0 + hasError', async () => {
    const provider: CountProvider = {
      ...makeProvider(),
      buildRequest: () => {
        throw new Error('misconfigured');
      },
    };
    const transport = vi.fn();
    const service = createQueryCountService({ transport });
    const snap = await service.getCount(descriptor, provider);
    expect(transport).not.toHaveBeenCalled();
    expect(snap.count).toBe(0);
    expect(snap.summary.hasError).toBe(true);
  });

  it('caches a successful snapshot and returns it by reference on a second call', async () => {
    const transport = vi.fn().mockResolvedValue(100);
    const provider = makeProvider();
    const service = createQueryCountService({ transport });
    const snap1 = await service.getCount(descriptor, provider);
    const snap2 = await service.getCount(descriptor, provider);
    expect(snap1).toBe(snap2);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache when hasError is true (so a transient failure is retried)', async () => {
    const transport = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(50);
    const service = createQueryCountService({ transport });
    const snap1 = await service.getCount(descriptor, makeProvider());
    expect(snap1.summary.hasError).toBe(true);
    const snap2 = await service.getCount(descriptor, makeProvider());
    expect(snap2.summary.hasError).toBe(false);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest snapshot when the cache exceeds maxCacheSize', async () => {
    const transport = vi.fn().mockResolvedValue(100);
    const provider = makeProvider();
    const service = createQueryCountService({ transport, maxCacheSize: 1 });
    const d1 = { ...descriptor, isOpenAccess: false };
    const d2 = { ...descriptor, isOpenAccess: true };
    await service.getCount(d1, provider);
    await service.getCount(d2, provider);
    transport.mockClear();
    await service.getCount(d1, provider);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('clear() empties the cache', async () => {
    const transport = vi.fn().mockResolvedValue(100);
    const provider = makeProvider();
    const service = createQueryCountService({ transport });
    await service.getCount(descriptor, provider);
    transport.mockClear();
    service.clear();
    await service.getCount(descriptor, provider);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent identical requests into one transport call', async () => {
    let resolveTransport!: (value: number) => void;
    const transport = vi
      .fn()
      .mockReturnValue(new Promise((resolve) => (resolveTransport = resolve)));
    const provider = makeProvider();
    const service = createQueryCountService({ transport });

    const first = service.getCount(descriptor, provider);
    const second = service.getCount(descriptor, provider);
    resolveTransport(42);

    const [snap1, snap2] = await Promise.all([first, second]);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(snap1).toBe(snap2);
    expect(snap1.count).toBe(42);
  });

  it('does not coalesce once the request has settled', async () => {
    const transport = vi.fn().mockRejectedValue(new Error('boom'));
    const service = createQueryCountService({ transport });
    await service.getCount(descriptor, makeProvider());
    await service.getCount(descriptor, makeProvider());
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('a request started before clear() cannot repopulate the cache after it', async () => {
    let resolveTransport!: (value: number) => void;
    const transport = vi
      .fn()
      .mockReturnValue(new Promise((resolve) => (resolveTransport = resolve)));
    const provider = makeProvider();
    const service = createQueryCountService({ transport });

    const preClear = service.getCount(descriptor, provider);
    service.clear();
    resolveTransport(42);
    await preClear;

    transport.mockResolvedValue(43);
    const snap = await service.getCount(descriptor, provider);
    expect(snap.count).toBe(43);
    expect(transport).toHaveBeenCalledTimes(2);
  });
});

describe('QueryCountService transport dispatch', () => {
  it('builds and transports a query request', async () => {
    const transport = vi.fn().mockResolvedValue(0);
    const buildRequest = vi.fn(() => ({
      query: { expectedResultType: 'COUNT' } as never,
    }));
    const provider: CountProvider = {
      id: 'query:patientCount',
      openEndpoint: (d) => d.isOpenAccess,
      buildRequest,
      parse: (raw) => raw as number,
    };
    const service = createQueryCountService({ transport });
    await service.getCount(descriptor, provider);
    expect(buildRequest).toHaveBeenCalledWith(descriptor);
    expect(transport).toHaveBeenCalledWith({ query: { expectedResultType: 'COUNT' } }, false);
  });

  it("takes a fetch provider's value without the transport", async () => {
    const transport = vi.fn();
    const provider: CountProvider = { id: 'dict:concepts', fetch: vi.fn().mockResolvedValue(7) };
    const service = createQueryCountService({ transport });

    const snap = await service.getCount(descriptor, provider);

    expect(snap.count).toBe(7);
    expect(snap.summary.hasError).toBe(false);
    expect(transport).not.toHaveBeenCalled();
  });

  it('turns a failed fetch into an error snapshot and retries it next time', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(3);
    const service = createQueryCountService({ transport: vi.fn() });

    const failed = await service.getCount(descriptor, { id: 'dict:concepts', fetch });
    const retried = await service.getCount(descriptor, { id: 'dict:concepts', fetch });

    expect(failed.summary.hasError).toBe(true);
    expect(failed.count).toBe(0);
    expect(retried.count).toBe(3);
  });
});
