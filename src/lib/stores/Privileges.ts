import { get, derived, writable, type Writable } from 'svelte/store';
import { type Privilege, mapPrivilege } from '$lib/models/Privilege';

import * as api from '$lib/api';

const PRIV_PATH = 'psama/privilege';

const loaded = writable(false);
export const privileges: Writable<Privilege[]> = writable([]);
export const privilegeList = derived(privileges, ($p) => $p.map((p) => [p.name, p.uuid || '']), []);

export async function loadPrivileges() {
  if (get(loaded)) return;

  const res = await api.get(PRIV_PATH);
  privileges.set(res.map(mapPrivilege));
  loaded.set(true);
}

export async function getPrivilege(uuid: string) {
  const store: Privilege[] = get(privileges);
  const privilege = store.find((p) => p.uuid === uuid);
  if (privilege) {
    return privilege;
  }

  const res = await api.get(`${PRIV_PATH}/${uuid}`);
  return mapPrivilege(res);
}

export async function addPrivilege(privilege: Privilege) {
  const res = await api.post(PRIV_PATH, [
    {
      ...privilege,
      application: { uuid: privilege.application },
    },
  ]);
  const newPriv = mapPrivilege(res[0]);

  const store: Privilege[] = get(privileges);
  store.push(newPriv);
  privileges.set(store);
}

export async function updatePrivilege(privilege: Privilege) {
  await api.put(PRIV_PATH, [
    {
      ...privilege,
      application: { uuid: privilege.application },
    },
  ]);

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
  await api.del(`${PRIV_PATH}/${uuid}`);

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
