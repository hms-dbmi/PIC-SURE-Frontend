import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';
import { login } from '$lib/stores/User';
import * as api from '$lib/api';
import type { User } from '$lib/models/User';

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

  //TODO: create real return types
  authenticate = async (redirectTo: string, hashParts: string[]): Promise<boolean> => {
    const responseMap: Map<string, string> = hashParts.reduce((map, part) => {
      const [key, value] = part.split('=');
      map.set(key, value);
      return map;
    }, new Map<string, string>());
    const code = responseMap.get('code');
    if (!code) {
      return true;
    }
    try {
      const res = await api.post('psama/authentication', { code });
      const newUser: User = res;
      if (newUser?.token) {
        login(newUser.token);
        return false;
      } else {
        return true;
      }
    } catch (error) {
      return true;
    }
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login/loading?provider=${type}&redirectTo=${redirectTo ?? '/'}`;
      const fenceUrl = encodeURI(
        `${this.uri}/user/oauth2/authorize?response_type=code&scope=user+openid&client_id=${this.clientid}&redirect_uri=${redirectUrl}&idp=${this.idp}`,
      );
      window.location.href = fenceUrl;
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
