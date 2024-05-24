import type { AuthData } from "$lib/models/AuthProvider"; 
import { browser } from '$app/environment';
import auth0 from 'auth0-js';

export interface Auth0Data extends AuthData {
  clientid?: string;
  connection?: string;
}

export default class Auth0 implements Auth0Data {
  name?: string;
  description?: string = "Log in with Google";
  icon?: string;
  enabled: boolean = false;
  loginurl?: string;
  logouturl?: string;
  callbackurl?: string;
  clientid?: string;
  connection?: string;

  getConfig = (): Auth0Data => {
    return {
      name: this.name,
      description: this.description,
      icon: this.icon,
      enabled: this.enabled,
      loginurl: this.loginurl,
      logouturl: this.logouturl,
      callbackurl: this.callbackurl,
      clientid: this.clientid,
      connection: this.connection,
    };
  };

  login = (redirectTo: string) => {
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
    webAuth?.authorize({
      responseType: 'token',
      connection: this.connection,
    });
  }
  logout = async () => {console.log('logout')}; 
}