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
      // A navigation that started meanwhile replaced the re-run, and others may replace that one:
      // settle with the last.
      let settled: Promise<void> | null = null;
      while (navigating.complete && navigating.complete !== settled) {
        settled = navigating.complete;
        await settled.catch(() => {});
      }
    },
    currentUrl: () => page.url,
    showAccessUnavailable,
  });
};

// pic-sure-logging's AuditHandler rejects JSON strings over 10KB (maxStringLength).
const FIELD_LIMIT = 4000;

// The logging service keeps only `metadata` from a frontend event, not its top-level
// http_user_agent, so the browser goes here too.
function unexpectedErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error).slice(0, FIELD_LIMIT), user_agent: navigator.userAgent };
  }
  return {
    name: error.name,
    message: error.message.slice(0, FIELD_LIMIT),
    // Frame URLs can carry the page's query or fragment, which hold auth tokens on /login/loading.
    stack: error.stack?.replace(/[?#][^\s)]*?(?=:\d+:\d+|[\s)]|$)/gm, '').slice(0, FIELD_LIMIT),
    user_agent: navigator.userAgent,
  };
}

// SvelteKit requires handleError never to throw.
export const handleError: HandleClientError = ({ kind, error, event }) => {
  if (kind === 'unknown') console.error(error);
  try {
    const details =
      kind === 'unknown'
        ? unexpectedErrorDetails(error)
        : { status: error.status, message: error.message };
    // keepalive: after a client-side 404, SvelteKit reloads the page straight away.
    log(createLog('ERROR', 'client.error', { kind, ...details, route: event.route.id }), {
      keepalive: true,
    });
  } catch (e) {
    console.error('Could not log client error:', e, error);
  }
};
