import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';
import { login } from '$lib/stores/User';
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

  authenticate = async (redirectTo: string, hashParts: string[]): Promise<boolean> => {
    if (!hashParts || hashParts.length === 0) {
      return true;
    }
    const auth0ResponseMap: Map<string, string> = hashParts.reduce((map, part) => {
      const [key, value] = part.split('=');
      map.set(key, value);
      return map;
    }, new Map<string, string>());
    const token = auth0ResponseMap.get('#access_token');
    if (browser && token) {
      const redirectURI = `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }${redirectTo}`;
      try {
        const res = await api.post('psama/authentication', {
          access_token: token,
          redirectURI: redirectURI,
        });
        const newUser: User = res;
        if (newUser?.token) {
          login(newUser.token);
          return false;
        } else {
          return true;
        }
      } catch (error) {
        return true;
      }
    }
    return true;
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = encodeURI(
        `${window.location.protocol}//${window.location.hostname}${
          window.location.port ? ':' + window.location.port : ''
        }/login/loading?provider=${type}&redirectTo=${redirectTo ?? '/'}`,
      );
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
