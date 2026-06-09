import { get } from 'svelte/store';
import type { Unsubscriber } from 'svelte/store';

import * as api from '$lib/api';
import { isToastShowing, toaster } from '$lib/toaster';
import { allFilters, filterTree, genomicFilters } from '$lib/stores/Filter';
import {
  loading as resourcesPromise,
  loadResources,
  getQueryResources,
} from '$lib/stores/Resources';
import { subscribeOnChange } from '$lib/utilities/Subscribers';
import { buildDescriptor, stableHash } from '$lib/services/counts/queryDescriptor.svelte';
import { resultProviders } from '$lib/services/counts/providers';
import type { QueryDescriptor } from '$lib/services/counts/queryDescriptor.svelte';
import {
  createQueryCountService,
  type QueryCountService,
} from '$lib/services/counts/QueryCountService';
import type { ResultCountSnapshot } from '$lib/services/counts/snapshot';

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
  #unsubFilters: Unsubscriber | null = null;

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
      const [resource] = getQueryResources(isOpenAccess);
      if (!resource) {
        if (id !== this.#requestId) return { kind: 'stale' };
        this.#status = 'loaded';
        return { kind: 'committed', snapshot: EMPTY_SNAPSHOT };
      }
      const snapshot = await this.#service.getCount(descriptor, provider, resource);
      // Newer load() has superseded this one; committing now would race it.
      if (id !== this.#requestId) return { kind: 'stale' };
      this.#snapshot = snapshot;
      if (snapshot.summary.hasError) {
        this.#status = 'error';
        return { kind: 'error', snapshot };
      }
      this.#status = 'loaded';
      return { kind: 'committed', snapshot };
    } catch {
      if (id !== this.#requestId) return { kind: 'stale' };
      this.#status = 'error';
      return { kind: 'error', snapshot: this.#snapshot };
    }
  }

  clear(): void {
    this.#snapshot = EMPTY_SNAPSHOT;
    this.#status = 'idle';
    // Bump requestId so any in-flight load resolves into the stale branch.
    this.#requestId++;
    this.#service.clear();
  }

  start(getIsOpenAccess: () => boolean): void {
    this.stop();
    // Order matters: fire the initial #runLoad BEFORE installing the subscription.
    // subscribeOnChange skips its initial synchronous fire, so the explicit
    // #runLoad here is what triggers the first load. Swapping the order would
    // race the subscription's first invocation against the initial load.
    void this.#runLoad(getIsOpenAccess);
    this.#unsubFilters = subscribeOnChange(allFilters, () => {
      void this.#runLoad(getIsOpenAccess);
    });
  }

  stop(): void {
    if (this.#unsubFilters) {
      this.#unsubFilters();
      this.#unsubFilters = null;
    }
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
    if (stableHash(descriptor) === this.#snapshot.descriptorKey) return;
    await this.#runLoad(getIsOpenAccess, descriptor);
  }

  #buildCurrentDescriptor(isOpenAccess: boolean): QueryDescriptor {
    return buildDescriptor({
      isOpenAccess,
      filterTree: get(filterTree),
      genomicFilters: get(genomicFilters),
    });
  }

  async #runLoad(
    getIsOpenAccess: () => boolean,
    prebuiltDescriptor?: QueryDescriptor,
  ): Promise<void> {
    const isOpenAccess = getIsOpenAccess();
    loadResources();
    try {
      await get(resourcesPromise);
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
// Context) — `start()` installs a long-lived filter-store subscription on the
// singleton, and the load paths read filter stores via `get()`.
export const resultCountsState = new ResultCounts(
  createQueryCountService({
    transport: (path, request) => api.post(path, request),
  }),
);
