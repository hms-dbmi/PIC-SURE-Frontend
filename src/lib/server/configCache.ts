import { error, type NumericRange } from '@sveltejs/kit';
import type { ConfigObject, ConfigCache, ConfigKind } from '$lib/models/Configuration';
import { CONFIG_API_KIND } from '$lib/models/Configuration';
import { Picsure } from '$lib/paths';
import { withBackoff } from '$lib/utilities/backoff';

const ORIGIN = import.meta.env?.VITE_ORIGIN;

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

// Cold-start-only delay - see STARTUP_COOLDOWN's own comment. Applied once, before
// the retry sequence below even starts, not between individual retries.
function startupDelay(apply: boolean): Promise<void> {
  return apply
    ? new Promise((resolve) => setTimeout(resolve, STARTUP_COOLDOWN))
    : Promise.resolve();
}

async function fetchWithRetry(url: string, type: string): Promise<ConfigObject[] | null> {
  try {
    // maxAttempts counts the first attempt too, so +1 to keep MAX_RETRIES meaning
    // "retries after the first failure", matching this module's env var name. This
    // matters even at MAX_RETRIES = 0: without the +1, maxAttempts is 0, and
    // withBackoff's `for (attempt = 0; attempt < maxAttempts; ...)` loop then never
    // runs fn() at all - not even once.
    return await withBackoff(
      () => fetch(url, { method: 'GET' }).then(handleResponse),
      MAX_RETRIES + 1,
      INITIAL_DELAY,
      MAX_DELAY,
      (e, attempt) => {
        console.warn(
          `Config ${type} (${url}) fetch failed on attempt ${attempt + 1}/${MAX_RETRIES + 1}, retrying...`,
          e,
        );
        return true;
      },
    );
  } catch (e) {
    console.error('Config failed with', e);
    return null;
  }
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

  // The completion handling below (cache write + log) is chained onto the
  // fetch promise here, once, at creation time - not by each caller. Callers
  // that find fetchingKind[kind] already set just await the same promise
  // (see below); if they each attached their own .then(), every concurrent
  // caller would re-log "complete" and re-run the cache write for a single
  // underlying fetch.
  if (fetchingKind[kind] === null) {
    // Fetch fresh config for kind
    console.log(`Attempting configuration cache hydration for ${kind}`);
    const configUrl = `${ORIGIN}/${Picsure.Configuration.Get}`;
    const errorMsg = `Configuration cache hydration failures: returned cached data for ${kind} might be defaults or outdated. Next request will retry.`;
    fetchingKind[kind] = (
      CONFIG_API_KIND[kind]
        ? startupDelay(applyStartupCooldown).then(() =>
            fetchWithRetry(`${configUrl}?kind=${CONFIG_API_KIND[kind]}`, kind),
          )
        : Promise.resolve([])
    )
      .then((results: ConfigObject[] | null) => {
        if (results === null) {
          console.error(errorMsg);
        } else {
          lastKindFetch[kind] = now;
          cached[kind] = results ?? [];
          console.log(`Configuration cache hydration complete for ${kind}`);
        }
        return results;
      })
      .catch(() => {
        console.error(errorMsg);
        return null;
      })
      .finally(() => (fetchingKind[kind] = null));
  }

  await fetchingKind[kind];
}

// Set on the first call and never cleared - later calls (routine cache expiry, or
// a force = true admin-triggered refresh) are never the "cold start" case.
let hasHydratedBefore = false;

// force = true (see /api/config/refresh) bypasses the TTL check below to fetch
// regardless of freshness, but - like the routine TTL-expiry path - only touches
// `cached`/`lastKindFetch` for a kind on a successful fetch (see getConfigKind's
// fail-open handling). So a failed forced refresh never loses the last known-good
// config: it just leaves that kind exactly as stale as it already was, to be
// retried on the next request or the next explicit refresh.
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
