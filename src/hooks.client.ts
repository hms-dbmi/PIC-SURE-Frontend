import type { HandleClientError } from '@sveltejs/kit/hooks';
import { log, createLog } from '#lib/telemetry/logger.ts';

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
