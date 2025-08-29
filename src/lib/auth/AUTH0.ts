import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';
import type { User } from '$lib/models/User';
import * as api from '$lib/api';
import auth0 from 'auth0-js';
import { Psama } from '$lib/paths';

interface Auth0Data extends AuthData {
  clientid: string;
  connection: string;
}

class Auth0 extends AuthProvider implements Auth0Data {
  clientid: string;
  connection: string;

  constructor(data: Auth0Data) {
    super(data);
    this.clientid = data.clientid;
    this.connection = data.connection;
  }

  authenticate = async (hashParts: string[]): Promise<User | undefined> => {
    const responseMap = this.getResponseMap(hashParts);
    const token = responseMap.get('#access_token');
    if (browser && token) {
      const redirectURI = this.getRedirectURI();
      return api.post(`${Psama.Auth}/auth0`, {
        access_token: token,
        redirectURI: redirectURI,
      });
    }
    return undefined;
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    const redirectUrl = this.getRedirectURI();
    this.saveState(redirectTo, type);
    const webAuth = new auth0.WebAuth({
      domain: (import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab') + '.auth0.com',
      clientID: this.clientid || '',
      redirectUri: redirectUrl,
      responseType: 'token',
    });
    return webAuth.authorize({
      responseType: 'token',
      connection: this.connection,
    });
  };

  logout = async (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}

export default Auth0;
export type { Auth0Data as AuthType };
