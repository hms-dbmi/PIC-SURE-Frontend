import { get, writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

import * as api from '$lib/api';
import type { User } from '../models/User';

export const user: Writable<User> = writable({});

export async function getUser(force?: boolean) {
  if (force || !get(user)?.privileges) {
    const res = await api.get('psama/user/me?hasToken').then((res) => res);
    user.set(res);
  }
}

export async function refreshToken() {
  const newLongTermToken = await api
    .get('psama/user/me/refresh_long_term_token')
    .then((response: { userLongTermToken: string }) => {
      if (!response.userLongTermToken) {
        throw new Error('No user token was returned.');
      }
      return response.userLongTermToken;
    });
  user.set({ ...get(user), token: newLongTermToken });
}

export async function login(token: string) {
  if (browser && token) {
    sessionStorage.setItem('token', token);
    await getUser(true);
  }
}

export async function logout() {
  if (browser) {
    sessionStorage.removeItem('token');
  }
  user.set({});
}
