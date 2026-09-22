import { variableKeyFromParams } from '$lib/explorer/variableUrl';

import type { PageLoad } from './$types';

// The page is nothing but dictionary data, and the dictionary client builds its request URL
// from `window.location.origin` (`$lib/api.ts`), so none of it can run on the server.
export const ssr = false;

export const load: PageLoad = ({ params }) => ({
  variableKey: variableKeyFromParams(params),
});
