import * as api from '#lib/api/picsure/datasets.ts';
import type { DataSet } from '#lib/api/picsure/datasets.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

export class Datasets {
  #list: DataSet[] = $state.raw([]);
  #showArchived = $state(false);
  // Bumped by reset(), so a response that arrives after the session ended is dropped.
  #generation = 0;

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
    const generation = this.#generation;
    const list = await api.getDatasets();
    assertNoSsrWrite('datasets');
    if (generation === this.#generation) this.#list = list;
  };

  toggleArchived = async (uuid: string) => {
    const dataset = this.#list.find((ds) => ds.uuid === uuid);
    if (!dataset) return Promise.reject('Could not find dataset in store.');

    const generation = this.#generation;
    const updated = await api.updateDataset(uuid, {
      queryId: dataset.queryId,
      name: dataset.name,
      metadata: dataset.metadata,
      archived: !dataset.archived,
    });
    assertNoSsrWrite('datasets');
    if (generation !== this.#generation) return;
    this.#list = this.#list.map((ds) => (ds.uuid === uuid ? updated : ds));
  };

  get = async (uuid: string): Promise<DataSet> =>
    this.#list.find((ds) => ds.uuid === uuid) ?? api.getDataset(uuid);

  reset = () => {
    this.#generation++;
    this.#list = [];
  };
}

export const datasets = new Datasets();
session.onEnd(datasets.reset);
