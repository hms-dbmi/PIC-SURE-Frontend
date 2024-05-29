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

  authenticate = async (redirectTo: string, hashParts: string[]): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };
  login = async (redirectTo: string, type: string): Promise<void> => {
    throw new Error('Method not implemented.');
  };
  logout = async (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}
