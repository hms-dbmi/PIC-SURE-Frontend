import { variableKeyFromParams } from '$lib/explorer/variableUrl';

import type { PageLoad } from './$types';

// The page is nothing but dictionary data, and the dictionary client builds its request URL
// from `window.location.origin` (`$lib/api.ts`), so none of it can run on the server.
export const ssr = false;

/**
 * Turns the URL back into the key the dictionary needs. `undefined` for a key that addresses
 * nothing, which the page renders as a readable error rather than a lookup for an empty
 * concept path.
 */
export const load: PageLoad = ({ params }) => ({
  variableKey: variableKeyFromParams(params),
});
