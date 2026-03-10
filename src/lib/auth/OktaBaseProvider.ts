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
    const existingState = localStorage.getItem(stateKey);
    this.state = existingState || statePrefix + this.generateRandomState();
    localStorage.setItem(stateKey, this.state);
    console.log(`[OktaBaseProvider] constructor: stateKey=${stateKey}, existingState=${existingState ? 'found' : 'generated new'}, state=${this.state}`);

    this.uri = data.uri;
    this.clientid = data.clientid;
    this.oktaidpid = data.oktaidpid;
    this.idp = data.idp;
    this.oktalogouturl = data.oktalogouturl;
    console.log(`[OktaBaseProvider] constructor: uri=${this.uri}, clientid=${this.clientid}, idp=${this.idp}, oktaidpid=${this.oktaidpid}`);
  }

  protected generateRandomState(): string {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timePart = new Date().getTime().toString(36);
    return randomPart + timePart;
  }

  protected abstract get psamaPath(): string;

  protected getLogoutRedirectUri(): string {
    return (
      this.logouturl ||
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (hashParts: string[]): Promise<OktaUser | undefined> => {
    console.log(`[OktaBaseProvider] authenticate: called with hashParts=`, hashParts);
    const responseMap = this.getResponseMap(hashParts);
    const code = responseMap.get('code');
    const responseState = responseMap.get('state') || '';
    const localState = this.state;

    console.log(`[OktaBaseProvider] authenticate: code=${code ? code.substring(0, 10) + '...' : 'MISSING'}, responseState=${responseState}, localState=${localState}, statesMatch=${localState === responseState}`);

    if (!code || localState !== responseState) {
      console.error(
        `[OktaBaseProvider] authenticate: FAILED - ${!code ? 'missing code' : 'state mismatch'}`,
        { code: !!code, responseState, localState, match: localState === responseState },
      );
      return undefined;
    }

    console.log(`[OktaBaseProvider] authenticate: POSTing to psamaPath=${this.psamaPath} with code`);
    try {
      const newUser: OktaUser = await api.post(this.psamaPath, { code });
      console.log(`[OktaBaseProvider] authenticate: PSAMA response received`, {
        hasUser: !!newUser,
        hasToken: !!newUser?.token,
        hasOktaIdToken: !!newUser?.oktaIdToken,
        userId: newUser?.userId,
        email: newUser?.email,
      });
      if (newUser && newUser?.oktaIdToken) {
        newUser.oktaIdToken && localStorage.setItem('oktaIdToken', newUser.oktaIdToken);
        console.log(`[OktaBaseProvider] authenticate: SUCCESS - user authenticated, oktaIdToken stored`);
        return newUser;
      }

      console.error(`[OktaBaseProvider] authenticate: FAILED - user returned but missing oktaIdToken`, newUser);
      throw new Error(`${this.constructor.name} authentication failed. Missing Okta ID token.`);
    } catch (error) {
      console.error(`[OktaBaseProvider] authenticate: ERROR during PSAMA POST`, error);
      throw error;
    }
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    if (browser) {
      const redirectUrl = this.getRedirectURI().replace(/\/$/, '');
      this.saveState(redirectTo, type, this.idp);
      const clientID = encodeURIComponent(this.clientid);
      const idpId = this.oktaidpid ? encodeURIComponent(this.oktaidpid) : undefined;
      const redirect = encodeURIComponent(redirectUrl);
      const state = encodeURIComponent(this.state);
      const authUrl =
        this.uri +
        '?response_type=code' +
        '&scope=openid' +
        `&client_id=${clientID}` +
        (idpId ? `&idp=${idpId}` : '') +
        `&redirect_uri=${redirect}` +
        `&state=${state}`;
      console.log(`[OktaBaseProvider] login: redirectTo=${redirectTo}, type=${type}, idp=${this.idp}`);
      console.log(`[OktaBaseProvider] login: redirectUrl=${redirectUrl}`);
      console.log(`[OktaBaseProvider] login: state saved=${this.state}`);
      console.log(`[OktaBaseProvider] login: navigating to Okta authUrl=${authUrl}`);
      window.location.href = authUrl;
    }
  };

  logout = (): Promise<string> => {
    localStorage.removeItem(this.stateStorageKey);

    const logoutRedirect = encodeURI(this.getLogoutRedirectUri());
    const oktaIdToken = localStorage.getItem('oktaIdToken');
    const oktaRedirect =
      this.oktalogouturl +
      `?id_token_hint=${oktaIdToken}` +
      `&post_logout_redirect_uri=${logoutRedirect}`;

    const oktaEncodedRedirect = encodeURIComponent(oktaRedirect);
    const logoutUrl = (this.logouturl || '') + oktaEncodedRedirect;
    return Promise.resolve(logoutUrl);
  };
}

export default OktaBaseProvider;
