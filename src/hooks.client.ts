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

// URLs in error text can carry the page's query or fragment, which hold auth tokens on
// /login/loading. Keeps a trailing :line:col so stack frames stay readable.
const URL_PARAMS = /(https?:\/\/[^\s?#)]*)[?#][^\s)]*?(:\d+:\d+)?(?=[\s)]|$)/gm;

function clean(text: string) {
  return text.replace(URL_PARAMS, '$1$2').slice(0, FIELD_LIMIT);
}

// The logging service keeps only `metadata` from a frontend event, not its top-level
// http_user_agent, so the browser goes here too.
function unexpectedErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: clean(String(error)), user_agent: navigator.userAgent };
  }
  return {
    name: error.name,
    message: clean(error.message),
    stack: error.stack && clean(error.stack),
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
