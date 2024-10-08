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
  rasRedirect?: string;
  oktaIdToken?: string;
  rasSessionLogoutUri?: string;
}

class RAS extends AuthProvider implements RasData {
  uri: string;
  clientid: string;
  state: string;
  idp: string;
  rasRedirect?: string;
  oktaIdToken?: string;
  sessionLogoutUri?: string;

  constructor(data: RasData) {
    super(data);
    this.uri = data.uri;
    this.clientid = data.clientid;
    this.state = data.state ?? this.generateRandomState();
    this.idp = data.idp;
    this.rasRedirect = data.rasRedirect;
    this.oktaIdToken = data.oktaIdToken;
    this.sessionLogoutUri = data.sesseionLogoutUri;
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
    let state = responseMap.get('state') || '';

    if (browser) {
      state = sessionStorage.getItem('state') || '';
    }

    if (!code || state !== this.state) {
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
      this.saveState(redirectTo, type, this.idp);
      const rasClientID = encodeURIComponent(this.clientid);
      window.location.href = encodeURI(
        `${this.uri}?response_type=code&scope=openid&client_id=${rasClientID}&redirect_uri=${redirectUrl}&state=${this.state}`,
      );
    }
  };
  logout = (): Promise<string> => {
    const oktaRedirect =
      this.rasRedirect +
      '?id_token_hint' +
      this.oktaIdToken +
      '&post_logout_redirect_uri=' +
      this.getRedirectURI();

    const oktaEncodedRedirect = encodeURIComponent(oktaRedirect);
    const logoutUrl = this.sessionLogoutUri + oktaEncodedRedirect;
    return Promise.resolve(logoutUrl);
  };
}

export default RAS;
export type { RasData as AuthType };
