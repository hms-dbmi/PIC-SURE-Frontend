import type { QueryDescriptor } from '$lib/services/counts/queryDescriptor.svelte';
import { stableHash } from '$lib/services/counts/queryDescriptor.svelte';
import type { CountProvider, CountValue } from '$lib/services/counts/providers';
import type { ResultCountSnapshot } from '$lib/services/counts/snapshot';
import { summarize } from '$lib/services/counts/snapshot';
import { LRU } from '$lib/utilities/LRU';
import { log, createLog } from '$lib/logger';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';

export type CountTransport = (path: string, request: QueryRequestInterfaceV3) => Promise<unknown>;

export interface QueryCountServiceOptions {
  transport: CountTransport;
  maxCacheSize?: number;
}

export interface QueryCountService {
  getCount(
    descriptor: QueryDescriptor,
    provider: CountProvider,
    resource: { name: string; uuid: string },
  ): Promise<ResultCountSnapshot>;
  clear(): void;
}

function isApiErrorEnvelope(raw: unknown): raw is { errorType: string; message?: string } {
  // Match legacy rejectIfQueryError semantics: errorType must be a non-empty
  // string. `'errorType' in raw` would also match objects that happen to carry
  // an undefined errorType property.
  return (
    !!raw &&
    typeof raw === 'object' &&
    typeof (raw as { errorType?: unknown }).errorType === 'string'
  );
}

interface CellOutcome {
  value: CountValue;
  error: boolean;
}

export function createQueryCountService(options: QueryCountServiceOptions): QueryCountService {
  const { transport } = options;
  const cache = new LRU<string, ResultCountSnapshot>(options.maxCacheSize ?? 100);

  async function executeOne(
    descriptor: QueryDescriptor,
    provider: CountProvider,
    resource: { name: string; uuid: string },
  ): Promise<CellOutcome> {
    try {
      const request = provider.buildRequest(descriptor, resource.uuid);
      const path = provider.path(descriptor);
      log(
        createLog('QUERY', 'query.execute', {
          providerId: provider.id,
          resourceUuid: resource.uuid,
          path,
          expectedResultType: request.query.expectedResultType,
        }),
      );
      const raw = await transport(path, request);
      if (isApiErrorEnvelope(raw)) {
        log(
          createLog('QUERY', 'query.cell_failed', {
            providerId: provider.id,
            resourceUuid: resource.uuid,
            errorType: raw.errorType,
            message: raw.message,
          }),
        );
        return { value: 0, error: true };
      }
      return { value: provider.parse(raw), error: false };
    } catch (e) {
      log(
        createLog('QUERY', 'query.cell_failed', {
          providerId: provider.id,
          resourceUuid: resource.uuid,
          error: String(e),
        }),
      );
      return { value: 0, error: true };
    }
  }

  function cacheKeyFor(
    descriptor: QueryDescriptor,
    provider: CountProvider,
    resource: { name: string; uuid: string },
  ): string {
    return `${stableHash(descriptor)}|${provider.id}|${resource.uuid}`;
  }

  async function getCount(
    descriptor: QueryDescriptor,
    provider: CountProvider,
    resource: { name: string; uuid: string },
  ): Promise<ResultCountSnapshot> {
    const key = cacheKeyFor(descriptor, provider, resource);
    const cached = cache.get(key);
    if (cached) return cached;

    const outcome = await executeOne(descriptor, provider, resource);
    const snapshot: ResultCountSnapshot = {
      descriptorKey: stableHash(descriptor),
      count: outcome.value,
      summary: summarize(outcome.value, outcome.error),
    };
    if (!snapshot.summary.hasError) {
      cache.set(key, snapshot);
    }
    return snapshot;
  }

  function clear() {
    cache.clear();
  }

  return { getCount, clear };
}
