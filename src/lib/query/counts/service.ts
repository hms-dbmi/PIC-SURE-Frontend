import type { QueryDescriptor } from '#lib/query/descriptor.svelte.ts';
import { stableHash } from '#lib/query/descriptor.svelte.ts';
import { isQueryProvider, type CountProvider } from '#lib/query/counts/providers.ts';
import type { CountValue } from '#lib/query/counts/format.ts';
import type { ResultCountSnapshot } from '#lib/query/counts/snapshot.ts';
import { summarize } from '#lib/query/counts/snapshot.ts';
import { LRU } from '#lib/utils/lru.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';
import type { QueryRequest } from '#lib/api/picsure/query.types.ts';
import { PicsurePaths } from '#lib/api/paths.ts';

export type CountTransport = (request: QueryRequest, openEndpoint: boolean) => Promise<unknown>;

export interface QueryCountServiceOptions {
  transport: CountTransport;
  maxCacheSize?: number;
}

export interface QueryCountService {
  getCount(descriptor: QueryDescriptor, provider: CountProvider): Promise<ResultCountSnapshot>;
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
  const { transport, maxCacheSize = 100 } = options;
  const cache = new LRU<string, ResultCountSnapshot>(maxCacheSize);
  const inflight = new Map<string, Promise<ResultCountSnapshot>>();
  // Bumped by clear() so requests started before a clear cannot repopulate
  // the cache with pre-clear data after it.
  let generation = 0;

  async function executeOne(
    descriptor: QueryDescriptor,
    provider: CountProvider,
  ): Promise<CellOutcome> {
    try {
      if (!isQueryProvider(provider)) {
        return { value: await provider.fetch(descriptor), error: false };
      }
      const request = provider.buildRequest(descriptor);
      const openEndpoint = provider.openEndpoint(descriptor);
      log(
        createLog('QUERY', 'query.execute', {
          providerId: provider.id,
          isOpenAccess: descriptor.isOpenAccess,
          path: PicsurePaths.syncQuery(openEndpoint),
          expectedResultType: request.query.expectedResultType,
        }),
      );
      const raw = await transport(request, openEndpoint);
      if (isApiErrorEnvelope(raw)) {
        log(
          createLog('QUERY', 'query.cell_failed', {
            providerId: provider.id,
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
          error: String(e),
        }),
      );
      return { value: 0, error: true };
    }
  }

  function getCount(
    descriptor: QueryDescriptor,
    provider: CountProvider,
  ): Promise<ResultCountSnapshot> {
    const key = `${stableHash(descriptor)}|${provider.id}`;
    const cached = cache.get(key);
    if (cached) return Promise.resolve(cached);
    const pending = inflight.get(key);
    if (pending) return pending;

    const startedGeneration = generation;
    const promise = executeOne(descriptor, provider)
      .then((outcome) => {
        const snapshot: ResultCountSnapshot = {
          descriptorKey: stableHash(descriptor),
          count: outcome.value,
          summary: summarize(outcome.value, outcome.error),
        };
        if (!snapshot.summary.hasError && generation === startedGeneration) {
          cache.set(key, snapshot);
        }
        return snapshot;
      })
      .finally(() => {
        if (inflight.get(key) === promise) inflight.delete(key);
      });
    inflight.set(key, promise);
    return promise;
  }

  // Pending requests are dropped too: their results may belong to whoever was signed in before.
  function clear() {
    generation++;
    cache.clear();
    inflight.clear();
  }

  return { getCount, clear };
}
