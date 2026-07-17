import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  mapFeatures,
  mapSettings,
  resolveConfigMap,
  getConfigMode,
  parsers,
  type ConfigObject,
  type ConfigMap,
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

describe('parsers', () => {
  const map: ConfigMap = {
    BOOL_TRUE: apiRow('BOOL_TRUE', 'true'),
    BOOL_OTHER: apiRow('BOOL_OTHER', 'yes'),
    BOOL_BLANK: apiRow('BOOL_BLANK', ''),
    BOOL_WHITESPACE: apiRow('BOOL_WHITESPACE', '   '),
    INT_VALID: apiRow('INT_VALID', '42'),
    INT_INVALID: apiRow('INT_INVALID', 'not-a-number'),
    INT_BLANK: apiRow('INT_BLANK', ''),
    INT_WHITESPACE: apiRow('INT_WHITESPACE', '   '),
    JSON_VALID: apiRow('JSON_VALID', '{"a":1}'),
    JSON_INVALID: apiRow('JSON_INVALID', '{not json}'),
    JSON_EMPTY_LIST: apiRow('JSON_EMPTY_LIST', '[]'),
    JSON_BLANK: apiRow('JSON_BLANK', ''),
    JSON_WHITESPACE: apiRow('JSON_WHITESPACE', '   '),
    STRING_SET: apiRow('STRING_SET', 'hello'),
    STRING_EMPTY: apiRow('STRING_EMPTY', ''),
  };
  const parse = parsers(map);

  describe('asBoolean', () => {
    it('returns the default when the key is absent', () => {
      expect(parse.asBoolean('MISSING', true)).toBe(true);
      expect(parse.asBoolean('MISSING', false)).toBe(false);
    });

    it('returns true only for the exact string "true"', () => {
      expect(parse.asBoolean('BOOL_TRUE', false)).toBe(true);
    });

    it('returns false for any other string value, ignoring the default', () => {
      expect(parse.asBoolean('BOOL_OTHER', true)).toBe(false);
    });

    it('returns the default when the value is blank, rather than coercing to false', () => {
      expect(parse.asBoolean('BOOL_BLANK', true)).toBe(true);
    });

    it('returns the default when the value is whitespace-only, rather than coercing to false', () => {
      expect(parse.asBoolean('BOOL_WHITESPACE', true)).toBe(true);
    });
  });

  describe('asInt', () => {
    it('returns the default when the key is absent', () => {
      expect(parse.asInt('MISSING', 7)).toBe(7);
    });

    it('parses a numeric string', () => {
      expect(parse.asInt('INT_VALID', 0)).toBe(42);
    });

    it('returns the default when the value is present but not numeric, rather than NaN', () => {
      expect(parse.asInt('INT_INVALID', 7)).toBe(7);
    });

    it('returns the default when the value is blank, rather than NaN', () => {
      expect(parse.asInt('INT_BLANK', 7)).toBe(7);
    });

    it('returns the default when the value is whitespace-only, rather than NaN', () => {
      expect(parse.asInt('INT_WHITESPACE', 7)).toBe(7);
    });
  });

  describe('asJson', () => {
    it('returns the default when the key is absent', () => {
      const fallback = { foo: 'bar' };
      expect(parse.asJson('MISSING', fallback)).toBe(fallback);
    });

    it('parses valid JSON', () => {
      expect(parse.asJson('JSON_VALID', {})).toEqual({ a: 1 });
    });

    it('returns the default when the value is present but not valid JSON, rather than throwing', () => {
      const fallback = { foo: 'bar' };
      expect(parse.asJson('JSON_INVALID', fallback)).toBe(fallback);
    });

    it('returns the default when the value is blank, rather than throwing', () => {
      const fallback = ['default'];
      expect(parse.asJson('JSON_BLANK', fallback)).toBe(fallback);
    });

    it('returns the default when the value is whitespace-only, rather than throwing', () => {
      const fallback = ['default'];
      expect(parse.asJson('JSON_WHITESPACE', fallback)).toBe(fallback);
    });

    it('respects a deliberately empty list, distinct from a blank value', () => {
      expect(parse.asJson('JSON_EMPTY_LIST', ['default'])).toEqual([]);
    });
  });

  describe('asString', () => {
    it('returns the default when the key is absent', () => {
      expect(parse.asString('MISSING', 'default')).toBe('default');
    });

    it('returns the value when present', () => {
      expect(parse.asString('STRING_SET', 'default')).toBe('hello');
    });

    it('returns an explicit empty string rather than the default (presence, not truthiness)', () => {
      expect(parse.asString('STRING_EMPTY', 'default')).toBe('');
    });
  });
});

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
    expect(mapFeatures([]).analyzeAnalysis).toBe(false);
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
