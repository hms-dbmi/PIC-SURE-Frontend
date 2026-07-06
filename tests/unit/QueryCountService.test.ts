import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

import { createQueryCountService } from '$lib/services/counts/QueryCountService';
import type { CountProvider } from '$lib/services/counts/providers';
import type { QueryDescriptor } from '$lib/services/counts/queryDescriptor.svelte';

const descriptor: QueryDescriptor = {
  isOpenAccess: false,
  phenotypicClause: null,
  genomicFilters: [],
};

const resource = { name: 'hpds', uuid: 'a-uuid' };

function makeProvider(parse: (raw: unknown) => number = (raw) => raw as number): CountProvider {
  return {
    id: 'query:patientCount',
    path: () => '/p',
    buildRequest: (_d, uuid) => ({
      query: { expectedResultType: 'COUNT' } as never,
      resourceUUID: uuid,
    }),
    parse,
  };
}

describe('QueryCountService.getCount', () => {
  it('calls transport once and returns a snapshot with the parsed count', async () => {
    const transport = vi.fn().mockResolvedValue(1234);
    const service = createQueryCountService({ transport });
    const snap = await service.getCount(descriptor, makeProvider(), resource);
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
    const snap = await service.getCount(descriptor, provider, resource);
    expect(parseSpy).not.toHaveBeenCalled();
    expect(snap.count).toBe(0);
    expect(snap.summary.hasError).toBe(true);
  });

  it('coerces a rejected transport promise to 0 + hasError', async () => {
    const transport = vi.fn().mockRejectedValue(new Error('network'));
    const service = createQueryCountService({ transport });
    const snap = await service.getCount(descriptor, makeProvider(), resource);
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
    const snap = await service.getCount(descriptor, provider, resource);
    expect(transport).not.toHaveBeenCalled();
    expect(snap.count).toBe(0);
    expect(snap.summary.hasError).toBe(true);
  });

  it('caches a successful snapshot and returns it by reference on a second call', async () => {
    const transport = vi.fn().mockResolvedValue(100);
    const provider = makeProvider();
    const service = createQueryCountService({ transport });
    const snap1 = await service.getCount(descriptor, provider, resource);
    const snap2 = await service.getCount(descriptor, provider, resource);
    expect(snap1).toBe(snap2);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('treats a change in resource as a cache miss', async () => {
    const transport = vi.fn().mockResolvedValue(100);
    const provider = makeProvider();
    const service = createQueryCountService({ transport });
    await service.getCount(descriptor, provider, { name: 'a', uuid: 'a' });
    transport.mockClear();
    await service.getCount(descriptor, provider, { name: 'b', uuid: 'b' });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache when hasError is true (so a transient failure is retried)', async () => {
    const transport = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(50);
    const service = createQueryCountService({ transport });
    const snap1 = await service.getCount(descriptor, makeProvider(), resource);
    expect(snap1.summary.hasError).toBe(true);
    const snap2 = await service.getCount(descriptor, makeProvider(), resource);
    expect(snap2.summary.hasError).toBe(false);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest snapshot when the cache exceeds maxCacheSize', async () => {
    const transport = vi.fn().mockResolvedValue(100);
    const provider = makeProvider();
    const service = createQueryCountService({ transport, maxCacheSize: 1 });
    const d1 = { ...descriptor, isOpenAccess: false };
    const d2 = { ...descriptor, isOpenAccess: true };
    await service.getCount(d1, provider, resource);
    await service.getCount(d2, provider, resource);
    transport.mockClear();
    await service.getCount(d1, provider, resource);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('clear() empties the cache', async () => {
    const transport = vi.fn().mockResolvedValue(100);
    const provider = makeProvider();
    const service = createQueryCountService({ transport });
    await service.getCount(descriptor, provider, resource);
    transport.mockClear();
    service.clear();
    await service.getCount(descriptor, provider, resource);
    expect(transport).toHaveBeenCalledTimes(1);
  });
});

describe('QueryCountService transport dispatch', () => {
  it('calls transport with provider.path(descriptor) and provider.buildRequest(descriptor, uuid)', async () => {
    const transport = vi.fn().mockResolvedValue(0);
    const provider: CountProvider = {
      id: 'query:patientCount',
      path: (d) => (d.isOpenAccess ? '/open' : '/auth'),
      buildRequest: (_d, uuid) => ({
        query: { expectedResultType: 'COUNT' } as never,
        resourceUUID: uuid,
      }),
      parse: (raw) => raw as number,
    };
    const service = createQueryCountService({ transport });
    await service.getCount(descriptor, provider, resource);
    expect(transport).toHaveBeenCalledWith(
      '/auth',
      expect.objectContaining({ resourceUUID: 'a-uuid' }),
    );
  });
});
