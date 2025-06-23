import { w as writable, h as get } from './exports-CKriv3vT.js';
import { g as get$1, d as del } from './User-DPh8mmLT.js';

const CONN_PATH = "psama/connection";
const loaded = writable(false);
const connections = writable([]);
async function loadConnections() {
  if (get(loaded)) return;
  const res = await get$1(CONN_PATH);
  connections.set(res);
  loaded.set(true);
}
async function getConnection(uuid) {
  let store = get(connections);
  if (store.length === 0) {
    await loadConnections();
    store = get(connections);
  }
  const connection = store.find((r) => r.uuid === uuid);
  if (connection) {
    return connection;
  }
  throw new Error("Connection not found.");
}
async function deleteConnection(uuid) {
  const connection = await getConnection(uuid);
  await del(`${CONN_PATH}/${connection.id}`);
  const store = get(connections);
  const conIndex = store.findIndex((c) => c.uuid === uuid);
  if (conIndex > -1) {
    store.splice(conIndex, 1);
    connections.set(store);
  }
}
const ConnectionsStore = {
  subscribe: connections.subscribe,
  connections,
  loadConnections,
  getConnection
};

export { ConnectionsStore as C, connections as c, deleteConnection as d, getConnection as g, loadConnections as l };
//# sourceMappingURL=Connections-D53FXc8x.js.map
