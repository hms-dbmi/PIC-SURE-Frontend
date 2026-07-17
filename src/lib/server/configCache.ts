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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleResponse(res: Response): Promise<any> {
  if (res.ok || res.status === 422) {
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('application/octet-stream')) {
      return await res.arrayBuffer();
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  error(res.status as NumericRange<400, 599>, await res.text());
}

async function fetchWithRetry(
  url: string,
  type: string,
  retries = MAX_RETRIES + 1,
  delay = INITIAL_DELAY,
): Promise<ConfigObject[] | null> {
  if (retries > MAX_RETRIES) {
    // Don't reach out on the first delay - let the app cool for a few seconds then try,
    // in case other resources are still loading up.
    await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY * 2));
    return fetchWithRetry(url, type, retries - 1, delay);
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

async function getConfigKind(kind: ConfigKind, force: boolean): Promise<void> {
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
      ? fetchWithRetry(`${configUrl}?kind=${configKinds[kind]}`, kind)
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

export async function getConfig(force: boolean = false): Promise<ConfigCache> {
  await Promise.allSettled([
    getConfigKind('features', force),
    getConfigKind('settings', force),
    getConfigKind('branding', force),
  ]);
  return cached;
}

// Optional: Function to invalidate cache
export function invalidateConfig() {
  (Object.keys(cached) as ConfigKind[]).forEach((k) => (cached[k] = []));
  (Object.keys(lastKindFetch) as ConfigKind[]).forEach((k) => (lastKindFetch[k] = 0));
}
