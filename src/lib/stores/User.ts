import { get, writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

import * as api from '$lib/api';
import type { User } from '../models/User';

export const user: Writable<User> = writable(decodeSavedToken());

function decodeSavedToken() {
  if (browser) {
    try {
      const token = sessionStorage.getItem('token') || '';
      const { exp, email } = JSON.parse(atob(token.split('.')[1]));
      return { exp, email, token };
    } catch (e) {
      return {};
    }
  } else {
    return {};
  }
}

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
      return response.userLongTermToken;
    });
  if (!newLongTermToken) {
    return false;
  }
  user.set({ ...get(user), token: newLongTermToken });
  return true;
}

export async function logout() {
  if (browser) {
    sessionStorage.removeItem('token');
  }
  user.set({});
}
