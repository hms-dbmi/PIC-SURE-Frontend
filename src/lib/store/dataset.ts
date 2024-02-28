import { get, writable, derived, type Readable, type Writable } from 'svelte/store';

import { mapDataset, type DataSet } from '$lib/model/dataset';
import * as api from '$lib/api';

const datasets: Writable<DataSet[]> = writable([]);
const active: Readable<DataSet[]> = derived(datasets, ($ds) => $ds.filter((ds) => !ds.archived));
const archived: Readable<DataSet[]> = derived(datasets, ($ds) => $ds.filter((ds) => ds.archived));

async function loadDatasets() {
  const res = await api.get('picsure/dataset/named');
  datasets.set(res.map(mapDataset));
}

async function toggleArchived(uuid: string) {
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
    archived: !dataset?.archived
  };
  const res = await api.put(`picsure/dataset/named/${uuid}`, request);
  store[datasetIndex] = mapDataset(res);
  datasets.set(store);
}

async function getDataset(uuid: string) {
  const store: DataSet[] = get(datasets);
  const datasetIndex: number = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex > -1) {
    return store[datasetIndex];
  }

  const res = await api.get(`picsure/dataset/named/${uuid}`);
  return mapDataset(res);
}

export default {
  subscribe: datasets.subscribe,
  active,
  archived,
  loadDatasets,
  toggleArchived,
  getDataset
};
