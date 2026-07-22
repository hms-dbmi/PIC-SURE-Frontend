import { get, writable, type Writable } from 'svelte/store';
import type { ConfigObject, ConfigKind } from '$lib/models/Configuration';
import { CONFIG_API_KIND } from '$lib/models/Configuration';
import * as api from '$lib/api';
import { Picsure } from '$lib/paths';

export type AdminConfigKind = ConfigKind;

export function isApiAvailable(kind: AdminConfigKind): boolean {
  return !!CONFIG_API_KIND[kind];
}

export const adminConfigRows: Record<AdminConfigKind, Writable<ConfigObject[]>> = {
  features: writable([]),
  settings: writable([]),
  branding: writable([]),
};

const loaded: Record<AdminConfigKind, Writable<boolean>> = {
  features: writable(false),
  settings: writable(false),
  branding: writable(false),
};

export function apiRowFor(rows: ConfigObject[], name: string): ConfigObject | undefined {
  return rows.find((row) => row.name === name);
}

export async function loadAdminConfig(kind: AdminConfigKind, force = false): Promise<void> {
  if (!force && get(loaded[kind])) return;

  if (!isApiAvailable(kind)) {
    adminConfigRows[kind].set([]);
    loaded[kind].set(true);
    return;
  }

  const res: ConfigObject[] = await api.get(
    `${Picsure.Configuration.Get}?kind=${encodeURIComponent(CONFIG_API_KIND[kind])}`,
  );
  adminConfigRows[kind].set(res);
  loaded[kind].set(true);
}

export async function addConfigRow(
  kind: AdminConfigKind,
  name: string,
  value: string,
  description?: string,
): Promise<ConfigObject> {
  const created: ConfigObject = await api.post(Picsure.Configuration.Admin, {
    name,
    kind: CONFIG_API_KIND[kind],
    value,
    description,
  });

  const rows = get(adminConfigRows[kind]).filter((row) => row.name !== name);
  adminConfigRows[kind].set([...rows, created]);
  return created;
}

export async function updateConfigRow(
  kind: AdminConfigKind,
  row: ConfigObject,
): Promise<ConfigObject> {
  const updated: ConfigObject = await api.patch(`${Picsure.Configuration.Admin}/${row.uuid}/`, row);

  const rows = get(adminConfigRows[kind]).map((r) => (r.uuid === updated.uuid ? updated : r));
  adminConfigRows[kind].set(rows);
  return updated;
}

export async function deleteConfigRow(kind: AdminConfigKind, uuid: string): Promise<void> {
  await api.del(`${Picsure.Configuration.Admin}/${uuid}/`);

  const rows = get(adminConfigRows[kind]).filter((r) => r.uuid !== uuid);
  adminConfigRows[kind].set(rows);
}
