import type { DataSet } from '#lib/datasets/dataset.ts';
import * as api from '#lib/api/picsure/datasets.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

export class Datasets {
  #list: DataSet[] = $state.raw([]);
  #showArchived = $state(false);

  readonly active: DataSet[] = $derived(
    this.#list.filter((ds) => !ds.archived).sort((a, b) => b.rawStartTime - a.rawStartTime),
  );
  readonly archived: DataSet[] = $derived(this.#list.filter((ds) => ds.archived));

  get showArchived() {
    return this.#showArchived;
  }

  toggleShowArchived = () => {
    assertNoSsrWrite('datasets');
    this.#showArchived = !this.#showArchived;
    log(createLog('DATASET', 'dataset.toggle_archived', { showArchived: this.#showArchived }));
  };

  load = async () => {
    const list = await api.getDatasets();
    assertNoSsrWrite('datasets');
    this.#list = list;
  };

  toggleArchived = async (uuid: string) => {
    const dataset = this.#list.find((ds) => ds.uuid === uuid);
    if (!dataset) return Promise.reject('Could not find dataset in store.');

    const updated = await api.updateDataset(uuid, {
      queryId: dataset.queryId,
      name: dataset.name,
      metadata: dataset.metadata,
      archived: !dataset.archived,
    });
    assertNoSsrWrite('datasets');
    this.#list = this.#list.map((ds) => (ds.uuid === uuid ? updated : ds));
  };

  get = async (uuid: string): Promise<DataSet> =>
    this.#list.find((ds) => ds.uuid === uuid) ?? api.getDataset(uuid);
}

export const datasets = new Datasets();
