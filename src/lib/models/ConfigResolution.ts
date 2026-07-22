import { apiConfigMap, envConfigMap, getConfigMode, type ConfigObject } from './Configuration';

export type ConfigOrigin = 'env' | 'api' | 'default';

export interface FieldOrigin {
  origin: ConfigOrigin;
  envValue?: string;
  apiRow?: ConfigObject;
  // True when the API row would have no visible effect: VITE_CONFIG_MODE=override and
  // an env var is set for this field, so env always wins over whatever the API row says.
  disabled: boolean;
}

// Mirrors resolveConfigMap's own precedence (Configuration.ts) so the admin UI's
// "where did this value come from" pill can never disagree with what the app actually
// resolves at runtime: seed mode -> API wins if set, else env; override mode -> env
// wins if set, else API.
export function describeConfigField(name: string, apiRows: ConfigObject[]): FieldOrigin {
  const apiRow = apiConfigMap(apiRows)[name];
  const envEntry = envConfigMap()[name];
  const mode = getConfigMode();

  if (mode === 'override') {
    if (envEntry) return { origin: 'env', envValue: envEntry.value, apiRow, disabled: true };
    if (apiRow) return { origin: 'api', apiRow, disabled: false };
  } else {
    if (apiRow) return { origin: 'api', apiRow, envValue: envEntry?.value, disabled: false };
    if (envEntry) return { origin: 'env', envValue: envEntry.value, apiRow, disabled: false };
  }

  return { origin: 'default', disabled: false };
}
