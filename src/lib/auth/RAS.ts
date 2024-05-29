import { browser } from '$app/environment';
import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import * as api from '$lib/api';
import type { User } from '$lib/models/User';
import { login } from '$lib/stores/User';

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

  authenticate = async (redirectTo: string, hashParts: string[]): Promise<boolean> => {
    const responseMap: Map<string, string> = hashParts.reduce((map, part) => {
      const [key, value] = part.split('=');
      map.set(key, value);
      return map;
    }, new Map<string, string>());
    const code = responseMap.get('code');
    const state = sessionStorage.getItem('state');
    if (!code || state !== this.state) {
      return true;
    }
    try {
      const res = await api.post('psama/okta/authentication', { code });
      const newUser: User = res;
      if (newUser?.token) {
        login(newUser.token);
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error(error);
      return true;
    }
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login/loading?redirectTo=${redirectTo ?? '/'}`;
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
