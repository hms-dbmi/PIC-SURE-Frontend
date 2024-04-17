import { get, derived, writable, type Writable } from 'svelte/store';
import { type Privilege, mapPrivilege } from '$lib/models/Privileges';

import { privileges as mockPrivileges } from './mock/data';

/* eslint-disable @typescript-eslint/no-unused-vars */
const PRIV_PATH = 'psama/privilege';
/* eslint-enable @typescript-eslint/no-unused-vars */

const privileges: Writable<Privilege[]> = writable([]);
const privilegeList = derived(privileges, ($p) => $p.map((p) => [p.name, p.uuid]));

// TODO: Add api integration
async function loadPrivileges() {
  privileges.set(mockPrivileges.map(mapPrivilege));
}

async function getPrivilege(uuid: string) {
  const store: Privilege[] = get(privileges);
  const privIndex: number = store.findIndex((p) => p.uuid === uuid);
  return store[privIndex];
}

export default {
  subscribe: privileges.subscribe,
  privileges,
  privilegeList,
  loadPrivileges,
  getPrivilege,
};
