import type { LayoutServerLoad } from './$types';
import { getAllProviderData } from '$lib/AuthProviderRegistry.ts';
import { getConfig } from '$lib/server/configCache';
import { TEST_CONFIG_COOKIE } from '$lib/testConfig';
import type { ConfigCache } from '$lib/models/Configuration';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const providers = getAllProviderData();
  let configCache: ConfigCache | undefined;

  if (import.meta.env.MODE === 'test') {
    const override = cookies.get(TEST_CONFIG_COOKIE);
    if (override) {
      try {
        configCache = JSON.parse(decodeURIComponent(override));
      } catch {
        // Malformed test cookie - fall through to the real cache below.
      }
    }
  }

  // Only hit the real (possibly slow, retry-backed) cache when there's no test
  // override to use instead - a test asserting on mocked config shouldn't pay for
  // a real fetch whose result gets discarded anyway.
  if (!configCache) {
    configCache = await getConfig();
  }

  return {
    providers: providers,
    configCache,
  };
};
