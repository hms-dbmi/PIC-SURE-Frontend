import { error, type NumericRange } from '@sveltejs/kit';
import { type ConfigObject, configKinds } from '$lib/models/Configuration';
import { Picsure } from '$lib/paths';

const ORIGIN = import.meta.env?.VITE_ORIGIN;

type ConfigCache = { settings: ConfigObject[]; features: ConfigObject[] };

// Cache store
let cached: ConfigCache = {
  settings: [],
  features: [],
};
let lastFetch: number = 0;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

// Retry configuration
const MAX_RETRIES = import.meta.env?.VITE_MAX_CONFIG_RETRIES || 3;
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 60000; // 60 seconds
let fetching: {
  features: Promise<ConfigObject[] | null>;
  settings: Promise<ConfigObject[] | null>;
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
  retries = MAX_RETRIES,
  delay = INITIAL_DELAY,
): Promise<ConfigObject[] | null> {
  return fetch(url, { method: 'GET' })
    .then(handleResponse)
    .catch(async () => {
      if (retries <= 0) {
        return null;
      }

      console.warn(
        `Config ${type} fetch failed, retrying in ${delay}ms... (${retries} attempts remaining)`,
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
  if (
    !force &&
    cached.settings.length > 0 &&
    cached.features.length > 0 &&
    now - lastFetch < CACHE_DURATION
  ) {
    console.log('Returning cached configs from server');
    return cached;
  }

  if (fetching === null) {
    // Fetch fresh configs
    console.log('Reaching out to get configs from server');
    const configUrl = `${ORIGIN}/${Picsure.Configuration.Get}`;
    fetching = {
      features: fetchWithRetry(`${configUrl}?kind=${configKinds.features}`, 'features'),
      settings: fetchWithRetry(`${configUrl}?kind=${configKinds.settings}`, 'settings'),
    };
  }
  await Promise.allSettled([fetching.features, fetching.settings]).then(
    (results: PromiseSettledResult<ConfigObject[] | null>[]) => {
      if (results.some((val) => val.status === 'fulfilled' && val.value === null)) {
        console.error(
          `Failed fetching some configs - returned cached data might be defaults. Next request will retry.`,
        );
      } else if (
        results.every(
          (val) => val.status === 'fulfilled' && val.value !== null && val.value.length > 0,
        )
      ) {
        lastFetch = now;
        cached.features =
          results[0].status === 'fulfilled' && results[0].value !== null ? results[0].value : [];
        cached.settings =
          results[1].status === 'fulfilled' && results[1].value !== null ? results[1].value : [];
      }
      fetching = null;
    },
  );
  return cached;
}

// Optional: Function to invalidate cache
export function invalidateConfig() {
  cached = { settings: [], features: [] };
  lastFetch = 0;
}
