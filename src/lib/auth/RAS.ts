import { Psama } from '$lib/paths';
import OktaBaseProvider, { type OktaBaseData as RasData } from './OktaBaseProvider';

class RAS extends OktaBaseProvider {
  constructor(data: RasData) {
    if (
      data.uri === undefined ||
      data.clientid === undefined ||
      data.oktaidpid === undefined ||
      data.logouturl === undefined ||
      data.oktalogouturl === undefined
    ) {
      throw new Error('Missing required RAS parameter(s).');
    }
    super(data, 'state', 'ras-');
  }

  protected get psamaPath(): string {
    return `${Psama.Auth}/ras`;
  }

  protected get logoutRedirectUri(): string {
    return encodeURI(
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login`,
    );
  }

  // RAS logout flow
  // RAS logouturl set:     App -> RAS(this.logouturl) -> OKTA -> APP
  // RAS logouturl not set: App ------------------------> OKTA -> APP
  logout = (): Promise<string> => {
    localStorage.removeItem(this.stateStorageKey);

    return Promise.resolve(
      this.logouturl
        ? this.logouturl + encodeURIComponent(this.oktaLogoutRedirectURI)
        : this.oktaLogoutRedirectURI,
    );
  };
}

export default RAS;
export type { RasData as AuthType };
