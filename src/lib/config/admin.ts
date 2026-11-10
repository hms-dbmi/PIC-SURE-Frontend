import {
  getConfigMode,
  mergeConfigMaps,
  type ConfigKind,
  type ConfigMap,
  type ConfigObject,
} from './resolve.ts';
import { CONFIG_FIELDS, CONFIG_GROUPS, type FieldType } from './schema.ts';

export interface ConfigFieldSchema {
  name: string;
  type: FieldType;
  default: unknown;
  description: string;
  // CONFIG_GROUPS id (stable, used in testids) and its display label.
  group: string;
  groupLabel: string;
}

// API rows whose name isn't (or is no longer) a key in CONFIG_FIELDS[kind] - e.g. a
// feature flag that was removed from the app but whose row was never cleaned up in the
// backend. These have no effect on anything mapFeatures/mapSettings/mapBranding
// resolve (parsersFor only ever looks up registered names), so they're usually safe to
// delete; the admin UI surfaces them precisely because there's no other way to notice
// they're inert. Exact by construction: apiRows here is already the result of fetching
// ?kind=<that kind's value>, so every row already belongs to `kind` - no guessing.
//
// One case this can't distinguish from genuine dead rows: moving a field from one kind
// to another in CONFIG_FIELDS (e.g. DOTS_COLORS_CLASS moving from settings to branding)
// orphans any existing API row under the old kind - it starts showing up here as
// "deprecated" even though it still holds a real admin-entered value, and deleting it
// does not migrate that value. There is no dual-read across kinds, so a field move needs
// a rollout note (or manual admin action) telling deployments to re-enter the value
// under the new kind.
export function deprecatedApiRows(kind: ConfigKind, apiRows: ConfigObject[]): ConfigObject[] {
  const known = CONFIG_FIELDS[kind];
  return apiRows.filter((row) => !Object.hasOwn(known, row.name));
}

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

// The admin UI's schema: a flat view over CONFIG_FIELDS, grouped by kind. Pure data -
// no execution of the mappers involved, so this can never drift from what
// mapFeatures/mapSettings/mapBranding actually resolve (they read the same table).
export const CONFIG_FIELD_SCHEMA: Record<ConfigKind, ConfigFieldSchema[]> = (
  Object.keys(CONFIG_FIELDS) as ConfigKind[]
).reduce(
  (acc, kind) => {
    acc[kind] = Object.entries(CONFIG_FIELDS[kind]).map(([name, def]) => ({
      name,
      type: def.type,
      default: def.default,
      description: def.description,
      group: def.group,
      groupLabel: CONFIG_GROUPS[def.group],
    }));
    return acc;
  },
  {} as Record<ConfigKind, ConfigFieldSchema[]>,
);

type Grouped = { group: string; groupLabel: string };

export interface ConfigFieldGroup<T extends Grouped = ConfigFieldSchema> {
  group: string;
  groupLabel: string;
  fields: T[];
}

// Buckets a schema list by relation (Google settings together, Analysis features
// together, etc.) instead of by type, for the admin UI's section headers. Section order
// follows each group's first appearance in the given list, so CONFIG_FIELDS'
// declaration order is the only place that ordering is controlled - no separate list.
// Takes the field list rather than a ConfigKind so it stays a pure function of its
// input - callers (and tests) pass whatever schema they have, mocked or not. Generic
// over T (not hardcoded to ConfigFieldSchema) so the admin UI can also group a merged,
// cross-kind list (e.g. features + settings fields tagged with which kind each came
// from) - grouping only ever needs each item's group id and label, nothing kind-specific.
export function groupedConfigFieldSchema<T extends Grouped>(schema: T[]): ConfigFieldGroup<T>[] {
  const groups: ConfigFieldGroup<T>[] = [];
  const byId = new Map<string, ConfigFieldGroup<T>>();
  for (const field of schema) {
    let bucket = byId.get(field.group);
    if (!bucket) {
      bucket = { group: field.group, groupLabel: field.groupLabel, fields: [] };
      byId.set(field.group, bucket);
      groups.push(bucket);
    }
    bucket.fields.push(field);
  }
  return groups;
}
