import { AsyncLocalStorage } from 'node:async_hooks';
import { browser } from '$app/environment';

import type { ConfigCache, Features, Settings, Branding } from './models/Configuration';
import { mapFeatures, mapSettings, mapBranding } from './models/Configuration';

export { routes } from './routes';

export const PROJECT_HOSTNAME =
  typeof window !== 'undefined'
    ? `${window.location.origin}/picsure`
    : import.meta.env?.VITE_PROJECT_HOSTNAME
      ? `https://${import.meta.env?.VITE_PROJECT_HOSTNAME}/picsure`
      : 'https://nhanes.hms.harvard.edu/picsure';

export const auth = {
  auth0Tenant: import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab',
};

const EMPTY_CACHE: ConfigCache = { features: [], settings: [], branding: [] };

// Stable reactive state for the single browser session.
let clientFeatures = $state(mapFeatures([]));
let clientSettings = $state(mapSettings([]));
let clientBranding = $state(mapBranding(PROJECT_HOSTNAME, []));

// Prevents re-deriving config on every client-side navigation.
let clientConfigApplied = false;

type RequestStore = {
  cache: ConfigCache;
  // Lazily populated from `cache` on first read, then reused - safe to memoize
  // here (unlike in module state) because the store itself is already scoped to
  // one request. Cleared whenever `cache` is replaced, so a stale derived value
  // can never outlive the raw data it came from.
  derived: { features?: Features; settings?: Settings; branding?: Branding };
};

// Per-request isolated store for SSR; avoids cross-request state bleed.
const requestCache = browser ? null : new AsyncLocalStorage<RequestStore>();

// Wraps resolve(event) in hooks.server.ts to scope a fresh store to each request.
export function runWithConfig<T>(fn: () => T): T {
  return requestCache!.run({ cache: EMPTY_CACHE, derived: {} }, fn);
}

function serverStore(): RequestStore {
  const store = requestCache!.getStore();
  if (!store) {
    throw new Error(
      'config accessed outside a request context - is this running outside runWithConfig()?',
    );
  }
  return store;
}

export const config = {
  get features() {
    if (browser) return clientFeatures;
    const store = serverStore();
    return (store.derived.features ??= mapFeatures(store.cache.features));
  },
  get settings() {
    if (browser) return clientSettings;
    const store = serverStore();
    return (store.derived.settings ??= mapSettings(store.cache.settings));
  },
  get branding() {
    if (browser) return clientBranding;
    const store = serverStore();
    return (store.derived.branding ??= mapBranding(PROJECT_HOSTNAME, store.cache.branding));
  },
};

export function applyConfig(cache: ConfigCache): void {
  if (browser) {
    if (clientConfigApplied) return;
    clientFeatures = mapFeatures(cache.features);
    clientSettings = mapSettings(cache.settings);
    clientBranding = mapBranding(PROJECT_HOSTNAME, cache.branding);
    clientConfigApplied = true;
    return;
  }
  const store = serverStore();
  store.cache = cache;
  store.derived = {};
}

// Resets to defaults; intended for use between test cases.
export function resetConfig(): void {
  if (browser) {
    clientFeatures = mapFeatures([]);
    clientSettings = mapSettings([]);
    clientBranding = mapBranding(PROJECT_HOSTNAME, []);
    clientConfigApplied = false;
    return;
  }
  const store = serverStore();
  store.cache = EMPTY_CACHE;
  store.derived = {};
}
