import type { AuthData } from '#lib/auth/providers/AuthProvider.ts';
import AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import { browser } from '$app/env';
import * as psamaUser from '#lib/api/psama/user.ts';
import type { User } from '#lib/auth/model/user.ts';
import { newLoginState, verifyLoginState } from '#lib/auth/loginState.ts';

interface FenceData extends AuthData {
  uri: string;
  clientid: string;
  idp: string;
}

class Fence extends AuthProvider implements FenceData {
  uri: string;
  clientid: string;
  idp: string;

  constructor(data: FenceData) {
    super(data);
    this.uri = data.uri;
    this.clientid = data.clientid;
    this.idp = data.idp;
  }

  authenticate = async (hashParts: string[]): Promise<User | undefined> => {
    const responseMap = this.getResponseMap(hashParts);
    verifyLoginState(responseMap.get('state'));
    const code = responseMap.get('code');
    if (!code) {
      return undefined;
    }
    return await psamaUser.authenticate('fence', { code });
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    if (browser) {
      const redirectUrl = this.getRedirectURI();
      this.saveState(redirectTo, type, this.idp);
      const fenceUrl =
        this.uri +
        '/user/oauth2/authorize' +
        '?response_type=code' +
        '&scope=user+openid' +
        `&client_id=${this.clientid}` +
        `&redirect_uri=${redirectUrl}` +
        `&idp=${this.idp}` +
        `&state=${newLoginState()}`;
      window.location.href = encodeURI(fenceUrl);
    } else {
      throw new Error('Only browser supported');
    }
  };

  /**
   * Returns Fence's own logout URL, so the browser ends the Fence session and the next login asks
   * for the account again instead of signing the same user back in. Fence sends the browser on to
   * `logouturl`, or to this application's login page, and refuses a host that is not in its
   * `LOGIN_REDIRECT_WHITELIST`.
   */
  logout = (): Promise<string> => {
    const next =
      this.logouturl ||
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login`;
    return Promise.resolve(`${this.uri}/user/logout?next=${encodeURIComponent(next)}`);
  };
}

export default Fence;
export type { FenceData as AuthType };
