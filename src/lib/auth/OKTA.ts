import { Psama } from '$lib/paths';
import OktaBaseProvider, { type OktaBaseData as OktaData } from './OktaBaseProvider';

const STATE_NAME = 'oauthState';
const STATE_PREFIX = 'okta-';

class OKTA extends OktaBaseProvider {
  constructor(data: OktaData) {
    console.log(`[OKTA] constructor: data=`, { uri: data.uri, clientid: data.clientid, idp: data.idp, oktalogouturl: data.oktalogouturl });
    if (
      data.uri === undefined ||
      data.clientid === undefined ||
      data.idp === undefined ||
      data.oktalogouturl === undefined
    ) {
      console.error(`[OKTA] constructor: missing required params - uri=${data.uri}, clientid=${data.clientid}, idp=${data.idp}, oktalogouturl=${data.oktalogouturl}`);
      throw new Error('Missing required OKTA parameter(s).');
    }
    super(data, STATE_NAME, STATE_PREFIX);
    this.logouturl = data.logouturl || '';
    console.log(`[OKTA] constructor: initialized, psamaPath=${this.psamaPath}`);
  }

  protected get psamaPath(): string {
    return `${Psama.Auth}/${this.idp}`;
  }
}

export default OKTA;
export type { OktaData as AuthType };
