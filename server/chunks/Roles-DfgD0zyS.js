import { d as derived, w as writable } from './index2-CV6P_ZFI.js';
import { d as get, p as post, e as put, f as del } from './User-DwYSDSFP.js';
import { g as get_store_value } from './lifecycle-GVhEEkqU.js';

function mapRole(data) {
  return {
    ...data,
    privileges: data.privileges ? data.privileges.map((p) => p.uuid) : []
  };
}
const ROLE_PATH = "psama/role";
const loaded = writable(false);
const roles = writable([]);
const roleList = derived(roles, ($r) => $r.map((r) => [r.name, r.uuid || ""]), []);
async function loadRoles() {
  if (get_store_value(loaded)) return;
  const res = await get(ROLE_PATH);
  roles.set(res.map(mapRole));
  loaded.set(true);
}
async function getRole(uuid) {
  const store = get_store_value(roles);
  const role = store.find((r) => r.uuid === uuid);
  if (role) {
    return role;
  }
  const res = await get(`${ROLE_PATH}/${uuid}`);
  return mapRole(res);
}
async function addRole(role) {
  const res = await post(ROLE_PATH, [
    {
      ...role,
      privileges: role.privileges.map((p) => ({ uuid: p }))
    }
  ]);
  const newRole = mapRole(res.content[0]);
  const store = get_store_value(roles);
  store.push(newRole);
  roles.set(store);
}
async function updateRole(role) {
  const res = await put(ROLE_PATH, [
    {
      ...role,
      privileges: role.privileges.map((p) => ({ uuid: p }))
    }
  ]);
  const newRole = mapRole(res.content[0]);
  const store = get_store_value(roles);
  const roleIndex = store.findIndex((r) => r.uuid === newRole.uuid);
  if (roleIndex === -1) {
    store.push(newRole);
  } else {
    store[roleIndex] = newRole;
  }
  roles.set(store);
}
async function deleteRole(uuid) {
  await del(`${ROLE_PATH}/${uuid}`);
  const store = get_store_value(roles);
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
  getRole,
  addRole,
  updateRole,
  deleteRole
};

export { RoleStore as R };
//# sourceMappingURL=Roles-DfgD0zyS.js.map
