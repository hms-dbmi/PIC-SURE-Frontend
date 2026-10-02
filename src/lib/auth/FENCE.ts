import type { AuthData } from '#lib/models/AuthProvider.js';
import AuthProvider from '#lib/models/AuthProvider.js';
import { browser } from '$app/env';
import * as api from '#lib/api.js';
import type { User } from '#lib/models/User.js';
import { Psama } from '#lib/paths.js';

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
        `&idp=${this.idp}`;
      window.location.href = encodeURI(fenceUrl);
    } else {
      throw new Error('Only browser supported');
    }
  };

  logout = async (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}

export default Fence;
export type { FenceData as AuthType };
