import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';
import { login as UserLogin } from '$lib/stores/User';
import type { User } from '$lib/models/User';
import * as api from '$lib/api';
import auth0 from 'auth0-js';

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

  //TODO: create real return types
  authenticate = async (redirectTo = '/', hashParts: string[]): Promise<boolean> => {
    if (!hashParts || hashParts.length === 0) {
      return true;
    }
    const auth0ResponseMap: Map<string, string> = this.getResponseMap(hashParts);
    const token = auth0ResponseMap.get('#access_token');
    if (browser && token) {
      const redirectURI = this.getRedirectURI(redirectTo, this.type);
      try {
        const newUser: User = await api.post('psama/authentication', {
          access_token: token,
          redirectURI: redirectURI,
        });
        if (newUser?.token) {
          UserLogin(newUser.token);
          return false;
        } else {
          return true;
        }
      } catch (error) {
        console.error('Login Error: ', error);
        return true;
      }
    }
    return true;
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = this.getRedirectURI(redirectTo, type);
    }
    const webAuth = new auth0.WebAuth({
      domain: 'avillachlab.auth0.com',
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
