import { browser } from '$app/env';
import type { AuthData } from '#lib/auth/providers/AuthProvider.ts';
import AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import * as psamaUser from '#lib/api/psama/user.ts';
import type { OktaUser } from '#lib/auth/model/user.ts';
import { OKTA_ID_TOKEN_KEY } from '#lib/auth/token.ts';
import { newLoginState, verifyLoginState } from '#lib/auth/loginState.ts';

export interface OktaBaseData extends AuthData {
  uri: string;
  clientid: string;
  idp: string;
  oktaidpid: string;
  oktalogouturl: string;
}

abstract class OktaBaseProvider extends AuthProvider implements OktaBaseData {
  uri: string;
  clientid: string;
  oktaidpid: string;
  oktalogouturl: string;
  idp: string;

  constructor(data: OktaBaseData) {
    super(data);
    this.uri = data.uri;
    this.clientid = data.clientid;
    this.oktaidpid = data.oktaidpid;
    this.idp = data.idp;
    this.oktalogouturl = data.oktalogouturl;
  }

  /** The provider's name in PSAMA's authentication path. */
  protected abstract get psamaProvider(): string;

  authenticate = async (hashParts: string[]): Promise<OktaUser | undefined> => {
    const responseMap = this.getResponseMap(hashParts);
    verifyLoginState(responseMap.get('state'));
    const code = responseMap.get('code');
    if (!code) return undefined;

    const newUser = await psamaUser.authenticate<OktaUser>(this.psamaProvider, { code });
    if (newUser && newUser?.oktaIdToken) {
      newUser.oktaIdToken && localStorage.setItem(OKTA_ID_TOKEN_KEY, newUser.oktaIdToken);
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
      const state = newLoginState();
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
    const oktaIdToken = localStorage.getItem(OKTA_ID_TOKEN_KEY);
    return (
      this.oktalogouturl +
      `?id_token_hint=${oktaIdToken}` +
      `&post_logout_redirect_uri=${this.logoutRedirectUri}`
    );
  }
}

export default OktaBaseProvider;
