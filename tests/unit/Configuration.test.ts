import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  mapFeatures,
  mapSettings,
  resolveConfigMap,
  getConfigMode,
  defaults,
  type ConfigObject,
} from '$lib/models/Configuration';

const TOUCHED_ENV_KEYS = [
  'VITE_CONFIG_MODE',
  'VITE_ANALYZE_ANALYSIS',
  'VITE_OPEN',
  'VITE_GOOGLE_ANALYTICS_ID',
  'VITE_MAX_DATA_POINTS_FOR_EXPORT',
];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of TOUCHED_ENV_KEYS) {
    savedEnv[key] = import.meta.env[key];
    delete import.meta.env[key];
  }
});

afterEach(() => {
  for (const key of TOUCHED_ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete import.meta.env[key];
    } else {
      import.meta.env[key] = savedEnv[key];
    }
  }
});

function apiRow(name: string, value: string): ConfigObject {
  return { name, value };
}

describe('getConfigMode', () => {
  it('defaults to seed when unset', () => {
    expect(getConfigMode()).toBe('seed');
  });

  it('defaults to seed for invalid values', () => {
    import.meta.env.VITE_CONFIG_MODE = 'Override';
    expect(getConfigMode()).toBe('seed');

    import.meta.env.VITE_CONFIG_MODE = 'foo';
    expect(getConfigMode()).toBe('seed');

    import.meta.env.VITE_CONFIG_MODE = '';
    expect(getConfigMode()).toBe('seed');
  });

  it('is override only for the exact string "override"', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    expect(getConfigMode()).toBe('override');
  });
});

describe('mapFeatures / mapSettings - regression baseline', () => {
  it('matches defaults when no API rows and no env vars are set', () => {
    expect(mapFeatures([]).analyzeAnalysis).toBe(defaults.features.ANALYZE_ANALYSIS);
    expect(mapSettings([]).maxDataPointsForExport).toBe(
      defaults.settings.MAX_DATA_POINTS_FOR_EXPORT,
    );
  });
});

describe('resolveConfigMap - layering', () => {
  const testDefaults = { ANALYZE_ANALYSIS: true };

  it('env-only (seed mode): env value is used when API has nothing', () => {
    import.meta.env.VITE_ANALYZE_ANALYSIS = 'false';
    const map = resolveConfigMap(testDefaults, []);
    expect(map.ANALYZE_ANALYSIS.value).toBe('false');
  });

  it('API-only: API value is used regardless of mode, env layer is a no-op when absent', () => {
    const map = resolveConfigMap(testDefaults, [apiRow('ANALYZE_ANALYSIS', 'false')]);
    expect(map.ANALYZE_ANALYSIS.value).toBe('false');
  });

  it('seed mode (default): API wins over env when both are set', () => {
    import.meta.env.VITE_ANALYZE_ANALYSIS = 'false';
    const map = resolveConfigMap(testDefaults, [apiRow('ANALYZE_ANALYSIS', 'true')]);
    expect(map.ANALYZE_ANALYSIS.value).toBe('true');
  });

  it('override mode: env wins over API when both are set', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_ANALYZE_ANALYSIS = 'false';
    const map = resolveConfigMap(testDefaults, [apiRow('ANALYZE_ANALYSIS', 'true')]);
    expect(map.ANALYZE_ANALYSIS.value).toBe('false');
  });

  it('presence, not truthiness: an explicit empty-string env override wins in override mode', () => {
    const settingsDefaults = { GOOGLE_ANALYTICS_ID: '' };
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_GOOGLE_ANALYTICS_ID = '';
    const map = resolveConfigMap(settingsDefaults, [apiRow('GOOGLE_ANALYTICS_ID', 'UA-REAL-ID')]);
    expect(map.GOOGLE_ANALYTICS_ID.value).toBe('');
  });
});

describe('mapSettings - VARIANT_EXPLORER_TYPE direct access', () => {
  it('resolves through the merged map via env override', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_MAX_DATA_POINTS_FOR_EXPORT = '42';
    const settings = mapSettings([apiRow('MAX_DATA_POINTS_FOR_EXPORT', '1000')]);
    expect(settings.maxDataPointsForExport).toBe(42);
  });
});
