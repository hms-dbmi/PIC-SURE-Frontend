import { get, writable, type Writable } from 'svelte/store';
import { type Role, mapRole } from '$lib/models/Role';

import { roles as mockRoles } from './mock/data';

/* eslint-disable @typescript-eslint/no-unused-vars */
const ROLE_PATH = '/psama/role';
/* eslint-enable @typescript-eslint/no-unused-vars */

const roles: Writable<Role[]> = writable([]);

// TODO: Add api integration
async function loadRoles() {
  roles.set(mockRoles.map(mapRole));
}

async function getRole(uuid: string) {
  const store: Role[] = get(roles);
  const roleIndex: number = store.findIndex((r) => r.uuid === uuid);
  return store[roleIndex];
}

export default {
  subscribe: roles.subscribe,
  roles,
  loadRoles,
  getRole,
};
