import { browser } from '$app/environment';
import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import * as api from '$lib/api';
import type { OktaUser } from '$lib/models/User';
import { login as UserLogin } from '$lib/stores/User';

interface RasData extends AuthData {
  uri: string;
  clientid: string;
  state?: string;
  idp: string;
  oktalogoutredirect?: string;
  oktaidtoken?: string;
  sessionlogouturi?: string;
  oktaidpid?: string;
}

class RAS extends AuthProvider implements RasData {
  uri: string;
  clientid: string;
  state: string;
  idp: string;
  oktalogoutredirect?: string;
  oktaidioken?: string;
  sessionlogouturi?: string;
  oktaidpid: string;

  constructor(data: RasData) {
    super(data);
    this.uri = data.uri;
    this.clientid = data.clientid;
    if (data.oktaidpid === undefined) {
      throw new Error('OKTA IDP Id is required for RAS');
    }
    this.oktaidpid = data.oktaidpid;
    this.state = 'ras-' + this.generateRandomState();
    this.idp = data.idp;
    this.oktalogoutredirect = data.oktalogoutredirect;
    this.oktaidioken = data.oktaidioken;
    this.sessionlogouturi = data.sessionlogouturi;
  }

  private generateRandomState() {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timePart = new Date().getTime().toString(36);
    return randomPart + timePart;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (hashParts: string[]): Promise<boolean> => {
    const responseMap = this.getResponseMap(hashParts);
    const code = responseMap.get('code');
    const responseState = responseMap.get('state') || '';
    const localState = this.state;

    console.log('code: ', code);
    console.log('localState: ', localState);
    console.log('responseState: ', responseState);
    if (!code || localState !== localState) {
      return true;
    }

    try {
      const newUser: OktaUser = await api.post('psama/authentication/ras', { code });
      if (newUser?.token) {
        await UserLogin(newUser.token);
        newUser.oktaIdToken && localStorage.setItem('oktaIdToken', newUser.oktaIdToken);
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error('Login Error: ', error);
      return true;
    }
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = this.getRedirectURI();
      redirectUrl = redirectUrl.replace(/\/$/, '');
      this.saveState(redirectTo, type, this.idp);
      const rasClientID = encodeURIComponent(this.clientid);
      const rasIdpId = encodeURIComponent(this.oktaidpid);
      window.location.href = `${this.uri}?response_type=code&scope=openid&client_id=${rasClientID}&idp=${rasIdpId}&redirect_uri=${redirectUrl}&state=${this.state}`;
    }
  };
  logout = (): Promise<string> => {
    const redirect = encodeURI(
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login`,
    );

    const oktaIdToken = localStorage.getItem('oktaIdToken');
    const oktaRedirect =
      this.oktalogoutredirect +
      '?id_token_hint=' +
      oktaIdToken +
      '&post_logout_redirect_uri=' +
      redirect;

    const oktaEncodedRedirect = encodeURIComponent(oktaRedirect);
    const logoutUrl = this.sessionLogoutURI + oktaEncodedRedirect;
    return Promise.resolve(logoutUrl);
  };
}

export default RAS;
export type { RasData as AuthType };
