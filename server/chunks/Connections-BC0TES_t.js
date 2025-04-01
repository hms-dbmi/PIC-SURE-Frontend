import { w as writable } from './index2-BVONNh3m.js';
import { g as get, p as post, e as put, f as del } from './User-fDnXlPjS.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

const CONN_PATH = "psama/connection";
const loaded = writable(false);
const connections = writable([]);
async function loadConnections() {
  if (get_store_value(loaded)) return;
  const res = await get(CONN_PATH);
  connections.set(res);
  loaded.set(true);
}
async function getConnection(uuid) {
  let store = get_store_value(connections);
  if (store.length === 0) {
    await loadConnections();
    store = get_store_value(connections);
  }
  const connection = store.find((r) => r.uuid === uuid);
  if (connection) {
    return connection;
  }
  throw new Error("Connection not found.");
}
async function addConnection(connection) {
  const res = await post(CONN_PATH, [connection]);
  const newConnection = res.content[0];
  const store = get_store_value(connections);
  store.push(newConnection);
  connections.set(store);
}
async function updateConnection(connection) {
  const res = await put(CONN_PATH, [connection]);
  const newConnection = res[0];
  const store = get_store_value(connections);
  const conIndex = store.findIndex((c) => c.uuid === newConnection.uuid);
  if (conIndex === -1) {
    store.push(newConnection);
  } else {
    store[conIndex] = newConnection;
  }
  connections.set(store);
}
async function deleteConnection(uuid) {
  const connection = await getConnection(uuid);
  await del(`${CONN_PATH}/${connection.id}`);
  const store = get_store_value(connections);
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
  getConnection,
  addConnection,
  updateConnection,
  deleteConnection
};

export { ConnectionsStore as C, connections as c, getConnection as g, loadConnections as l };
//# sourceMappingURL=Connections-BC0TES_t.js.map
