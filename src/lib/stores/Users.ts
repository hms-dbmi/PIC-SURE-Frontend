import { writable, type Writable } from 'svelte/store';

import { roles as mockRoles, users as mockUsers, connections as mockConns } from './mock/Users';
import type { ExtendedUser } from '../models/User';
import type { Connection } from '../models/Connection';
import type { Role } from '../models/Role';

// TODO: Break connections and roles out into different store files when working on super-admin page.
export const users: Writable<ExtendedUser[]> = writable([]);
export const roles: Writable<Role[]> = writable([]);
export const connections: Writable<Connection[]> = writable([]);

// TODO: Add api integration
export async function getUsers() {
  users.set(mockUsers);
}

export async function getConnections() {
  connections.set(mockConns);
}

export async function getRoles() {
  roles.set(mockRoles);
}

export default {
  users,
  roles,
  connections,
  getUsers,
  getRoles,
  getConnections,
};
