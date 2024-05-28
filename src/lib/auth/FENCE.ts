import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';

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

  login = async (redirectTo: string): Promise<void> => {
    let redirectUrl = '/';
    if (browser) {
      redirectUrl = `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login/loading?redirectTo=${redirectTo ?? '/'}`;
      const fenceUrl = `${this.uri}/user/oauth2/authorize?response_type=code&scope=user+openid&client_id=${this.clientid}&redirect_uri=${redirectUrl}&idp=${this.idp}`;
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
