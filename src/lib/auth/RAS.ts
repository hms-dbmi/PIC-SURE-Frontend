import { browser } from '$app/environment';
import { Psama } from '$lib/paths';
import AuthProvider, { type AuthData } from '$lib/models/AuthProvider';
import * as api from '$lib/api';
import type { RasUser } from '$lib/models/User';

export interface RasData extends AuthData {
  // RAS end-session endpoint base, e.g. https://stsstg.nih.gov/connect/session/logout
  logouturl?: string;
}

const ID_TOKEN_STORAGE_KEY = 'idToken';

/**
 * Direct NIH RAS (Researcher Auth Service) OIDC provider. PSAMA integrates with RAS directly — it
 * builds the authorization request (generating and storing state + nonce server-side), exchanges
 * the code, and validates the ID token. The browser therefore no longer constructs the authorize
 * URL or generates client-side state the way the Okta-brokered flow did; it asks PSAMA for the
 * authorize URL and forwards the returned state back on the callback. This is deliberately NOT an
 * OktaBaseProvider — that base remains for true Okta logins (e.g. AIM-AHEAD).
 */
class RAS extends AuthProvider {
  logouturl: string;

  constructor(data: RasData) {
    super(data);
    this.logouturl = data.logouturl || '';
  }

  protected get psamaPath(): string {
    return `${Psama.Auth}/ras`;
  }

  // Where RAS sends the browser after RP-initiated logout: back to the app login page.
  protected get logoutRedirectUri(): string {
    if (!browser) return '/login';
    return encodeURI(
      `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }/login`,
    );
  }

  /**
   * Start a RAS login. PSAMA owns the authorization request (state + nonce are generated and stored
   * server-side), so we fetch the authorize URL from PSAMA and redirect to it.
   */
  login = async (redirectTo: string, type: string): Promise<void> => {
    if (!browser) return;
    this.saveState(redirectTo, type, 'ras');
    const response = await api.get(`${this.psamaPath}/authorize-url`);
    const authorizeUrl = response?.authorizeUrl;
    if (!authorizeUrl) {
      throw new Error('RAS authorize URL was not returned by PSAMA.');
    }
    window.location.href = authorizeUrl;
  };

  /**
   * Handle the RAS callback. PSAMA validates the state with a one-time server-side consume, so we
   * forward both `code` and `state` and do not perform a client-side state comparison. The RAS ID
   * token is returned under `idToken` (the Okta-brokered flow used `oktaIdToken`) and is retained
   * for RP-initiated logout.
   */
  authenticate = async (hashParts: string[]): Promise<RasUser | undefined> => {
    const responseMap = this.getResponseMap(hashParts);
    const code = responseMap.get('code');
    const state = responseMap.get('state');

    if (!code || !state) {
      console.debug('RAS authentication failed: missing code or state', `code: ${code}`);
      return undefined;
    }

    const newUser: RasUser = await api.post(this.psamaPath, { code, state });
    if (newUser && newUser.idToken) {
      localStorage.setItem(ID_TOKEN_STORAGE_KEY, newUser.idToken);
      return newUser;
    }

    throw new Error('RAS authentication failed. Missing ID token.');
  };

  /**
   * RP-initiated logout against the RAS end-session endpoint (`<ras-base>/connect/session/logout`)
   * using the stored ID token as `id_token_hint`.
   */
  logout = (): Promise<string> => {
    const idToken = browser ? localStorage.getItem(ID_TOKEN_STORAGE_KEY) : null;
    if (browser) {
      localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    }
    const endSessionUrl =
      this.logouturl +
      `?id_token_hint=${encodeURIComponent(idToken ?? '')}` +
      `&post_logout_redirect_uri=${this.logoutRedirectUri}`;
    return Promise.resolve(endSessionUrl);
  };
}

export default RAS;
export type { RasData as AuthType };
