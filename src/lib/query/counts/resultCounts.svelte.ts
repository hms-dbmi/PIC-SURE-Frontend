import { untrack } from 'svelte';

import { runSyncQuery } from '#lib/api/picsure/query.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';
import { isToastShowing, toaster } from '#lib/ui/toaster.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import { getCountResource } from '#lib/explorer/Resources.ts';
import { buildDescriptor, stableHash } from '#lib/query/descriptor.svelte.ts';
import { resultProviders } from '#lib/query/counts/providers.ts';
import type { QueryDescriptor } from '#lib/query/descriptor.svelte.ts';
import { createQueryCountService, type QueryCountService } from '#lib/query/counts/service.ts';
import { summarize } from '#lib/query/counts/snapshot.ts';
import type { ResultCountSnapshot } from '#lib/query/counts/snapshot.ts';

export type ResultCountsStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * `load()` returns the per-call outcome so a caller can use ITS snapshot,
 * not the shared `#snapshot` (which a parallel call may have overwritten).
 * On `stale`, caller should skip projection. On `error`, caller decides
 * whether to surface a toast.
 */
export type LoadResult =
  | { kind: 'committed'; snapshot: ResultCountSnapshot }
  | { kind: 'stale' }
  | { kind: 'error'; snapshot: ResultCountSnapshot };

const EMPTY_SNAPSHOT: ResultCountSnapshot = {
  descriptorKey: '',
  count: 0,
  summary: { total: 0, hasNonZero: false, hasError: false },
};
// Defensive freeze: the singleton's empty state is shared across every
// instance and every `clear()` call. A consumer that accidentally mutated
// `snapshot.summary` would pollute every future clear.
Object.freeze(EMPTY_SNAPSHOT);
Object.freeze(EMPTY_SNAPSHOT.summary);

export class ResultCounts {
  #service: QueryCountService;
  #snapshot = $state.raw<ResultCountSnapshot>(EMPTY_SNAPSHOT);
  #status = $state<ResultCountsStatus>('idle');
  #requestId = 0;
  #stopWatching: (() => void) | null = null;
  #getIsOpenAccess = $state.raw<() => boolean>(() => false);
  #descriptor = $derived(buildDescriptor(this.#getIsOpenAccess(), filterState.queryFilters));

  constructor(service: QueryCountService) {
    this.#service = service;
  }

  get snapshot(): ResultCountSnapshot {
    return this.#snapshot;
  }
  get status(): ResultCountsStatus {
    return this.#status;
  }
  get total() {
    return this.#snapshot.summary.total;
  }
  get hasNonZero() {
    return this.#snapshot.summary.hasNonZero;
  }
  get loading() {
    return this.#status === 'loading';
  }

  async load(descriptor: QueryDescriptor, isOpenAccess: boolean): Promise<LoadResult> {
    const id = ++this.#requestId;
    this.#status = 'loading';
    try {
      const provider = resultProviders['query:patientCount'];
      const resource = getCountResource(isOpenAccess);
      const snapshot = await this.#service.getCount(descriptor, provider, resource);
      // Newer load() has superseded this one; committing now would race it.
      if (id !== this.#requestId) return { kind: 'stale' };
      this.#snapshot = snapshot;
      if (snapshot.summary.hasError) {
        this.#status = 'error';
        return { kind: 'error', snapshot };
      }
      log(createLog('QUERY', 'query.count_returned', { count: snapshot.count }));
      this.#status = 'loaded';
      return { kind: 'committed', snapshot };
    } catch {
      if (id !== this.#requestId) return { kind: 'stale' };
      // Consumers key off snapshot.summary.hasError, not #status - leaving the
      // previous snapshot here would keep showing a stale count with no error
      // indication.
      const snapshot: ResultCountSnapshot = {
        descriptorKey: stableHash(descriptor),
        count: 0,
        summary: summarize(0, true),
      };
      this.#snapshot = snapshot;
      this.#status = 'error';
      return { kind: 'error', snapshot };
    }
  }

  clear(): void {
    this.#snapshot = EMPTY_SNAPSHOT;
    this.#status = 'idle';
    // Bump requestId so any in-flight load resolves into the stale branch.
    this.#requestId++;
    this.#service.clear();
  }

  /** Loads the count now and again whenever the filters change, until `stop()`. */
  start(getIsOpenAccess: () => boolean): void {
    this.stop();
    this.#getIsOpenAccess = getIsOpenAccess;
    this.#stopWatching = $effect.root(() => {
      $effect(() => {
        const descriptor = this.#descriptor;
        untrack(() => void this.#runLoad(getIsOpenAccess, descriptor));
      });
    });
  }

  stop(): void {
    this.#stopWatching?.();
    this.#stopWatching = null;
    // Bump requestId so any in-flight load resolves as stale and doesn't commit.
    this.#requestId++;
    this.#status = 'idle';
  }

  async triggerLoad(getIsOpenAccess: () => boolean): Promise<void> {
    await this.#runLoad(getIsOpenAccess);
  }

  async ensureLoaded(getIsOpenAccess: () => boolean): Promise<void> {
    const isOpenAccess = getIsOpenAccess();
    const descriptor = this.#buildCurrentDescriptor(isOpenAccess);
    // Error snapshots carry the attempted descriptorKey too, so a bare key
    // match would treat a failure as loaded and never retry.
    if (
      stableHash(descriptor) === this.#snapshot.descriptorKey &&
      !this.#snapshot.summary.hasError
    ) {
      return;
    }
    await this.#runLoad(getIsOpenAccess, descriptor);
  }

  #buildCurrentDescriptor(isOpenAccess: boolean): QueryDescriptor {
    return buildDescriptor(isOpenAccess, filterState.queryFilters);
  }

  async #runLoad(
    getIsOpenAccess: () => boolean,
    prebuiltDescriptor?: QueryDescriptor,
  ): Promise<void> {
    const isOpenAccess = getIsOpenAccess();
    try {
      const descriptor = prebuiltDescriptor ?? this.#buildCurrentDescriptor(isOpenAccess);
      const result = await this.load(descriptor, isOpenAccess);
      if (result.kind === 'error') this.#showErrorToast();
    } catch (error) {
      console.error(error);
      this.#showErrorToast();
    }
  }

  #showErrorToast(): void {
    if (isToastShowing('query-error')) return;
    toaster.error({
      id: 'query-error',
      duration: 4000,
      title:
        'An error occured while loading patient counts. If this problem persists, please contact an administrator.',
      closable: true,
    });
  }
}

// Module-level singleton. Do NOT invoke `load()`, `start()`, `triggerLoad()`,
// or `ensureLoaded()` from server code without per-request scoping (SvelteKit
// Context) — `start()` installs a long-lived filter watcher on the singleton,
// and the load paths read the browser-only filter state.
export const resultCountsState = new ResultCounts(
  createQueryCountService({
    transport: (request, openEndpoint) => runSyncQuery(request, { openEndpoint }),
  }),
);
