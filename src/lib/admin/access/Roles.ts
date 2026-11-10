import { get, derived, writable, type Writable } from 'svelte/store';
import { type Role, mapRole } from '#lib/auth/model/role.ts';

import * as access from '#lib/api/psama/access.ts';

const loaded = writable(false);
export const roles: Writable<Role[]> = writable([]);
export const roleList = derived(roles, ($r) => $r.map((r) => [r.name, r.uuid || '']), []);

export async function loadRoles() {
  if (get(loaded)) return;

  const res = await access.roles.list();
  roles.set(res.map(mapRole));
  loaded.set(true);
}

export async function getRole(uuid: string) {
  const store: Role[] = get(roles);
  const role = store.find((r) => r.uuid === uuid);
  if (role) {
    return role;
  }

  return mapRole(await access.roles.get(uuid));
}

export async function addRole(role: Role) {
  const newRole = mapRole(
    await access.roles.add({ ...role, privileges: role.privileges.map((p) => ({ uuid: p })) }),
  );

  const store: Role[] = get(roles);
  store.push(newRole);
  roles.set(store);
}

export async function updateRole(role: Role) {
  const newRole = mapRole(await access.roles.update(role));

  const store: Role[] = get(roles);
  const roleIndex: number = store.findIndex((r) => r.uuid === newRole.uuid);
  if (roleIndex === -1) {
    store.push(newRole);
  } else {
    store[roleIndex] = newRole;
  }
  roles.set(store);
}

export async function deleteRole(uuid: string) {
  await access.roles.remove(uuid);

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
  roleList,
  loadRoles,
  getRole,
  addRole,
  updateRole,
  deleteRole,
};
