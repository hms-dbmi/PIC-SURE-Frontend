import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { describeConfigField } from '$lib/models/ConfigResolution';
import { resolveConfigMap, type ConfigObject } from '$lib/models/Configuration';

const TOUCHED_ENV_KEYS = ['VITE_CONFIG_MODE', 'VITE_ANALYZE_ANALYSIS'];
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of TOUCHED_ENV_KEYS) {
    savedEnv[key] = import.meta.env[key];
    delete import.meta.env[key];
  }
});

afterEach(() => {
  for (const key of TOUCHED_ENV_KEYS) {
    if (savedEnv[key] === undefined) delete import.meta.env[key];
    else import.meta.env[key] = savedEnv[key];
  }
});

function apiRow(name: string, value: string): ConfigObject {
  return { name, value };
}

// describeConfigField must always agree with resolveConfigMap's own precedence -
// otherwise the admin UI's origin pill/disabled state could lie about what the app
// actually resolves at runtime.
describe('describeConfigField', () => {
  it('is "default" when neither env nor API set the field', () => {
    expect(describeConfigField('ANALYZE_ANALYSIS', []).origin).toBe('default');
    expect(describeConfigField('ANALYZE_ANALYSIS', []).disabled).toBe(false);
  });

  it('is "env", not disabled, in seed mode when only env is set', () => {
    import.meta.env.VITE_ANALYZE_ANALYSIS = 'true';
    const field = describeConfigField('ANALYZE_ANALYSIS', []);
    expect(field.origin).toBe('env');
    expect(field.disabled).toBe(false);
  });

  it('is "api" in seed mode when only API is set', () => {
    const rows = [apiRow('ANALYZE_ANALYSIS', 'true')];
    expect(describeConfigField('ANALYZE_ANALYSIS', rows).origin).toBe('api');
  });

  it('agrees with resolveConfigMap: seed mode, both set -> API wins, not disabled', () => {
    import.meta.env.VITE_ANALYZE_ANALYSIS = 'false';
    const rows = [apiRow('ANALYZE_ANALYSIS', 'true')];
    const field = describeConfigField('ANALYZE_ANALYSIS', rows);
    const resolved = resolveConfigMap(rows);
    expect(field.origin).toBe('api');
    expect(field.disabled).toBe(false);
    expect(resolved.ANALYZE_ANALYSIS.value).toBe(field.apiRow?.value);
  });

  it('agrees with resolveConfigMap: override mode, both set -> env wins and field is disabled', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    import.meta.env.VITE_ANALYZE_ANALYSIS = 'false';
    const rows = [apiRow('ANALYZE_ANALYSIS', 'true')];
    const field = describeConfigField('ANALYZE_ANALYSIS', rows);
    const resolved = resolveConfigMap(rows);
    expect(field.origin).toBe('env');
    expect(field.disabled).toBe(true);
    expect(resolved.ANALYZE_ANALYSIS.value).toBe(field.envValue);
  });

  it('override mode, only API set -> API wins, not disabled (env absence means no override to fight)', () => {
    import.meta.env.VITE_CONFIG_MODE = 'override';
    const rows = [apiRow('ANALYZE_ANALYSIS', 'true')];
    const field = describeConfigField('ANALYZE_ANALYSIS', rows);
    expect(field.origin).toBe('api');
    expect(field.disabled).toBe(false);
  });
});
