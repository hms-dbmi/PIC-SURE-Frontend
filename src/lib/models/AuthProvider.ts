import type { Indexable } from '$lib/types';

export interface AuthData extends Indexable {
  name: string;
  description: string;
  type: string;
  icon?: string;
  enabled: boolean;
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

  constructor(data: AuthData) {
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.icon = data.icon;
    this.enabled = data.enabled;
  }

  protected getRedirectURI(redirectTo = '/', type: string): string {
    if (!type) throw new Error('Provider type is required');
    return encodeURI(
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login/loading?provider=${type}&redirectTo=${redirectTo ?? '/'}`,
    );
  }

  protected getResponseMap(hashParts: string[] = []): Map<string, string> {
    return hashParts.reduce((map, part) => {
      const [key, value] = part.split('=');
      map.set(key, value);
      return map;
    }, new Map<string, string>());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (redirectTo: string, hashParts: string[]): Promise<boolean> => {
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
