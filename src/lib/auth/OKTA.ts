import { browser } from '$app/environment';
import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import * as api from '$lib/api';
import type { OktaUser } from '$lib/models/User';
import { Psama } from '$lib/paths';

const STATE_NAME = 'oauthState';
const STATE_PREFIX = 'okta-';

interface OktaData extends AuthData {
  uri: string;
  clientid: string;
  state?: string;
  idp: string;
  oktaidpid: string;
  oktalogouturl: string;
  connection: string;
}

class OKTA extends AuthProvider implements OktaData {
  uri: string;
  clientid: string;
  state: string;
  oktaidpid: string;
  oktalogouturl: string;
  idp: string;
  connection: string;

  constructor(data: OktaData) {
    super(data);
    this.state = localStorage.getItem(STATE_NAME) || STATE_PREFIX + this.generateRandomState();
    localStorage.setItem(STATE_NAME, this.state);

    if (
      data.uri === undefined ||
      data.clientid === undefined ||
      data.oktaidpid === undefined ||
      data.logouturl === undefined ||
      data.oktalogouturl === undefined
    ) {
      throw new Error('Missing required OKTA parameter(s).');
    }

    this.uri = data.uri;
    this.clientid = data.clientid;
    this.oktaidpid = data.oktaidpid;
    this.idp = data.idp;
    this.oktalogouturl = data.oktalogouturl;
    this.connection = data.connection || 'Okta';
  }

  private generateRandomState() {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timePart = new Date().getTime().toString(36);
    return randomPart + timePart;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (hashParts: string[]): Promise<OktaUser | undefined> => {
    const responseMap = this.getResponseMap(hashParts);
    const code = responseMap.get('code');
    const responseState = responseMap.get('state') || '';
    const localState = this.state;

    if (!code || localState !== responseState) {
      console.debug(
        'OKTA authentication failed code: ',
        code,
        ' state: ',
        responseState,
        ' localState: ',
        localState,
      );
      return undefined;
    }

    const psamaPath = this.connection ? `${Psama.Auth}/${this.connection}` : Psama.Auth;
    const newUser: OktaUser = await api.post(psamaPath, { code });
    if (newUser && newUser?.oktaIdToken) {
      newUser.oktaIdToken && localStorage.setItem('oktaIdToken', newUser.oktaIdToken);
      return newUser;
    }

    throw new Error('OKTA authentication failed. Missing Okta ID token.');
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = this.getRedirectURI().replace(/\/$/, '');
      this.saveState(redirectTo, type, this.idp);
      const clientID = encodeURIComponent(this.clientid);
      const idpId = encodeURIComponent(this.oktaidpid);
      window.location.href =
        this.uri +
        '?response_type=code' +
        '&scope=openid' +
        `&client_id=${clientID}` +
        `&idp=${idpId}` +
        `&redirect_uri=${redirectUrl}` +
        `&state=${this.state}`;
    }
  };
  logout = (): Promise<string> => {
    localStorage.removeItem('state');

    const redirect = encodeURI(
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login`,
    );

    const oktaIdToken = localStorage.getItem('oktaIdToken');
    const oktaRedirect =
      this.oktalogouturl +
      '?id_token_hint=' +
      oktaIdToken +
      '&post_logout_redirect_uri=' +
      redirect;

    const oktaEncodedRedirect = encodeURIComponent(oktaRedirect);
    const logoutUrl = this.logouturl + oktaEncodedRedirect;
    return Promise.resolve(logoutUrl);
  };
}

export default OKTA;
export type { OktaData as AuthType };
