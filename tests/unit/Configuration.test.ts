import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  mapFeatures,
  mapSettings,
  resolveConfigMap,
  getConfigMode,
  type ConfigObject,
  mapBranding,
} from '$lib/models/Configuration';

const TOUCHED_ENV_KEYS = [
  'VITE_CONFIG_MODE',
  'VITE_ANALYZE_ANALYSIS',
  'VITE_EXPLORE_TOUR_SEARCH_TERM',
  'VITE_MAX_DATA_POINTS_FOR_EXPORT',
  'VITE_LOGO_ALT',
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

describe('mapFeatures / mapSettings / mapBranding - regression baseline', () => {
  it('matches defaults when no API rows and no env vars are set', () => {
    expect(mapFeatures([]).analyzeAnalysis).toBe(true);
    expect(mapSettings([]).maxDataPointsForExport).toBe(1000000);
    expect(mapBranding('', []).login.logoHeight).toBe(7.5);
  });
});

describe('resolveConfigMap - layering', () => {
  // assumes default: ANALYZE_ANALYSIS = true
  //assumes default: EXPLORE_TOUR_SEARCH_TERM = age

  it('env-only (seed mode): env value is used when API has nothing', () => {
    import.meta.env.VITE_ANALYZE_ANALYSIS = 'false';
    const map = resolveConfigMap([]);
    expect(map.ANALYZE_ANALYSIS.value).toBe('false');
  });

  it('API-only: API value is used regardless of mode, env layer is a no-op when absent', () => {
    const map = resolveConfigMap([apiRow('ANALYZE_ANALYSIS', 'false')]);
    expect(map.ANALYZE_ANALYSIS.value).toBe('false');
  });

  it('seed mode (default): API wins over env when both are set', () => {
    import.meta.env.VITE_EXPLORE_TOUR_SEARCH_TERM = 'cats';
    const map = resolveConfigMap([apiRow('EXPLORE_TOUR_SEARCH_TERM', 'dogs')]);
    expect(map.EXPLORE_TOUR_SEARCH_TERM.value).toBe('dogs');
  });

  it('override mode: env wins over API when both are set', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_EXPLORE_TOUR_SEARCH_TERM = 'cats';
    const map = resolveConfigMap([apiRow('EXPLORE_TOUR_SEARCH_TERM', 'dogs')]);
    expect(map.EXPLORE_TOUR_SEARCH_TERM.value).toBe('cats');
  });

  it('presence, not truthiness: an explicit empty-string env override wins in override mode', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_EXPLORE_TOUR_SEARCH_TERM = '';
    const map = resolveConfigMap([apiRow('EXPLORE_TOUR_SEARCH_TERM', 'dogs')]);
    expect(map.EXPLORE_TOUR_SEARCH_TERM.value).toBe('');
  });
});

describe('mapBranding', () => {
  it('replaces hostname when encountered', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_MAX_DATA_POINTS_FOR_EXPORT = '42';
    const branding = mapBranding('', []);
    expect(branding.explorePage.codeBlocks.PythonAPI).not.toContain('{{PICSURE_NETWORK_URL}}');
  });
  it('env overrides config json', () => {
    import.meta.env.VITE_LOGO_ALT = 'SOME ALT VALUE';
    const branding = mapBranding('', []);
    expect(branding.logo.alt).toBe('SOME ALT VALUE');
  });
  it('api overrides config json', () => {
    const branding = mapBranding('', [apiRow('LOGO_ALT', 'SOME ALT VALUE')]);
    expect(branding.logo.alt).toBe('SOME ALT VALUE');
  });
  it('seed mode (default): API wins over env when both are set', () => {
    import.meta.env.VITE_LOGO_ALT = 'cats';
    const branding = mapBranding('', [apiRow('LOGO_ALT', 'dogs')]);
    expect(branding.logo.alt).toBe('dogs');
  });
  it('override mode: env wins over API when both are set', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_LOGO_ALT = 'cats';
    const branding = mapBranding('', [apiRow('LOGO_ALT', 'dogs')]);
    expect(branding.logo.alt).toBe('cats');
  });
});
