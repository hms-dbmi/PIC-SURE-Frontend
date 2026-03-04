import { Psama } from '$lib/paths';
import OktaBaseProvider, { type OktaBaseData as OktaData } from './OktaBaseProvider';

const STATE_NAME = 'oauthState';
const STATE_PREFIX = 'okta-';

class OKTA extends OktaBaseProvider {
  constructor(data: OktaData) {
    if (
      data.uri === undefined ||
      data.clientid === undefined ||
      data.oktaidpid === undefined ||
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
}

export default OKTA;
export type { OktaData as AuthType };
