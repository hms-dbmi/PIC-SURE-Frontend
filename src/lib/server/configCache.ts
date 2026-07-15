import { error, type NumericRange } from '@sveltejs/kit';
import type { ConfigObject, ConfigCache } from '$lib/models/Configuration';
import { Picsure } from '$lib/paths';

const ORIGIN = import.meta.env?.VITE_ORIGIN;
const configKinds = {
  features: import.meta.env.VITE_API_CONFIG_FEATURES || '',
  settings: import.meta.env.VITE_API_CONFIG_SETTINGS || '',
  branding: import.meta.env.VITE_API_CONFIG_BRANDING || '',
};

// Cache store
let cached: ConfigCache = {
  settings: [],
  features: [],
  branding: [],
};
let lastFetch: number = 0;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

// Retry configuration
const MAX_RETRIES = Number(import.meta.env?.VITE_MAX_CONFIG_RETRIES ?? 3);
const INITIAL_DELAY = 5000; // 5 second
const MAX_DELAY = 600000; // 10 minutes
let fetching: {
  features: Promise<ConfigObject[] | null>;
  settings: Promise<ConfigObject[] | null>;
  branding: Promise<ConfigObject[] | null>;
} | null = null;

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
      return text; //TODO: Change this
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
  if (retries > MAX_RETRIES){
    // Don't reach out on the first delay - let the app cool for a few seconds then try, 
    // in case other resources are still loading up.
    await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY * 2));
    return fetchWithRetry(url, type, retries - 1, delay);
  }
  return fetch(url, { method: 'GET' })
    .then(handleResponse)
    .catch(async (e) => {
      console.error("Config failed with", e);
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

export async function getConfig(force: boolean = false): Promise<ConfigCache> {
  // Return cached config if available and not expired
  const now = Date.now();
  if (!force && lastFetch > 0 && now - lastFetch < CACHE_DURATION) {
    return cached;
  }

  if (fetching === null) {
    // Fetch fresh configs
    console.log('Attempting configuraiton cache hydration');
    const configUrl = `${ORIGIN}/${Picsure.Configuration.Get}`;
    fetching = {
      features: configKinds.features
        ? fetchWithRetry(`${configUrl}?kind=${configKinds.features}`, 'features')
        : Promise.resolve([]),
      settings: configKinds.settings
        ? fetchWithRetry(`${configUrl}?kind=${configKinds.settings}`, 'settings')
        : Promise.resolve([]),
      branding: configKinds.branding
        ? fetchWithRetry(`${configUrl}?kind=${configKinds.branding}`, 'branding')
        : Promise.resolve([]),
    };
  }
  await Promise.allSettled([fetching.features, fetching.settings, fetching.branding]).then(
    (results: PromiseSettledResult<ConfigObject[] | null>[]) => {
      if (results.some((val) => val.status === 'fulfilled' && val.value === null)) {
        console.error(
          'Configuration cache hydration failures: returned cached data might be defaults. Next request will retry.',
        );
      } else if (results.every((val) => val.status === 'fulfilled' && val.value !== null)) {
        lastFetch = now;
        cached.features = (results[0] as PromiseFulfilledResult<ConfigObject[]>).value ?? [];
        cached.settings = (results[1] as PromiseFulfilledResult<ConfigObject[]>).value ?? [];
        cached.branding = (results[2] as PromiseFulfilledResult<ConfigObject[]>).value ?? [];
        console.log('Configuration cache hydration complete');
      }
      fetching = null;
    },
  );
  return cached;
}

// Optional: Function to invalidate cache
export function invalidateConfig() {
  cached = { settings: [], features: [], branding: [] };
  lastFetch = 0;
}
