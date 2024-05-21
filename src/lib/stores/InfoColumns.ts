import { get, writable, type Writable } from 'svelte/store';
import * as api from '$lib/api';
import type { Indexed } from '$lib/types';
import { resources } from '$lib/configuration';
import { VariantKeys, type InfoColumn } from '$lib/models/InfoColumns';

const SYNC_URL = '/picsure/query/sync';

export const infoColumns: Writable<Indexed<InfoColumn>> = writable({});
export const error: Writable<string> = writable('');
const loaded: Writable<boolean> = writable(false);

export async function loadInfoColumns() {
  if (get(loaded)) return;
  try {
    const response = await api.post(SYNC_URL, {
      resourceUUID: resources.hpds,
      query: { expectedResultType: 'INFO_COLUMN_LISTING' },
    });
    const columnMap = response
      .map((column: InfoColumn) => ({
        ...column,
        description: column.description.replaceAll(/(Description="|"$)/g, ''),
      }))
      .reduce(
        (mapObj: Indexed<InfoColumn>, info: InfoColumn) => ({ ...mapObj, [info.key]: info }),
        {},
      );
    infoColumns.set(columnMap);
    loaded.set(true);
  } catch (e) {
    console.error(e);
    error.set(
      'An error occured while loading help information. Please contact you PIC-SURE admin.',
    );
  }
}

export function getInfoColumn(name: string) {
  const columns = get(infoColumns);
  return columns[name].description;
}

export default { infoColumns, error, VariantKeys, loadInfoColumns, getInfoColumn };
