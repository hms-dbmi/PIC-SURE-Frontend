import { d as derived, w as writable } from './index2-BVONNh3m.js';
import { m as mapPrivilege } from './configuration-BRozmRr_.js';
import { g as get, p as post, f as put, h as del } from './User-BiqhXRJx.js';
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
  const newPriv = mapPrivilege(res.content[0]);
  const store = get_store_value(privileges);
  store.push(newPriv);
  privileges.set(store);
}
async function updatePrivilege(privilege) {
  const res = await put(PRIV_PATH, [
    {
      ...privilege,
      application: { uuid: privilege.application }
    }
  ]);
  const newPriv = mapPrivilege(res.content[0]);
  const store = get_store_value(privileges);
  const privIndex = store.findIndex((p) => p.uuid === newPriv.uuid);
  if (privIndex === -1) {
    store.push(newPriv);
  } else {
    store[privIndex] = newPriv;
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

export { PrivilegesStore as P };
//# sourceMappingURL=Privileges-Bs-kA03i.js.map
