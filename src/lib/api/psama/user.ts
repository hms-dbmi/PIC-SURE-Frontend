import { request } from '#lib/api/client.ts';
import { Psama } from '#lib/api/paths.ts';
import type { ConsentsMap, User } from '#lib/auth/model/user.ts';

/** The signed-in user's profile. With `hasToken`, PSAMA also refreshes and returns their long-term token. */
export function me({ hasToken = false } = {}): Promise<User> {
  // a bare flag, as PSAMA and the e2e mocks know it
  return request<User>(hasToken ? `${Psama.User.Me}?hasToken` : Psama.User.Me);
}

/** The studies the signed-in user may see, by consent concept path. */
export function consents(): Promise<{ consents?: ConsentsMap } | null> {
  return request<{ consents?: ConsentsMap } | null>(Psama.User.Consents);
}

export function refreshLongTermToken(): Promise<{ userLongTermToken?: string }> {
  return request<{ userLongTermToken?: string }>(Psama.User.Refresh);
}

export function logout(): Promise<unknown> {
  return request<unknown>(Psama.User.Logout);
}

/** Trades an identity provider's callback for a PSAMA user with a token. */
export function authenticate<T extends User = User>(
  provider: string,
  body: Record<string, unknown>,
): Promise<T> {
  return request<T>(`${Psama.Auth}/${provider}`, { method: 'POST', body });
}
