import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';
import { browser } from '$app/environment';
import type { User } from '$lib/models/User';
import * as api from '$lib/api';
import { Psama } from '$lib/paths';

interface MockData extends AuthData {
  // From VITE_AUTH_PROVIDER_MODULE_<name>_PERSONA - hooks.server.ts lowercases whatever
  // follows the provider prefix onto the AuthData it builds, so this needs no separate
  // wiring beyond the field existing here. See tests/end-to-end/mock-server/index.ts,
  // where it ends up choosing which mock-data.ts user shape `psama/user/me` answers with.
  persona?: string;
}

/**
 * Local-dev-only auth provider. Real providers (AUTH0/OKTA/FENCE/RAS) redirect to an
 * external IDP, which can't be satisfied by tests/end-to-end/mock-server - there's no
 * hosted login page to mock. This skips that hop entirely: `login` jumps straight to the
 * same `/login/loading` callback a real provider would eventually redirect back to, with a
 * fabricated implicit-flow hash, so the rest of the login pipeline (authenticate ->
 * psama/authentication/:provider -> picsureUser) runs unmodified against the mock server.
 *
 * Enable by pointing an existing provider's `_TYPE` at MOCK in `.env`, e.g.:
 *   VITE_AUTH_PROVIDER_MODULE_GOOGLE_TYPE=MOCK
 * See tests/end-to-end/mock-server/README.md.
 */
class Mock extends AuthProvider implements MockData {
  persona?: string;

  constructor(data: MockData) {
    super(data);
    this.persona = data.persona;
  }

  authenticate = async (hashParts: string[]): Promise<User | undefined> => {
    const responseMap = this.getResponseMap(hashParts);
    const token = responseMap.get('#access_token');
    if (browser && token) {
      // `psama/user/me` (fetched right after this by User.ts's hydrateUserFromToken) has
      // no way to see which provider logged in, so persona has to reach it indirectly -
      // this hands it to the mock server here, which remembers it for that next request.
      return api.post(`${Psama.Auth}/mock`, { access_token: token, persona: this.persona });
    }
    return undefined;
  };

  login = async (redirectTo: string, type: string): Promise<void> => {
    if (!browser) return;
    this.saveState(redirectTo, type);
    const redirectUrl = this.getRedirectURI();
    window.location.href = `${redirectUrl}#access_token=mock-local-dev-token&token_type=Bearer`;
  };

  logout = async (): Promise<void> => {
    // Resolves (rather than redirecting to a real IDP's logout endpoint) so User.ts's
    // logout() falls through to its local-only cleanup, same as AUTH0's does today.
  };
}

export default Mock;
export type { AuthData as AuthType };
