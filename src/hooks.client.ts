import type { HandleClientError } from '@sveltejs/kit/hooks';
import { log, createLog } from '#lib/logger.ts';

// Must never throw: an error here would surface as another navigation error.
export const handleError: HandleClientError = ({ kind, error, event }) => {
  if (kind === 'unknown') console.error(error);
  try {
    const details =
      kind === 'unknown'
        ? { message: error instanceof Error ? error.message : String(error) }
        : { status: error.status, message: error.message };
    log(createLog('ERROR', 'client.error', { kind, ...details, route: event.route.id }));
  } catch (e) {
    console.error('Could not log client error:', e, error);
  }
};
