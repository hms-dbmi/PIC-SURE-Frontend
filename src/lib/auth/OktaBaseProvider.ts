import { browser } from '$app/environment';
import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import * as api from '$lib/api';
import type { OktaUser } from '$lib/models/User';

export interface OktaBaseData extends AuthData {
  uri: string;
  clientid: string;
  state?: string;
  idp: string;
  oktaidpid: string;
  oktalogouturl: string;
}

abstract class OktaBaseProvider extends AuthProvider implements OktaBaseData {
  uri: string;
  clientid: string;
  state: string;
  oktaidpid: string;
  oktalogouturl: string;
  idp: string;
  protected readonly stateStorageKey: string;

  constructor(data: OktaBaseData, stateKey: string, statePrefix: string) {
    super(data);
    this.stateStorageKey = stateKey;
    this.state = localStorage.getItem(stateKey) || statePrefix + this.generateRandomState();
    localStorage.setItem(stateKey, this.state);

    this.uri = data.uri;
    this.clientid = data.clientid;
    this.oktaidpid = data.oktaidpid;
    this.idp = data.idp;
    this.oktalogouturl = data.oktalogouturl;
  }

  protected generateRandomState(): string {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timePart = new Date().getTime().toString(36);
    return randomPart + timePart;
  }

  protected abstract get psamaPath(): string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (hashParts: string[]): Promise<OktaUser | undefined> => {
    const responseMap = this.getResponseMap(hashParts);
    const code = responseMap.get('code');
    const responseState = responseMap.get('state') || '';
    const localState = this.state;

    if (!code || localState !== responseState) {
      console.debug(
        `${this.constructor.name} authentication failed`,
        `code: ${code}`,
        `state: ${responseState}`,
        `localState: ${localState}`,
      );
      return undefined;
    }

    const newUser: OktaUser = await api.post(this.psamaPath, { code });
    if (newUser && newUser?.oktaIdToken) {
      newUser.oktaIdToken && localStorage.setItem('oktaIdToken', newUser.oktaIdToken);
      return newUser;
    }

    throw new Error(`${this.constructor.name} authentication failed. Missing Okta ID token.`);
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    if (browser) {
      const redirectUrl = this.getRedirectURI().replace(/\/$/, '');
      this.saveState(redirectTo, type, this.idp);
      const clientID = encodeURIComponent(this.clientid);
      const clientidpId = this.oktaidpid ? encodeURIComponent(this.oktaidpid) : undefined;
      const redirect = encodeURIComponent(redirectUrl);
      const state = encodeURIComponent(this.state);
      window.location.href =
        this.uri +
        '?response_type=code' +
        '&scope=openid' +
        `&client_id=${clientID}` +
        (clientidpId ? `&idp=${clientidpId}` : '') +
        `&redirect_uri=${redirect}` +
        `&state=${state}`;
    }
  };

  protected abstract get logoutRedirectUri(): string;
  protected get oktaLogoutRedirectURI(): string {
    const oktaIdToken = localStorage.getItem('oktaIdToken');
    return (
      this.oktalogouturl +
      `?id_token_hint=${oktaIdToken}` +
      `&post_logout_redirect_uri=${this.logoutRedirectUri}`
    );
  }
}

export default OktaBaseProvider;
