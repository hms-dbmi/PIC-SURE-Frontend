import { d as derived, w as writable } from './index2-BVONNh3m.js';
import { m as mapPrivilege } from './configuration-JjhNHhnG.js';
import { g as get, p as post, e as put, f as del } from './User-DpPjP5W7.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

const PRIV_PATH = "psama/privilege";
const loaded = writable(false);
const privileges = writable([]);
const privilegeList = derived(privileges, ($p) => $p.map((p) => [p.name, p.uuid || ""]), []);
async function loadPrivileges() {
  if (get_store_value(loaded)) return;
  const res = await get(PRIV_PATH);
  privileges.set(res.map(mapPrivilege));
  loaded.set(true);
}
async function getPrivilege(uuid) {
  const store = get_store_value(privileges);
  const privilege = store.find((p) => p.uuid === uuid);
  if (privilege) {
    return privilege;
  }
  const res = await get(`${PRIV_PATH}/${uuid}`);
  return mapPrivilege(res);
}
async function addPrivilege(privilege) {
  const res = await post(PRIV_PATH, [
    {
      ...privilege,
      application: { uuid: privilege.application }
    }
  ]);
  const newPriv = mapPrivilege(res[0]);
  const store = get_store_value(privileges);
  store.push(newPriv);
  privileges.set(store);
}
async function updatePrivilege(privilege) {
  await put(PRIV_PATH, [
    {
      ...privilege,
      application: { uuid: privilege.application }
    }
  ]);
  const store = get_store_value(privileges);
  const privIndex = store.findIndex((p) => p.uuid === privilege.uuid);
  if (privIndex === -1) {
    store.push(privilege);
  } else {
    store[privIndex] = privilege;
  }
  privileges.set(store);
}
async function deletePrivilege(uuid) {
  await del(`${PRIV_PATH}/${uuid}`);
  const store = get_store_value(privileges);
  const privIndex = store.findIndex((p) => p.uuid === uuid);
  if (privIndex > -1) {
    store.splice(privIndex, 1);
    privileges.set(store);
  }
}
const PrivilegesStore = {
  subscribe: privileges.subscribe,
  privileges,
  privilegeList,
  loadPrivileges,
  getPrivilege,
  addPrivilege,
  updatePrivilege,
  deletePrivilege
};

export { PrivilegesStore as P, privilegeList as a, getPrivilege as g, loadPrivileges as l, privileges as p };
//# sourceMappingURL=Privileges-CBJvRnMc.js.map
