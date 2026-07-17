import { error, type NumericRange } from '@sveltejs/kit';
import type { ConfigObject, ConfigCache } from '$lib/models/Configuration';
import { Picsure } from '$lib/paths';

type ConfigKind = keyof ConfigCache;

const ORIGIN = import.meta.env?.VITE_ORIGIN;
const configKinds: Record<ConfigKind, string> = {
  features: import.meta.env.VITE_API_CONFIG_FEATURES || '',
  settings: import.meta.env.VITE_API_CONFIG_SETTINGS || '',
  branding: import.meta.env.VITE_API_CONFIG_BRANDING || '',
};

// Cache store
const cached: ConfigCache = {
  settings: [],
  features: [],
  branding: [],
};
const lastKindFetch: Record<ConfigKind, number> = {
  features: 0,
  settings: 0,
  branding: 0,
};
const fetchingKind: Record<ConfigKind, Promise<ConfigObject[] | null> | null> = {
  features: null,
  settings: null,
  branding: null,
};
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

// Retry configuration
const MAX_RETRIES = Number(import.meta.env?.VITE_MAX_CONFIG_RETRIES ?? 3);
const INITIAL_DELAY = 5000; // 5 second
const MAX_DELAY = 600000; // 10 minutes

// Applied only to the very first hydration attempt this process ever makes (see
// getConfig()) - gives other resources a moment to finish starting up. Later
// hydrations (a routine 4-hour cache refresh, or an admin-triggered /api/config/refresh)
// have no reason to wait, so they skip straight to the fetch.
const STARTUP_COOLDOWN = INITIAL_DELAY * 2;

// The config endpoint only ever returns a JSON array of config rows - unlike
// api.ts's general-purpose handleResponse (which this was adapted from), there's no
// binary/plain-text response to support here. Anything that isn't a parseable JSON
// array is a failure, not data: throwing lets fetchWithRetry's catch retry it like
// any other fetch failure, instead of getConfigKind caching unusable data as if it
// were a real config payload.
async function handleResponse(res: Response): Promise<ConfigObject[]> {
  if (!(res.ok || res.status === 422)) {
    error(res.status as NumericRange<400, 599>, await res.text());
  }

  const text = await res.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array of config rows, got ${typeof parsed}`);
  }
  return parsed;
}

async function fetchWithRetry(
  url: string,
  type: string,
  retries = MAX_RETRIES,
  delay = INITIAL_DELAY,
  applyStartupCooldown = false,
): Promise<ConfigObject[] | null> {
  if (applyStartupCooldown) {
    // Don't reach out on the first delay - let the app cool for a few seconds then try,
    // in case other resources are still loading up. Only applies on cold start (see
    // STARTUP_COOLDOWN callers) - later refreshes pass applyStartupCooldown = false, so
    // they skip straight to the fetch below.
    await new Promise((resolve) => setTimeout(resolve, STARTUP_COOLDOWN));
    return fetchWithRetry(url, type, retries, delay, false);
  }
  return fetch(url, { method: 'GET' })
    .then(handleResponse)
    .catch(async (e) => {
      console.error('Config failed with', e);
      if (retries <= 0) {
        return null;
      }

      console.warn(
        `Config ${type} (${url}) fetch failed, retrying in ${delay}ms... (${retries} attempts remaining)`,
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff: double the delay, but cap at MAX_DELAY
      const nextDelay = Math.min(delay * 2, MAX_DELAY);

      return fetchWithRetry(url, type, retries - 1, nextDelay);
    });
}

async function getConfigKind(
  kind: ConfigKind,
  force: boolean,
  applyStartupCooldown: boolean,
): Promise<void> {
  // Return cached config if available and not expired
  const now = Date.now();
  if (!force && lastKindFetch[kind] > 0 && now - lastKindFetch[kind] < CACHE_DURATION) {
    return Promise.resolve();
  }

  if (fetchingKind[kind] === null) {
    // Fetch fresh config for kind
    console.log(`Attempting configuration cache hydration for ${kind}`);
    const configUrl = `${ORIGIN}/${Picsure.Configuration.Get}`;
    fetchingKind[kind] = configKinds[kind]
      ? fetchWithRetry(
          `${configUrl}?kind=${configKinds[kind]}`,
          kind,
          undefined,
          undefined,
          applyStartupCooldown,
        )
      : Promise.resolve([]);
  }

  const errorMsg = `Configuration cache hydration failures: returned cached data for ${kind} might be defaults or outdated. Next request will retry.`;
  await fetchingKind[kind]
    .then((results: ConfigObject[] | null) => {
      if (results === null) {
        console.error(errorMsg);
      } else {
        lastKindFetch[kind] = now;
        cached[kind] = results ?? [];
        console.log(`Configuration cache hydration complete for ${kind}`);
      }
    })
    .catch(() => console.error(errorMsg))
    .finally(() => (fetchingKind[kind] = null));

  return Promise.resolve();
}

// Set on the first call and never cleared - later calls (routine cache expiry,
// or an admin-triggered refresh) are never the "cold start" case, even after
// invalidateConfig() resets the per-kind fetch state below.
let hasHydratedBefore = false;

export async function getConfig(force: boolean = false): Promise<ConfigCache> {
  const applyStartupCooldown = !hasHydratedBefore;
  hasHydratedBefore = true;
  await Promise.allSettled([
    getConfigKind('features', force, applyStartupCooldown),
    getConfigKind('settings', force, applyStartupCooldown),
    getConfigKind('branding', force, applyStartupCooldown),
  ]);
  return cached;
}

// Optional: Function to invalidate cache
export function invalidateConfig() {
  (Object.keys(cached) as ConfigKind[]).forEach((k) => (cached[k] = []));
  (Object.keys(lastKindFetch) as ConfigKind[]).forEach((k) => (lastKindFetch[k] = 0));
}
