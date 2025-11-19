import { w as writable, l as get } from './utils-B7NzVBxP.js';
import { a6 as get$1, a8 as Psama, a9 as del } from './User-01eW3TFo.js';

const loaded = writable(false);
const connections = writable([]);
async function loadConnections() {
  if (get(loaded)) return;
  const res = await get$1(Psama.Connection);
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
  await del(`${Psama.Connection}/${connection.id}`);
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
//# sourceMappingURL=Connections-Bb_icnG_.js.map
