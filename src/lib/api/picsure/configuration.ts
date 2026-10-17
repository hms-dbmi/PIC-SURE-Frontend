import { request } from '#lib/api/client.ts';
import { LocalServer, Picsure, PicsurePaths } from '#lib/api/paths.ts';
import type { ConfigCache, ConfigObject } from '#lib/config/resolve.ts';

/** The stored rows of one configuration kind, as the backend names it. */
export function getConfigRows(apiKind: string): Promise<ConfigObject[]> {
  return request(Picsure.Configuration.Get, { query: { kind: apiKind }, auth: 'open' });
}

export function createConfigRow(row: {
  name: string;
  kind: string;
  value: string;
  description?: string;
}): Promise<ConfigObject> {
  return request(Picsure.Configuration.Admin, { method: 'POST', body: row, auth: 'open' });
}

export function updateConfigRow(row: ConfigObject & { uuid: string }): Promise<ConfigObject> {
  return request(PicsurePaths.configurationRow(row.uuid), {
    method: 'PATCH',
    body: row,
    auth: 'open',
  });
}

export async function deleteConfigRow(uuid: string): Promise<void> {
  await request(PicsurePaths.configurationRow(uuid), { method: 'DELETE', auth: 'open' });
}

/** Makes this app's server refetch the configuration it builds every session's config from. */
export function refreshServerConfigCache(): Promise<ConfigCache> {
  return request(LocalServer.ConfigRefresh, { auth: 'user' });
}
