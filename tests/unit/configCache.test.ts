import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ENV_KEYS = [
  'VITE_ORIGIN',
  'VITE_API_CONFIG_FEATURES',
  'VITE_API_CONFIG_SETTINGS',
  'VITE_API_CONFIG_BRANDING',
  'VITE_MAX_CONFIG_RETRIES',
];

const savedEnv: Record<string, string | undefined> = {};

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

async function loadConfigCache() {
  vi.resetModules();
  return import('$lib/server/configCache');
}

describe('configCache', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = import.meta.env[key];
    }
    import.meta.env.VITE_ORIGIN = 'http://origin.test';
    import.meta.env.VITE_API_CONFIG_FEATURES = 'ui:featureFlag';
    import.meta.env.VITE_API_CONFIG_SETTINGS = 'ui:setting';
    import.meta.env.VITE_API_CONFIG_BRANDING = 'ui:branding';
    // Kept low so a failing kind exhausts retries after a single attempt instead of
    // walking the real exponential backoff schedule.
    import.meta.env.VITE_MAX_CONFIG_RETRIES = '0';

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete import.meta.env[key];
      } else {
        import.meta.env[key] = savedEnv[key];
      }
    }
  });

  it('caches a kind that succeeds even though another kind fails', async () => {
    const featuresData = [{ name: 'FEATURE_A', value: 'true' }];
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('ui:featureFlag')) return Promise.resolve(jsonResponse(featuresData));
      return Promise.reject(new Error('network error'));
    });

    const { getConfig } = await loadConfigCache();

    const pending = getConfig();
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.features).toEqual(featuresData);
    expect(result.settings).toEqual([]);
    expect(result.branding).toEqual([]);
  });

  it('retries only the kind that previously failed, leaving already-cached kinds alone', async () => {
    const featuresData = [{ name: 'FEATURE_A', value: 'true' }];
    let settingsAttempts = 0;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('ui:featureFlag')) return Promise.resolve(jsonResponse(featuresData));
      if (url.includes('ui:setting')) {
        settingsAttempts += 1;
        return Promise.reject(new Error('network error'));
      }
      return Promise.resolve(jsonResponse([]));
    });

    const { getConfig } = await loadConfigCache();

    const first = getConfig();
    await vi.runAllTimersAsync();
    await first;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(settingsAttempts).toBe(1);

    const second = getConfig();
    await vi.runAllTimersAsync();
    const result = await second;

    // features/branding are still fresh and shouldn't be re-fetched; settings failed
    // last time so it's retried.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(settingsAttempts).toBe(2);
    expect(result.features).toEqual(featuresData);
    expect(result.settings).toEqual([]);
  });
});
