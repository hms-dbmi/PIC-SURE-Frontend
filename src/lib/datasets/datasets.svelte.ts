import { get, writable, derived, type Readable, type Writable } from 'svelte/store';

import type { DataSet } from '#lib/datasets/dataset.ts';
import * as api from '#lib/api/picsure/datasets.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';

export const datasets: Writable<DataSet[]> = writable([]);
export const active: Readable<DataSet[]> = derived(datasets, ($ds) =>
  $ds.filter((ds) => !ds.archived).sort((a, b) => b.rawStartTime - a.rawStartTime),
);
export const archived: Readable<DataSet[]> = derived(datasets, ($ds) =>
  $ds.filter((ds) => ds.archived),
);

let showArchived = $state(false);
export function toggleShowArchived() {
  showArchived = !showArchived;
  log(createLog('DATASET', 'dataset.toggle_archived', { showArchived }));
}
export function getShowArchived() {
  return showArchived;
}

export async function loadDatasets() {
  datasets.set(await api.getDatasets());
}

export async function toggleArchived(uuid: string) {
  const store: DataSet[] = get(datasets);
  const datasetIndex: number = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex === -1) {
    return Promise.reject('Could not find dataset in store.');
  }
  const dataset: DataSet = store[datasetIndex];
  store[datasetIndex] = await api.updateDataset(uuid, {
    queryId: dataset.queryId,
    name: dataset.name,
    metadata: dataset.metadata,
    archived: !dataset.archived,
  });
  datasets.set(store);
}

export async function getDataset(uuid: string) {
  const store: DataSet[] = get(datasets);
  const datasetIndex: number = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex > -1) {
    return store[datasetIndex];
  }

  return api.getDataset(uuid);
}
