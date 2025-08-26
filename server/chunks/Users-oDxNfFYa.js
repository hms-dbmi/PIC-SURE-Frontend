import { w as writable, h as get } from './exports-Cnt0TmSD.js';
import { Q as get$1, U as Psama, X as put } from './User-ByrNDeqq.js';

function mapExtendedUser(data) {
  return {
    ...data,
    connection: data.connection ? data.connection.uuid : "",
    roles: data.roles ? data.roles.map((r) => r.uuid) : []
  };
}
const loaded = writable(false);
const users = writable([]);
async function loadUsers() {
  if (get(loaded)) return;
  const res = await get$1(Psama.Users);
  users.set(res.map(mapExtendedUser));
  loaded.set(true);
}
async function getUser(uuid) {
  const store = get(users);
  const user = store.find((u) => u.uuid === uuid);
  if (user) {
    return user;
  }
  const res = await get$1(`${Psama.Users}/${uuid}`);
  return mapExtendedUser(res);
}
async function updateUser(user) {
  const res = await put(Psama.Users, [user]);
  const newUser = mapExtendedUser(res[0]);
  const store = get(users);
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
  getUser
};

export { UsersStore as U, getUser as g, updateUser as u };
//# sourceMappingURL=Users-oDxNfFYa.js.map
