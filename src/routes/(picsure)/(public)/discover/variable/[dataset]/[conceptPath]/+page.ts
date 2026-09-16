import { variableKeyFromParams } from '$lib/explorer/variableUrl';

import type { PageLoad } from './$types';

// The page is nothing but dictionary data, and the dictionary client cannot run on a server:
// `api.send` builds its request URL from `window.location.origin` and reads the bearer token
// from `localStorage`, neither of which exists there. Server-rendering this route could
// therefore only ever emit the loading state, so it does not render on the server at all.
export const ssr = false;

/**
 * Turns the URL back into the key the dictionary needs. `undefined` for a key that addresses
 * nothing, which the page renders as a readable error rather than a lookup for an empty
 * concept path.
 */
export const load: PageLoad = ({ params }) => ({
  variableKey: variableKeyFromParams(params),
});
