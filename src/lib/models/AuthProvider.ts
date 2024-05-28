import type { Indexable } from '$lib/types';

export interface AuthData extends Indexable {
  name: string;
  description: string;
  type: string;
  icon?: string;
  enabled: boolean;
  loginurl?: string;
  logouturl?: string;
  callbackurl?: string;
}

interface AuthFuncs extends AuthData {
  login(redirectTo: string): Promise<any>;
  logout(): Promise<void>;
}
export default class AuthProvider implements AuthFuncs {
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
    this.loginurl = data.loginurl;
    this.logouturl = data.logouturl;
    this.callbackurl = data.callbackurl;
  }

  login = async (redirectTo: string): Promise<void> => {
    throw new Error('Method not implemented.');
  };
  logout = async (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}
