import { get, derived, writable, type Writable } from 'svelte/store';
import { type Role, mapRole } from '$lib/models/Role';

import * as api from '$lib/api';
import { Psama } from '$lib/paths';

const loaded = writable(false);
export const roles: Writable<Role[]> = writable([]);
export const roleList = derived(roles, ($r) => $r.map((r) => [r.name, r.uuid || '']), []);

export async function loadRoles() {
  if (get(loaded)) return;

  const res = await api.get(Psama.Role);
  roles.set(res.map(mapRole));
  loaded.set(true);
}

export async function getRole(uuid: string) {
  const store: Role[] = get(roles);
  const role = store.find((r) => r.uuid === uuid);
  if (role) {
    return role;
  }

  const res = await api.get(`${Psama.Role}/${uuid}`);
  return mapRole(res);
}

export async function addRole(role: Role) {
  // The admin CRUD success body is the bare DTO list now; the
  // { message, content } wrapper is gone.
  const res = await api.post(Psama.Role, [
    {
      ...role,
      privileges: role.privileges.map((p) => ({ uuid: p })),
    },
  ]);
  const newRole = mapRole(res[0]);

  const store: Role[] = get(roles);
  store.push(newRole);
  roles.set(store);
}

export async function updateRole(role: Role) {
  const res = await api.put(Psama.Role, [
    {
      ...role,
      privileges: role.privileges.map((p) => ({ uuid: p })),
    },
  ]);
  const newRole = mapRole(res[0]);

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
  await api.del(`${Psama.Role}/${uuid}`);

  const store: Role[] = get(roles);
  const roleIndex: number = store.findIndex((r) => r.uuid === uuid);
  if (roleIndex > -1) {
    store.splice(roleIndex, 1);
    roles.set(store);
  }
}

export async function addManualRole(studyId: string) {
  // StudyAccessRequest: a JSON object, not the bare identifier string.
  //
  // api.post resolves with the PARSED BODY, never a Response, and throws on
  // any non-2xx. Reaching this return already means success, so there is no
  // status to check — the old `res.status !== 200` guard read `undefined` off
  // the body and therefore threw on every successful call. /studyAccess
  // answers a bare string, so there is no success field to test either.
  return api.post(Psama.StudyAccess, { studyIdentifier: studyId });
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
