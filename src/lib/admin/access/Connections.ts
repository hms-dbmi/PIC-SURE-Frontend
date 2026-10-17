import { get, writable, type Writable } from 'svelte/store';
import type { Connection } from '#lib/auth/model/connection.ts';

import * as access from '#lib/api/psama/access.ts';

const loaded = writable(false);
export const connections: Writable<Connection[]> = writable([]);

export async function loadConnections() {
  if (get(loaded)) return;

  connections.set(await access.connections.list());
  loaded.set(true);
}

export async function getConnection(uuid: string) {
  let store = get(connections);
  if (store.length === 0) {
    // Connections GET endpoint does not use the uuid but instead uses the
    // connectionid. Until this is fixed, we'll pull in all connections and
    // then search the list by uuid.
    await loadConnections();
    store = get(connections);
  }

  const connection = store.find((r) => r.uuid === uuid);
  if (connection) {
    return connection;
  }

  throw new Error('Connection not found.');
}

export async function addConnection(connection: Connection) {
  const newConnection = await access.connections.add(connection);

  const store: Connection[] = get(connections);
  store.push(newConnection);
  connections.set(store);
}

export async function updateConnection(connection: Connection) {
  const newConnection = await access.connections.update(connection);

  const store: Connection[] = get(connections);
  const conIndex: number = store.findIndex((c) => c.uuid === newConnection.uuid);
  if (conIndex === -1) {
    store.push(newConnection);
  } else {
    store[conIndex] = newConnection;
  }
  connections.set(store);
}

export async function deleteConnection(uuid: string) {
  const connection: Connection = await getConnection(uuid);
  await access.connections.remove(connection.id);

  const store: Connection[] = get(connections);
  const conIndex: number = store.findIndex((c) => c.uuid === uuid);
  if (conIndex > -1) {
    store.splice(conIndex, 1);
    connections.set(store);
  }
}

export default {
  subscribe: connections.subscribe,
  connections,
  loadConnections,
  getConnection,
  addConnection,
  updateConnection,
  deleteConnection,
};
