import { writable, type Writable } from 'svelte/store';

import { users as mockUsers, connections as mockConns } from './mock/data';
import { mapUser, type ExtendedUser } from '../models/User';
import type { Connection } from '../models/Connection';

// TODO: Break connections and roles out into different store files when working on super-admin page.
export const users: Writable<ExtendedUser[]> = writable([]);
export const connections: Writable<Connection[]> = writable([]);

// TODO: Add api integration
export async function getUsers() {
  users.set(mockUsers.map(mapUser));
}

export async function getConnections() {
  connections.set(mockConns);
}

export default {
  users,
  connections,
  getUsers,
  getConnections,
};
