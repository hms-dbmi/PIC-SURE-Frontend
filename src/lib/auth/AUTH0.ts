import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';
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

  login = async (redirectTo: string): Promise<void> => {
    console.log('login');
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login/loading?redirectTo=${redirectTo ?? '/'}`;
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
