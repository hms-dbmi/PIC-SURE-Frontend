import type { AuthData } from '#lib/auth/providers/AuthProvider.ts';
import AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import type { User } from '#lib/auth/model/user.ts';
import * as psamaUser from '#lib/api/psama/user.ts';
import auth0 from 'auth0-js';
import { AUTH0_TENANT } from '#lib/config/deployment.ts';
import { newLoginState, verifyLoginState } from '#lib/auth/loginState.ts';

interface Auth0Data extends AuthData {
  clientid: string;
  connection: string;
  domain?: string;
}

class Auth0 extends AuthProvider implements Auth0Data {
  clientid: string;
  connection: string;
  domain?: string;

  constructor(data: Auth0Data) {
    super(data);
    this.clientid = data.clientid;
    this.connection = data.connection;
    this.domain = data.domain;
  }

  // The implicit grant answers in the hash, form-encoded and in any order: `access_token`,
  // `token_type`, `expires_in` and `state`, or `error`, `error_description` and `state`.
  authenticate = async (hashParts: string[]): Promise<User | undefined> => {
    const response = new URLSearchParams(hashParts.join('&').replace(/^#/, ''));
    verifyLoginState(response.get('state') ?? undefined);
    const error = response.get('error');
    if (error) {
      const reason = [error, response.get('error_description')].filter(Boolean).join(': ');
      throw new Error(`Auth0 login failed: ${reason}`);
    }
    const token = response.get('access_token');
    if (!token) return undefined;
    return psamaUser.authenticate('auth0', {
      access_token: token,
      redirectURI: this.getRedirectURI(),
    });
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    const redirectUrl = this.getRedirectURI();
    this.saveState(redirectTo, type);
    const webAuth = new auth0.WebAuth({
      domain: this.domain || AUTH0_TENANT + '.auth0.com',
      clientID: this.clientid || '',
      redirectUri: redirectUrl,
      responseType: 'token',
    });
    return webAuth.authorize({
      responseType: 'token',
      connection: this.connection,
      state: newLoginState(),
    });
  };

  // Ends only the PIC-SURE session: the Auth0 session stays for the next login.
  logout = async (): Promise<void> => {};
}

export default Auth0;
export type { Auth0Data as AuthType };
