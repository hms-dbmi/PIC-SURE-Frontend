import type { AuthData } from '#lib/auth/providers/AuthProvider.ts';
import AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import { browser } from '$app/env';
import * as psamaUser from '#lib/api/psama/user.ts';
import type { User } from '#lib/auth/model/user.ts';
import { newLoginState, verifyLoginState } from '#lib/auth/loginState.ts';
import { FENCE_REAUTH_KEY } from '#lib/auth/token.ts';

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
        `&state=${newLoginState()}` +
        (this.consumeReauthFlag() ? '&prompt=login' : '');
      window.location.href = encodeURI(fenceUrl);
    } else {
      throw new Error('Only browser supported');
    }
  };

  /**
   * Marks the next login to force Fence to clear its own session and ask the identity provider
   * again, so a user who logged out is not silently signed back in as the same account.
   */
  logout = async (): Promise<void> => {
    try {
      localStorage.setItem(FENCE_REAUTH_KEY, 'true');
    } catch {
      return;
    }
  };

  private consumeReauthFlag(): boolean {
    try {
      const flagged = localStorage.getItem(FENCE_REAUTH_KEY) === 'true';
      localStorage.removeItem(FENCE_REAUTH_KEY);
      return flagged;
    } catch {
      return false;
    }
  }
}

export default Fence;
export type { FenceData as AuthType };
