import { Psama } from '$lib/paths';
import OktaBaseProvider, { type OktaBaseData as RasData } from './OktaBaseProvider';

// DEPRECATED. Provided for compatability but future state should use OKTA provider for RAS
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

  protected getLogoutRedirectUri(): string {
    return `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? ':' + window.location.port : ''
    }/login`;
  }
}

export default RAS;
export type { RasData as AuthType };
