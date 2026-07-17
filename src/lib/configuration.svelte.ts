import { browser } from '$app/environment';

import type { ConfigCache } from './models/Configuration';
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

let features = $state(mapFeatures([]));
let settings = $state(mapSettings([]));
let branding = $state(mapBranding(PROJECT_HOSTNAME, []));
// Client-only: root layout's load (src/routes/+layout.ts) re-runs applyConfig() on
// every client-side navigation, but the underlying configCache doesn't change
// without a fresh SSR request (see src/routes/+layout.server.ts) - skip re-deriving
// from the same payload once already applied. Server-side always re-applies (browser
// is false there), since each request may carry its own data (e.g. per-test config
// cookies in e2e, or a real config refresh on the next load). Unset this if a live
// invalidate()-driven refresh is ever added on the client.
let configApplied = false;

export const config = {
  get features() {
    return features;
  },
  get settings() {
    return settings;
  },
  get branding() {
    return branding;
  },
};

export function applyConfig(cache: ConfigCache): void {
  if (browser && configApplied) return;
  // Always derive from the payload, even when a category is empty - empty is a
  // meaningful value (no rows for this category, or a test/refresh clearing it),
  // not "skip this category". getConfig() (see $lib/server/configCache.ts) already
  // preserves the last known-good cache on a failed fetch instead of wiping it to
  // [], so a genuine fetch failure never reaches here as an empty array. mapFeatures/
  // mapSettings/mapBranding themselves fall back to defaults per-field on a bad row
  // (see parsers()/withNonBlank in models/Configuration.ts) instead of throwing, so
  // there's no need to guard against one of these calls failing here.
  features = mapFeatures(cache.features);
  settings = mapSettings(cache.settings);
  branding = mapBranding(PROJECT_HOSTNAME, cache.branding);
  if (browser) configApplied = true;
}

// Unconditional reset to defaults, equivalent to applyConfig with all-empty
// categories. Tests use this as an explicit reset primitive between cases.
export function resetConfig(): void {
  features = mapFeatures([]);
  settings = mapSettings([]);
  branding = mapBranding(PROJECT_HOSTNAME, []);
  configApplied = false;
}
