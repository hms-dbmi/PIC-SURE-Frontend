import { get, writable, type Writable } from 'svelte/store';
import type { Connection } from '$lib/models/Connection';

import * as api from '$lib/api';

const CONN_URL = 'psama/connection';

const loaded = writable(false);
export const connections: Writable<Connection[]> = writable([]);

export async function loadConnections() {
  if (get(loaded)) return;

  const res = await api.get(CONN_URL);
  connections.set(res);
  loaded.set(true);
}

async function getConnection(uuid: string) {
  const store = get(connections);
  const connection = store.find((r) => r.uuid === uuid);
  if (connection) {
    return connection;
  }

  const res = await api.get(`${CONN_URL}/${uuid}`);
  return res;
}

export default {
  subscribe: connections.subscribe,
  connections,
  loadConnections,
  getConnection,
};
