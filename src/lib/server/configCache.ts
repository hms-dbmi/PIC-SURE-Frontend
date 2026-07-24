import { error, type NumericRange } from '@sveltejs/kit';
import type { ConfigObject, ConfigCache, ConfigKind } from '$lib/models/Configuration';
import { CONFIG_API_KIND } from '$lib/models/Configuration';
import { Picsure } from '$lib/paths';
import { withBackoff } from '$lib/utilities/backoff';

const ORIGIN = import.meta.env?.VITE_ORIGIN;

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
const CACHE_DURATION = 4 * 60 * 60 * 1000;

const MAX_RETRIES = Number(import.meta.env?.VITE_MAX_CONFIG_RETRIES ?? 3);
const INITIAL_DELAY = 5000;
const MAX_DELAY = 600000;

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

async function fetchWithRetry(url: string, type: string): Promise<ConfigObject[] | null> {
  try {
    // +1 because MAX_RETRIES counts retries after the first attempt, not total attempts.
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

async function getConfigKind(kind: ConfigKind, force: boolean): Promise<void> {
  const now = Date.now();
  if (!force && lastKindFetch[kind] > 0 && now - lastKindFetch[kind] < CACHE_DURATION) {
    return Promise.resolve();
  }

  // Chained once here, not per caller, so concurrent callers awaiting the same
  // in-flight fetch don't each re-log completion and re-run the cache write.
  if (fetchingKind[kind] === null) {
    console.log(`Attempting configuration cache hydration for ${kind}`);
    const configUrl = `${ORIGIN}/${Picsure.Configuration.Get}`;
    const errorMsg = `Configuration cache hydration failures: returned cached data for ${kind} might be defaults or outdated. Next request will retry.`;
    fetchingKind[kind] = (
      CONFIG_API_KIND[kind]
        ? fetchWithRetry(`${configUrl}?kind=${CONFIG_API_KIND[kind]}`, kind)
        : Promise.resolve([])
    )
      .then((results: ConfigObject[] | null) => {
        if (results === null) {
          console.error(errorMsg);
        } else {
          // Stamped on completion, not request, so backoff retries don't shorten
          // the cache's effective TTL.
          lastKindFetch[kind] = Date.now();
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

// A failed forced refresh leaves cached data as-is rather than clearing it.
export async function getConfig(force: boolean = false): Promise<ConfigCache> {
  await Promise.allSettled([
    getConfigKind('features', force),
    getConfigKind('settings', force),
    getConfigKind('branding', force),
  ]);
  return cached;
}
