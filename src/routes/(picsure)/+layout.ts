import type { LayoutLoad } from './$types';
import { session } from '#lib/auth/session.svelte.ts';

// Loads the signed-in user's profile once, for public pages too. It reads neither the URL nor the
// parent data, so SvelteKit never runs it again on a navigation or a preload; the guards that
// check privileges wait for it.
export const load: LayoutLoad = () => {
  session.bootstrap();
};
