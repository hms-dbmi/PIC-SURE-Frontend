import { i as derived, w as writable, h as get$1 } from './exports-Cnt0TmSD.js';
import { Q as get, R as Picsure } from './User-ByrNDeqq.js';

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
derived(
  datasets,
  ($ds) => $ds.filter((ds) => ds.archived)
);
async function loadDatasets() {
  const res = await get(Picsure.NamedDataSet);
  datasets.set(res.map(mapDataset));
}
async function getDataset(uuid) {
  const store = get$1(datasets);
  const datasetIndex = store.findIndex((ds) => ds.uuid === uuid);
  if (datasetIndex > -1) {
    return store[datasetIndex];
  }
  const res = await get(`${Picsure.NamedDataSet}/${uuid}`);
  return mapDataset(res);
}
({
  subscribe: datasets.subscribe
});

export { active as a, getDataset as g, loadDatasets as l };
//# sourceMappingURL=Dataset-cbZBLonT.js.map
