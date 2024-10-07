import { browser } from '$app/environment';
import type { Indexable } from '$lib/types';

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
}

export default class AuthProvider implements AuthData {
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  icon?: string | undefined;
  loginurl?: string | undefined;
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
      const [key, value] = part.split('=');
      map.set(key, value);
      return map;
    }, new Map<string, string>());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (hashParts: string[]): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login = async (redirectTo: string, type: string): Promise<void> => {
    throw new Error('Method not implemented.');
  };
  logout = async (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}
