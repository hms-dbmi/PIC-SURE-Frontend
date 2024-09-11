import { browser } from '$app/environment';
import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import * as api from '$lib/api';
import type { User } from '$lib/models/User';
import { login as UserLogin } from '$lib/stores/User';

interface RasData extends AuthData {
  uri: string;
  clientid: string;
  state?: string;
}

class RAS extends AuthProvider implements RasData {
  uri: string;
  clientid: string;
  state: string;

  constructor(data: RasData) {
    super(data);
    this.uri = data.uri;
    this.clientid = data.clientid;
    this.state = data.state ?? this.generateRandomState();
  }

  private generateRandomState() {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timePart = new Date().getTime().toString(36);
    return randomPart + timePart;
  }

  //TODO: create real return types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate = async (hashParts: string[]): Promise<boolean> => {
    const responseMap = this.getResponseMap(hashParts);
    const code = responseMap.get('code');
    let state = '';
    if (browser) {
      state = sessionStorage.getItem('state') || '';
    }
    if (!code || state !== this.state) {
      return true;
    }
    try {
      const newUser: User = await api.post('psama/okta/authentication', { code });
      if (newUser?.token) {
        UserLogin(newUser.token);
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
      window.location.href = encodeURI(
        `${this.uri}/oauth2/default/v1/authorize?response_type=code&scope=openid&client_id=${this.clientid}&provider=${type}&redirect_uri=${redirectUrl}&state=${this.state}`,
      );
    }
  };
  logout = (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}

export default RAS;
export type { RasData as AuthType };
