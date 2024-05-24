import type { Indexable } from "$lib/types";


export interface AuthData extends Indexable {
  name?: string;
  description?: string;
  icon?: string;
  enabled?: boolean;
  loginurl?: string;
  logouturl?: string;
  callbackurl?: string; 
}

export interface AuthProviderConstructor {
  new (): AuthProvider;
}

export default interface AuthProvider extends AuthData {
  getConfig(): AuthData;
  login(redirectTo: string): Promise<any>;
  logout(): Promise<void>; 
} 