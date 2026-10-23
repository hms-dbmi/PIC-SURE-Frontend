import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';
import * as api from '$lib/api';
import type { User } from '$lib/models/User';
import { Psama } from '$lib/paths';

interface FenceData extends AuthData {
  uri: string;
  clientid: string;
  idp: string;
}

const REAUTH_FLAG = 'fence-reauth';

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
    const code = responseMap.get('code');
    if (!code) {
      return undefined;
    }
    return await api.post(`${Psama.Auth}/fence`, { code });
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
      localStorage.setItem(REAUTH_FLAG, 'true');
    } catch {
      return;
    }
  };

  /** Returns whether a logout left the re-authentication flag set, and clears it. */
  private consumeReauthFlag(): boolean {
    try {
      const flagged = localStorage.getItem(REAUTH_FLAG) === 'true';
      localStorage.removeItem(REAUTH_FLAG);
      return flagged;
    } catch {
      return false;
    }
  }
}

export default Fence;
export type { FenceData as AuthType };
