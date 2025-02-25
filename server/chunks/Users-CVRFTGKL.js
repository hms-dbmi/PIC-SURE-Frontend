import { w as writable } from './index2-BVONNh3m.js';
import { g as get, p as post, e as put } from './User-DpPjP5W7.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

function mapExtendedUser(data) {
  return {
    ...data,
    connection: data.connection ? data.connection.uuid : "",
    roles: data.roles ? data.roles.map((r) => r.uuid) : []
  };
}
const USER_URL = "psama/user";
const loaded = writable(false);
const users = writable([]);
async function loadUsers() {
  if (get_store_value(loaded)) return;
  const res = await get(USER_URL);
  users.set(res.map(mapExtendedUser));
  loaded.set(true);
}
async function getUser(uuid) {
  const store = get_store_value(users);
  const user = store.find((u) => u.uuid === uuid);
  if (user) {
    return user;
  }
  const res = await get(`${USER_URL}/${uuid}`);
  return mapExtendedUser(res);
}
async function addUser(user) {
  const res = await post(USER_URL, [user]);
  const newRole = mapExtendedUser(res.content[0]);
  const store = get_store_value(users);
  store.push(newRole);
  users.set(store);
}
async function updateUser(user) {
  const res = await put(USER_URL, [user]);
  const newUser = mapExtendedUser(res.content[0]);
  const store = get_store_value(users);
  const roleIndex = store.findIndex((r) => r.uuid === newUser.uuid);
  if (roleIndex === -1) {
    store.push(newUser);
  } else {
    store[roleIndex] = newUser;
  }
  users.set(store);
}
const UsersStore = {
  subscribe: users.subscribe,
  users,
  loadUsers,
  getUser,
  addUser,
  updateUser
};

export { UsersStore as U };
//# sourceMappingURL=Users-CVRFTGKL.js.map
