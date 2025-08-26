import { i as derived, w as writable, h as get } from './exports-Cnt0TmSD.js';
import { m as mapPrivilege } from './configuration-CSskKBur.js';
import { Q as get$1, U as Psama, V as del } from './User-ByrNDeqq.js';

const loaded = writable(false);
const privileges = writable([]);
const privilegeList = derived(privileges, ($p) => $p.map((p) => [p.name, p.uuid || ""]), []);
async function loadPrivileges() {
  if (get(loaded)) return;
  const res = await get$1(Psama.Priviege);
  privileges.set(res.map(mapPrivilege));
  loaded.set(true);
}
async function getPrivilege(uuid) {
  const store = get(privileges);
  const privilege = store.find((p) => p.uuid === uuid);
  if (privilege) {
    return privilege;
  }
  const res = await get$1(`${Psama.Priviege}/${uuid}`);
  return mapPrivilege(res);
}
async function deletePrivilege(uuid) {
  await del(`${Psama.Priviege}/${uuid}`);
  const store = get(privileges);
  const privIndex = store.findIndex((p) => p.uuid === uuid);
  if (privIndex > -1) {
    store.splice(privIndex, 1);
    privileges.set(store);
  }
}
const PrivilegesStore = {
  subscribe: privileges.subscribe,
  privilegeList,
  loadPrivileges
};

export { PrivilegesStore as P, privilegeList as a, deletePrivilege as d, getPrivilege as g, loadPrivileges as l, privileges as p };
//# sourceMappingURL=Privileges-B908xk15.js.map
