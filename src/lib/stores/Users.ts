import { get, writable, type Writable } from 'svelte/store';
import { mapExtendedUser, type ExtendedUser, type UserRequest, type User } from '../models/User';

import * as api from '$lib/api';

const USER_URL = 'psama/user';

const loaded = writable(false);
export const users: Writable<ExtendedUser[]> = writable([]);

export async function loadUsers() {
  if (get(loaded)) return;

  const res: User[] = await api.get(USER_URL);
  users.set(res.map(mapExtendedUser));
  loaded.set(true);
}

export async function getUser(uuid: string) {
  const store: ExtendedUser[] = get(users);
  const user = store.find((u) => u.uuid === uuid);
  if (user) {
    return user;
  }

  const res: User = await api.get(`${USER_URL}/${uuid}`);
  return mapExtendedUser(res);
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
  const res: User[] = await api.post(USER_URL, [user]);
  const newUser: ExtendedUser = mapExtendedUser(res[0]);

  const store: ExtendedUser[] = get(users);
  store.push(newUser);
  users.set(store);
}

export async function updateUser(user: UserRequest) {
  const res: User[] = await api.put(USER_URL, [user]);
  const newUser: ExtendedUser = mapExtendedUser(res[0]);

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
