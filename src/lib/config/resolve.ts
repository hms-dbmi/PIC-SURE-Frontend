import type { Indexed } from '#lib/utils/objects.ts';

export type ConfigObject = {
  uuid?: string;
  name: string;
  kind?: string;
  value: string;
  description?: string;
  markForDelete?: boolean;
};

export type ConfigMap = Indexed<ConfigObject>;

export type ConfigCache = {
  settings: ConfigObject[];
  features: ConfigObject[];
  branding: ConfigObject[];
};

export type ConfigKind = 'features' | 'settings' | 'branding';

// Env variable config layer
//
// Lets a deployment pin or seed individual features/settings via VITE_<KEY> env vars,
// independent of whether the API is configured to return that config kind at all.
// VITE_CONFIG_MODE decides who wins when both an env var and an API row are set for
// the same field:
//   seed (default): defaults -> env (if set) -> API (if set) wins
//   override:       defaults -> API (if set) -> env (if set) wins
// Either way, defaults remain the floor - parsers() already falls back to `defaults[name]`
// when a key is absent from the map it's given, so this only needs to combine the sparse
// env-derived and API-derived maps in the right order before handing them to parsers().

export type ConfigMode = 'seed' | 'override';
const VITE_ENV_PREFIX = 'VITE_';

export function getConfigMode(): ConfigMode {
  return import.meta.env?.VITE_CONFIG_MODE === 'override' ? 'override' : 'seed';
}

export function envConfigMap(envPrefix: string = VITE_ENV_PREFIX): ConfigMap {
  const env = import.meta.env;
  return Object.keys(env).reduce((map: ConfigMap, key: string) => {
    if (!key.startsWith(envPrefix)) return map;
    const envKey = key.replaceAll(envPrefix, '');
    map[envKey] = { name: envKey, value: String(env[key]) };
    return map;
  }, {} as ConfigMap);
}

export function apiConfigMap(apiRows: ConfigObject[]): ConfigMap {
  return apiRows.reduce((map: ConfigMap, row: ConfigObject) => {
    map[row.name] = row;
    return map;
  }, {} as ConfigMap);
}

// Combines an already-built API map and env map by precedence, so callers that need
// to resolve just a handful of keys (e.g. the admin UI's per-field origin pill) aren't
// forced to rebuild both maps from scratch just to reuse this rule - see
// admin.ts's describeConfigField.
export function mergeConfigMaps(apiMap: ConfigMap, envMap: ConfigMap): ConfigMap {
  return getConfigMode() === 'override' ? { ...apiMap, ...envMap } : { ...envMap, ...apiMap };
}

export function resolveConfigMap(apiRows: ConfigObject[], envPrefix?: string): ConfigMap {
  return mergeConfigMaps(apiConfigMap(apiRows), envConfigMap(envPrefix));
}

// The "kind" value sent as ?kind=<value> to the backend and used to gate whether API
// overrides are available at all for a config kind - empty means the deployment
// hasn't wired up the API for that kind. Used both server-side (config/server/cache.ts's SSR
// bootstrap) and client-side (AdminConfiguration.ts's admin CRUD store,
// ConfigKindTab.svelte's "unavailable" messaging) - centralized here so the env var
// naming convention has exactly one place to change.
export const CONFIG_API_KIND: Record<ConfigKind, string> = {
  features: import.meta.env.VITE_API_CONFIG_FEATURES || '',
  settings: import.meta.env.VITE_API_CONFIG_SETTINGS || '',
  branding: import.meta.env.VITE_API_CONFIG_BRANDING || '',
};

// A blank (or whitespace-only) value is treated the same as an absent one - it
// falls back to the default rather than being coerced/parsed. asString is the
// one exception: an explicit empty string is a valid override there, so it
// only checks presence, not blankness.
// Also the single place that guards against a value transform throwing (asJson on
// invalid JSON) or otherwise failing to produce a usable value (asInt on a
// non-numeric string) - falls back to defaultValue in either case, so a bad admin-
// entered row degrades that one field instead of blowing up the whole config load.
function withNonBlank<T>(
  map: ConfigMap,
  name: string,
  defaultValue: T,
  transform: (value: string) => T,
): T {
  const value = map[name]?.value;
  if (!value || value.trim() === '') return defaultValue;
  try {
    return transform(value);
  } catch (e) {
    console.warn(`Invalid config value for "${name}" ("${value}"), falling back to default.`, e);
    return defaultValue;
  }
}

export function parsers(map: ConfigMap) {
  return {
    asBoolean: function (name: string, defaultValue: boolean): boolean {
      return withNonBlank(map, name, defaultValue, (value) => value === 'true');
    },
    asInt: function (name: string, defaultValue: number): number {
      return withNonBlank(map, name, defaultValue, (value) => {
        const parsed = parseInt(value);
        if (Number.isNaN(parsed)) throw new Error(`"${value}" is not an integer`);
        return parsed;
      });
    },
    asJson: function (name: string, defaultValue: unknown): unknown {
      return withNonBlank(map, name, defaultValue, (value) => JSON.parse(value));
    },
    asString: function (name: string, defaultValue: string): string {
      return map[name] ? map[name].value : (defaultValue as string);
    },
  };
}
