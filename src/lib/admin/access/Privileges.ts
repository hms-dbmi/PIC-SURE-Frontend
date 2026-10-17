import { get, derived, writable, type Writable } from 'svelte/store';
import { type Privilege, mapPrivilege } from '#lib/auth/model/privilege.ts';

import * as access from '#lib/api/psama/access.ts';

const loaded = writable(false);
export const privileges: Writable<Privilege[]> = writable([]);
export const privilegeList = derived(privileges, ($p) => $p.map((p) => [p.name, p.uuid || '']), []);

export async function loadPrivileges() {
  if (get(loaded)) return;

  const res = await access.privileges.list();
  privileges.set(res.map(mapPrivilege));
  loaded.set(true);
}

export async function getPrivilege(uuid: string) {
  const store: Privilege[] = get(privileges);
  const privilege = store.find((p) => p.uuid === uuid);
  if (privilege) {
    return privilege;
  }

  return mapPrivilege(await access.privileges.get(uuid));
}

export async function addPrivilege(privilege: Privilege) {
  const newPriv = mapPrivilege(
    await access.privileges.add({ ...privilege, application: { uuid: privilege.application } }),
  );

  const store: Privilege[] = get(privileges);
  store.push(newPriv);
  privileges.set(store);
}

export async function updatePrivilege(privilege: Privilege) {
  await access.privileges.update(privilege);

  const store: Privilege[] = get(privileges);
  const privIndex: number = store.findIndex((p) => p.uuid === privilege.uuid);
  if (privIndex === -1) {
    store.push(privilege);
  } else {
    store[privIndex] = privilege;
  }
  privileges.set(store);
}

export async function deletePrivilege(uuid: string) {
  await access.privileges.remove(uuid);

  const store: Privilege[] = get(privileges);
  const privIndex: number = store.findIndex((p) => p.uuid === uuid);
  if (privIndex > -1) {
    store.splice(privIndex, 1);
    privileges.set(store);
  }
}

export default {
  subscribe: privileges.subscribe,
  privileges,
  privilegeList,
  loadPrivileges,
  getPrivilege,
  addPrivilege,
  updatePrivilege,
  deletePrivilege,
};
