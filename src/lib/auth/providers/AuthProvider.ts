import { browser } from '$app/env';
import type { User, OktaUser } from '#lib/auth/model/user.ts';
import { SESSION_PROVIDER_KEY } from '#lib/auth/token.ts';

/**
 * A login provider's settings: `name` and `enabled` from hooks.server.ts, the rest from the
 * provider's `VITE_AUTH_PROVIDER_MODULE_<NAME>_<FIELD>` variables. hooks.server.ts lowercases the
 * field names, so `_IMAGEALT` arrives as `imagealt`. Each provider type adds its own fields.
 */
export interface AuthData {
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  alt?: boolean;
  helptext?: string;
  imagesrc?: string;
  imagealt?: string;
  logouturl?: string;
}

/**
 * The provider the current login started with, saved by `saveState` before leaving for the IdP.
 * Matched by name, since several providers can share a type (two Okta IdPs). Logins started
 * before the name was saved have only the type.
 */
export function findLoginProvider<T extends AuthData>(providers: T[] = []): T | undefined {
  if (!browser) return undefined;
  const name = sessionStorage.getItem('providerName');
  if (name) return providers.find((provider) => provider.name === name);
  const type = sessionStorage.getItem('type');
  return type ? providers.find((provider) => provider.type === type) : undefined;
}

/** Records the provider a login went through next to its token, so every tab can log out of it. */
export function saveSessionProvider(provider: AuthData): void {
  localStorage.setItem(SESSION_PROVIDER_KEY, provider.name);
}

/**
 * The provider the signed-in user logged in through, to log out of it. A tab that didn't start the
 * login finds it too. Sessions from before it was saved fall back to this tab's login.
 */
export function findSessionProvider<T extends AuthData>(providers: T[] = []): T | undefined {
  if (!browser) return undefined;
  const name = localStorage.getItem(SESSION_PROVIDER_KEY);
  return name ? providers.find((provider) => provider.name === name) : findLoginProvider(providers);
}

export default class AuthProvider implements AuthData {
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  logouturl?: string | undefined;
  alt: boolean;

  constructor(data: AuthData) {
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.enabled = data.enabled;
    this.alt = data.alt || false;
    this.logouturl = data.logouturl;
  }

  protected getRedirectURI(): string {
    if (!browser) return '/';
    return encodeURI(
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login/loading/`,
    );
  }

  protected saveState(redirectTo = '/', type: string, idp?: string): void {
    if (!browser) return;
    sessionStorage.setItem('redirect', redirectTo);
    sessionStorage.setItem('providerName', this.name);
    type && sessionStorage.setItem('type', type);
    idp && sessionStorage.setItem('idp', idp);
  }

  protected getState() {
    if (!browser)
      return {
        redirect: '/',
        type: 'AUTH0',
        idp: '',
      };
    return {
      redirect: sessionStorage.getItem('redirect') || '/',
      type: sessionStorage.getItem('type') || 'FENCE',
      idp: sessionStorage.getItem('idp') || '',
    };
  }

  protected getResponseMap(hashParts: string[] = []): Map<string, string> {
    return hashParts.reduce((map, part) => {
      // Split on the first '=' only: values such as base64 tokens can end in '=' padding
      const [key, ...value] = part.split('=');
      map.set(key, value.join('='));
      return map;
    }, new Map<string, string>());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (hashParts: string[]): Promise<User | OktaUser | undefined> => {
    throw new Error('Method not implemented.');
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login = async (redirectTo: string, type: string): Promise<void> => {
    throw new Error('Method not implemented.');
  };
  logout = async (): Promise<string | void> => {
    throw new Error('Method not implemented.');
  };
}
