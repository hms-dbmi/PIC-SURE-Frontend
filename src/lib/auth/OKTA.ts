import { Psama } from '$lib/paths';
import OktaBaseProvider, { type OktaBaseData as OktaData } from './OktaBaseProvider';

const STATE_NAME = 'oauthState';
const STATE_PREFIX = 'okta-';

class OKTA extends OktaBaseProvider {
  constructor(data: OktaData) {
    if (
      data.uri === undefined ||
      data.clientid === undefined ||
      data.idp === undefined ||
      data.oktalogouturl === undefined
    ) {
      throw new Error('Missing required OKTA parameter(s).');
    }
    super(data, STATE_NAME, STATE_PREFIX);
    this.logouturl = data.logouturl || '';
  }

  protected get psamaPath(): string {
    return `${Psama.Auth}/${this.idp}`;
  }

  protected get logoutRedirectUri(): string {
    return encodeURI(
      this.logouturl ||
        `${window.location.protocol}//${window.location.hostname}${
          window.location.port ? ':' + window.location.port : ''
        }/login`,
    );
  }

  // OKTA logout flow: App -> Okta -> (this.logouturl || App)
  logout = (): Promise<string> => {
    localStorage.removeItem(this.stateStorageKey);

    return Promise.resolve(this.oktaLogoutRedirectURI);
  };
}

export default OKTA;
export type { OktaData as AuthType };
