import { d as derived, w as writable } from './index2-BVONNh3m.js';
import { g as get, h as put } from './User-DLjB6rDR.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

function secondsToDate(seconds) {
  const dt = new Date(seconds);
  const year = dt.toLocaleString("default", { year: "numeric" });
  const month = dt.toLocaleString("default", { month: "2-digit" });
  const day = dt.toLocaleString("default", { day: "2-digit" });
  return year + "-" + month + "-" + day;
}
function mapDataset(data) {
  let query, federated;
  try {
    const jsonQuery = JSON.parse(data.query.query);
    query = jsonQuery?.query;
    if (jsonQuery?.commonAreaUUID) {
      federated = {
        commonId: jsonQuery?.commonAreaUUID
      };
    }
  } catch (_) {
    query = {};
  }
  const dataset = {
    uuid: data.uuid,
    user: data.user,
    name: data.name,
    archived: data.archived,
    metadata: data.metadata,
    query,
    federated,
    queryId: data.query.uuid,
    startTime: secondsToDate(data.query.startTime),
    rawStartTime: data.query.startTime
  };
  return dataset;
}
const datasets = writable([]);
const active = derived(
  datasets,
  ($ds) => $ds.filter((ds) => !ds.archived).sort((a, b) => b.rawStartTime - a.rawStartTime)
);
const archived = derived(datasets, ($ds) => $ds.filter((ds) => ds.archived));
async function loadDatasets() {
  const res = await get("picsure/dataset/named");
  datasets.set(res.map(mapDataset));
}
async function toggleArchived(uuid) {
  const store = get_store_value(datasets);
  const datasetIndex = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex === -1) {
    return Promise.reject("Could not find dataset in store.");
  }
  const dataset = store[datasetIndex];
  const request = {
    queryId: dataset?.queryId,
    name: dataset?.name,
    metadata: dataset?.metadata,
    archived: !dataset?.archived
  };
  const res = await put(`picsure/dataset/named/${uuid}`, request);
  store[datasetIndex] = mapDataset(res);
  datasets.set(store);
}
async function getDataset(uuid) {
  const store = get_store_value(datasets);
  const datasetIndex = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex > -1) {
    return store[datasetIndex];
  }
  const res = await get(`picsure/dataset/named/${uuid}`);
  return mapDataset(res);
}
const DataSetStore = {
  subscribe: datasets.subscribe,
  active,
  archived,
  loadDatasets,
  toggleArchived,
  getDataset
};

export { DataSetStore as D };
//# sourceMappingURL=Dataset-DkkujLLq.js.map
