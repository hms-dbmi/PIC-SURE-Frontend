import { browser } from '$app/environment';

import type { ConfigCache } from './models/Configuration';
import { mapFeatures, mapSettings, mapBranding } from './models/Configuration';

// node:async_hooks can't be statically imported here - this module is bundled for
// both environments, and static imports are evaluated before any browser check runs.
// import.meta.env.SSR is a build-time constant, so this branch is tree-shaken out
// of the browser bundle entirely.
const serverConfig = import.meta.env.SSR ? await import('./server/configuration') : null;

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

// Stable reactive state for the single browser session.
let clientFeatures = $state(mapFeatures([]));
let clientSettings = $state(mapSettings([]));
let clientBranding = $state(mapBranding(PROJECT_HOSTNAME, []));

// Prevents re-deriving config on every client-side navigation.
let clientConfigApplied = false;

export const config = {
  get features() {
    if (browser) return clientFeatures;
    const store = serverConfig!.serverStore();
    return (store.derived.features ??= mapFeatures(store.cache.features));
  },
  get settings() {
    if (browser) return clientSettings;
    const store = serverConfig!.serverStore();
    return (store.derived.settings ??= mapSettings(store.cache.settings));
  },
  get branding() {
    if (browser) return clientBranding;
    const store = serverConfig!.serverStore();
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
  const store = serverConfig!.serverStore();
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
  const store = serverConfig!.serverStore();
  store.cache = serverConfig!.EMPTY_CACHE;
  store.derived = {};
}
