import { get, writable, type Writable } from 'svelte/store';
import { type Role, mapRole } from '$lib/models/Role';

import * as api from '$lib/api';

const ROLE_PATH = 'psama/role';

const loaded = writable(false);
const roles: Writable<Role[]> = writable([]);

async function loadRoles() {
  if (get(loaded)) return;

  const res = await api.get(ROLE_PATH);
  roles.set(res.map(mapRole));
  loaded.set(true);
}

async function getRole(uuid: string) {
  const store: Role[] = get(roles);
  const role = store.find((r) => r.uuid === uuid);
  if (role) {
    return role;
  }

  const res = await api.get(`${ROLE_PATH}/${uuid}`);
  return mapRole(res);
}

async function addRole(role: Role) {
  const res = await api.post(ROLE_PATH, [
    {
      ...role,
      privileges: role.privileges.map((p) => ({ uuid: p })),
    },
  ]);
  const newRole = mapRole(res.content[0]);

  const store: Role[] = get(roles);
  store.push(newRole);
  roles.set(store);
}

async function updateRole(role: Role) {
  const res = await api.put(ROLE_PATH, [
    {
      ...role,
      privileges: role.privileges.map((p) => ({ uuid: p })),
    },
  ]);
  const newRole = mapRole(res.content[0]);

  const store: Role[] = get(roles);
  const roleIndex: number = store.findIndex((r) => r.uuid === newRole.uuid);
  if (roleIndex === -1) {
    store.push(newRole);
  } else {
    store[roleIndex] = newRole;
  }
  roles.set(store);
}

async function deleteRole(uuid: string) {
  await api.del(`${ROLE_PATH}/${uuid}`);

  const store: Role[] = get(roles);
  const roleIndex: number = store.findIndex((r) => r.uuid === uuid);
  if (roleIndex > -1) {
    store.splice(roleIndex, 1);
    roles.set(store);
  }
}

export default {
  subscribe: roles.subscribe,
  roles,
  loadRoles,
  getRole,
  addRole,
  updateRole,
  deleteRole,
};
