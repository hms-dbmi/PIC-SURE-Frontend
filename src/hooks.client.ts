import type { ClientInit, HandleClientError } from '@sveltejs/kit/hooks';
import { goto, invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import { navigating, page } from '$app/state';
import { appPath } from '#lib/utils/appPath.ts';
import { showAccessUnavailable } from '#lib/auth/accessUnavailable.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';

// Here rather than in a layout because loads run first, and a 401 while the authorized layout
// loads the profile has to reach the login page.
export const init: ClientInit = () => {
  session.connect({
    navigate: (path) => goto(resolve(appPath(path))),
    rerunGuards: async () => {
      await invalidateAll();
      // A navigation that started meanwhile replaced the re-run, which then settles first.
      await navigating.complete?.catch(() => {});
    },
    currentUrl: () => page.url,
    showAccessUnavailable,
  });
};

// SvelteKit requires handleError never to throw.
export const handleError: HandleClientError = ({ kind, error, event }) => {
  if (kind === 'unknown') console.error(error);
  try {
    const details =
      kind === 'unknown'
        ? { message: error instanceof Error ? error.message : String(error) }
        : { status: error.status, message: error.message };
    // keepalive: after a client-side 404, SvelteKit reloads the page straight away.
    log(createLog('ERROR', 'client.error', { kind, ...details, route: event.route.id }), {
      keepalive: true,
    });
  } catch (e) {
    console.error('Could not log client error:', e, error);
  }
};
