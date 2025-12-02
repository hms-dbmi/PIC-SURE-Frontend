import { o as derived, w as writable, l as get } from './utils-D3IkxnGP.js';
import { a6 as get$1, a8 as Psama, a9 as del } from './User-CeJunCPd.js';

function mapRole(data) {
  return {
    ...data,
    privileges: data.privileges ? data.privileges.map((p) => p.uuid) : []
  };
}
const loaded = writable(false);
const roles = writable([]);
const roleList = derived(roles, ($r) => $r.map((r) => [r.name, r.uuid || ""]), []);
async function loadRoles() {
  if (get(loaded)) return;
  const res = await get$1(Psama.Role);
  roles.set(res.map(mapRole));
  loaded.set(true);
}
async function getRole(uuid) {
  const store = get(roles);
  const role = store.find((r) => r.uuid === uuid);
  if (role) {
    return role;
  }
  const res = await get$1(`${Psama.Role}/${uuid}`);
  return mapRole(res);
}
async function deleteRole(uuid) {
  await del(`${Psama.Role}/${uuid}`);
  const store = get(roles);
  const roleIndex = store.findIndex((r) => r.uuid === uuid);
  if (roleIndex > -1) {
    store.splice(roleIndex, 1);
    roles.set(store);
  }
}
const RoleStore = {
  subscribe: roles.subscribe,
  roles,
  roleList,
  loadRoles,
  getRole
};

export { RoleStore as R, deleteRole as d, getRole as g, loadRoles as l, roles as r };
//# sourceMappingURL=Roles-BM28ynMK.js.map
