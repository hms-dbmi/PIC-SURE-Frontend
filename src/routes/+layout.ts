import type { LayoutLoad } from './$types';
import { applyConfig } from '#lib/config/config.svelte.ts';
import { ACCESS, requireAccess } from '#lib/auth/access.ts';

export const load: LayoutLoad = async (event) => {
  // Runs on both SSR and the client's hydration-time re-run of this load, off the
  // same serialized data.configCache - so the first server render and the client's
  // initial state agree, avoiding the hydration flash this used to cause.
  applyConfig(event.data.configCache);

  // The login pages are where a closed deployment sends everyone else.
  if (!event.url.pathname.includes('/login')) await requireAccess(event, ACCESS.app);
};
