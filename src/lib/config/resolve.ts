import { getConfigMode, mergeConfigMaps, type ConfigMap, type ConfigObject } from './Configuration';

export type ConfigOrigin = 'env' | 'api' | 'default';

export interface FieldOrigin {
  origin: ConfigOrigin;
  envValue?: string;
  apiRow?: ConfigObject;
  // True when the API row would have no visible effect: VITE_CONFIG_MODE=override and
  // an env var is set for this field, so env always wins over whatever the API row says.
  disabled: boolean;
}

// Takes the already-built api/env maps (built once per tab, not once per field - see
// ConfigKindTab.svelte) and resolves just this one field through mergeConfigMaps' own
// precedence rule, so the admin UI's "where did this value come from" pill can never
// disagree with what the app actually resolves at runtime.
export function describeConfigField(
  name: string,
  apiMap: ConfigMap,
  envMap: ConfigMap,
): FieldOrigin {
  const apiRow = apiMap[name];
  const envEntry = envMap[name];
  if (!apiRow && !envEntry) return { origin: 'default', disabled: false };

  const resolved = mergeConfigMaps(
    apiRow ? { [name]: apiRow } : {},
    envEntry ? { [name]: envEntry } : {},
  )[name];

  if (resolved === envEntry) {
    return {
      origin: 'env',
      envValue: envEntry.value,
      apiRow,
      disabled: getConfigMode() === 'override',
    };
  }
  return { origin: 'api', apiRow, envValue: envEntry?.value, disabled: false };
}
