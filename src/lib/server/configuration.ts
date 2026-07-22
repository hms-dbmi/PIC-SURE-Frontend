import { AsyncLocalStorage } from 'node:async_hooks';

import type { ConfigCache, Features, Settings, Branding } from '$lib/models/Configuration';

export type RequestStore = {
  cache: ConfigCache;
  // Lazily populated from `cache` on first read, then reused - safe to memoize
  // here (unlike in module state) because the store itself is already scoped to
  // one request. Cleared whenever `cache` is replaced, so a stale derived value
  // can never outlive the raw data it came from.
  derived: { features?: Features; settings?: Settings; branding?: Branding };
};

export const EMPTY_CACHE: ConfigCache = { features: [], settings: [], branding: [] };

// Per-request isolated store for SSR; avoids cross-request state bleed.
const requestCache = new AsyncLocalStorage<RequestStore>();

// Wraps resolve(event) in hooks.server.ts to scope a fresh store to each request.
export function runWithConfig<T>(fn: () => T): T {
  return requestCache.run({ cache: EMPTY_CACHE, derived: {} }, fn);
}

export function serverStore(): RequestStore {
  const store = requestCache.getStore();
  if (!store) {
    throw new Error(
      'config accessed outside a request context - is this running outside runWithConfig()?',
    );
  }
  return store;
}
