import { get, writable, type Writable } from 'svelte/store';
import { mapExtendedUser, type ExtendedUser } from '../models/User';

import * as api from '$lib/api';

const USER_URL = 'psama/user';

const loaded = writable(false);
export const users: Writable<ExtendedUser[]> = writable([]);

export async function loadUsers() {
  if (get(loaded)) return;

  const res = await api.get(USER_URL);
  users.set(res.map(mapExtendedUser));
  loaded.set(true);
}

async function getUser(uuid: string) {
  const store: ExtendedUser[] = get(users);
  const user = store.find((u) => u.uuid === uuid);
  if (user) {
    return user;
  }

  const res = await api.get(`${USER_URL}/${uuid}`);
  return mapExtendedUser(res);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addUser(user: any) {
  const res = await api.post(USER_URL, [ user ]);
  const newRole = mapExtendedUser(res.content[0]);

  const store: ExtendedUser[] = get(users);
  store.push(newRole);
  users.set(store);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateUser(user: any) {
  const res = await api.put(USER_URL, [ user ]);
  const newUser = mapExtendedUser(res.content[0]);

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
