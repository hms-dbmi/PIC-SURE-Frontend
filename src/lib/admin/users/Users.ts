import { get, writable, type Writable } from 'svelte/store';
import { mapExtendedUser, type ExtendedUser, type UserRequest } from '#lib/auth/model/user.ts';

import * as access from '#lib/api/psama/access.ts';

const loaded = writable(false);
export const users: Writable<ExtendedUser[]> = writable([]);

export async function loadUsers() {
  if (get(loaded)) return;

  const res = await access.users.list();
  users.set(res.map(mapExtendedUser));
  loaded.set(true);
}

export async function getUser(uuid: string) {
  const store: ExtendedUser[] = get(users);
  const user = store.find((u) => u.uuid === uuid);
  if (user) {
    return user;
  }

  return mapExtendedUser(await access.users.get(uuid));
}

export async function getUserByEmailAndConnection(email: string, connection: string) {
  let store: ExtendedUser[] = get(users);
  if (store.length === 0) {
    await loadUsers();
    store = get(users);
  }

  return store.find((u) => u.email === email && u.connection === connection);
}

export async function addUser(user: UserRequest) {
  const newUser: ExtendedUser = mapExtendedUser(await access.users.add(user));

  const store: ExtendedUser[] = get(users);
  store.push(newUser);
  users.set(store);
}

export async function updateUser(user: UserRequest) {
  const newUser: ExtendedUser = mapExtendedUser(
    await access.users.update({
      uuid: user.uuid,
      email: user.email,
      active: user.active,
      generalMetadata: user.generalMetadata,
      connection: user.connection,
      roles: user.roles,
    }),
  );

  const store: ExtendedUser[] = get(users);
  const roleIndex: number = store.findIndex((r) => r.uuid === newUser.uuid);
  if (roleIndex === -1) {
    store.push(newUser);
  } else {
    store[roleIndex] = newUser;
  }
  users.set(store);
}

export default {
  subscribe: users.subscribe,
  users,
  loadUsers,
  getUser,
  addUser,
  updateUser,
};
