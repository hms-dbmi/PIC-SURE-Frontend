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
  const store = get(users);
  return store.find((u) => u.uuid === uuid);
}

export default {
  subscribe: users.subscribe,
  users,
  loadUsers,
  getUser,
};
