import { request } from '#lib/api/client.ts';
import { LocalServer, Picsure, PicsurePaths } from '#lib/api/paths.ts';
import type { ConfigObject } from '#lib/config/resolve.ts';
import { expectArray, isRecord } from '#lib/api/picsure/guards.ts';

/** The stored rows of one configuration kind, as the backend names it. */
export async function getConfigRows(apiKind: string): Promise<ConfigObject[]> {
  const rows = expectArray(
    await request(Picsure.Configuration.Get, { query: { kind: apiKind }, auth: 'open' }),
    'configuration',
  );
  return rows.map(toConfigRow);
}

export async function createConfigRow(row: {
  name: string;
  kind: string;
  value: string;
  description?: string;
}): Promise<ConfigObject> {
  return toConfigRow(
    await request(Picsure.Configuration.Admin, { method: 'POST', body: row, auth: 'open' }),
  );
}

export async function updateConfigRow(row: ConfigObject & { uuid: string }): Promise<ConfigObject> {
  return toConfigRow(
    await request(PicsurePaths.configurationRow(row.uuid), {
      method: 'PATCH',
      body: row,
      auth: 'open',
    }),
  );
}

export async function deleteConfigRow(uuid: string): Promise<void> {
  await request(PicsurePaths.configurationRow(uuid), { method: 'DELETE', auth: 'open' });
}

/** Makes this app's server refetch the configuration it builds every session's config from. */
export async function refreshServerConfigCache(): Promise<void> {
  await request(LocalServer.ConfigRefresh, { auth: 'user' });
}

function toConfigRow(value: unknown): ConfigObject {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.value !== 'string') {
    throw new Error('Invalid configuration response');
  }
  return value as ConfigObject;
}
