import { get, derived, writable, type Writable } from 'svelte/store';
import { type Privilege, mapPrivilege } from '$lib/models/Privilege';

import * as api from '$lib/api';

const PRIV_PATH = 'psama/privilege';

const loaded = writable(false);
const privileges: Writable<Privilege[]> = writable([]);
const privilegeList = derived(privileges, ($p) => $p.map((p) => [p.name, p.uuid || '']), []);

async function loadPrivileges() {
  if (get(loaded)) return;

  const res = await api.get(PRIV_PATH);
  privileges.set(res.map(mapPrivilege));
  loaded.set(true);
}

async function getPrivilege(uuid: string) {
  const store: Privilege[] = get(privileges);
  const privilege = store.find((p) => p.uuid === uuid);
  if (privilege) {
    return privilege;
  }

  const res = await api.get(`${PRIV_PATH}/${uuid}`);
  return mapPrivilege(res);
}

async function addPrivilege(privilege: Privilege) {
  const res = await api.post(PRIV_PATH, [
    {
      ...privilege,
      application: { uuid: privilege.application },
    },
  ]);
  const newPriv = mapPrivilege(res.content[0]);

  const store: Privilege[] = get(privileges);
  store.push(newPriv);
  privileges.set(store);
}

async function updatePrivilege(privilege: Privilege) {
  const res = await api.put(PRIV_PATH, [
    {
      ...privilege,
      application: { uuid: privilege.application },
    },
  ]);
  const newPriv = mapPrivilege(res.content[0]);

  const store: Privilege[] = get(privileges);
  const privIndex: number = store.findIndex((p) => p.uuid === newPriv.uuid);
  if (privIndex === -1) {
    store.push(newPriv);
  } else {
    store[privIndex] = newPriv;
  }
  privileges.set(store);
}

async function deletePrivilege(uuid: string) {
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
