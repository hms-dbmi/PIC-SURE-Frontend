import { browser } from '$app/env';
import type { Indexable } from '#lib/types.ts';
import type { User, OktaUser } from '#lib/models/User.ts';

export interface AuthData extends Indexable {
  name: string;
  description: string;
  type: string;
  icon?: string;
  helpText?: string;
  enabled: boolean;
  alt: boolean;
  imageSrc?: string;
  imageAlt?: string;
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

export default class AuthProvider implements AuthData {
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  icon?: string | undefined;
  logouturl?: string | undefined;
  callbackurl?: string | undefined;
  alt: boolean;
  imageSrc?: string | undefined;
  imageAlt?: string | undefined;

  constructor(data: AuthData) {
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.icon = data.icon;
    this.enabled = data.enabled;
    this.alt = data.alt || false;
    this.imageSrc = data.imagesrc;
    this.imageAlt = data.imagealt;
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
