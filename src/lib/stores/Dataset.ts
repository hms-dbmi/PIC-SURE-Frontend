import { get, writable, derived, type Readable, type Writable } from 'svelte/store';

import { mapDataset, type DataSet } from '$lib/models/Dataset';
import * as api from '$lib/api';
import { Picsure } from '$lib/paths';

export const datasets: Writable<DataSet[]> = writable([]);
export const commonAreaUUID: Writable<string | undefined> = writable(undefined);
export interface FederatedResourceInfo {
  queryId?: string;
  resourceId?: string;
  name?: string;
  status?: string;
}

export const federatedQueryMap: Writable<Record<string, FederatedResourceInfo>> = writable({});
export const active: Readable<DataSet[]> = derived(datasets, ($ds) =>
  $ds.filter((ds) => !ds.archived).sort((a, b) => b.rawStartTime - a.rawStartTime),
);
export const archived: Readable<DataSet[]> = derived(datasets, ($ds) =>
  $ds.filter((ds) => ds.archived),
);

export async function loadDatasets() {
  const res = await api.get(Picsure.NamedDataSet);
  datasets.set(res.map(mapDataset));
}

export async function toggleArchived(uuid: string) {
  const store: DataSet[] = get(datasets);
  const datasetIndex: number = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex === -1) {
    return Promise.reject('Could not find dataset in store.');
  }
  const dataset: DataSet = store[datasetIndex];
  const request = {
    queryId: dataset?.queryId,
    name: dataset?.name,
    metadata: dataset?.metadata,
    archived: !dataset?.archived,
  };
  const res = await api.put(`${Picsure.NamedDataSet}/${uuid}`, request);
  store[datasetIndex] = mapDataset(res);
  datasets.set(store);
}

export async function getDataset(uuid: string) {
  const store: DataSet[] = get(datasets);
  const datasetIndex: number = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex > -1) {
    return store[datasetIndex];
  }

  const res = await api.get(`${Picsure.NamedDataSet}/${uuid}`);
  return mapDataset(res);
}

export default {
  subscribe: datasets.subscribe,
  active,
  archived,
  loadDatasets,
  toggleArchived,
  getDataset,
};
