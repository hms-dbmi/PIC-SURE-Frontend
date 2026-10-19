import { session } from '#lib/auth/session.svelte.ts';
import { isToastShowing, toaster } from '#lib/ui/toaster.ts';

export const ACCESS_UNAVAILABLE_MESSAGE =
  'We could not load which studies you have access to. Studies you are authorized for may not ' +
  'be shown, and searching the data dictionary is unavailable. Please log out and log back in. ' +
  'If the problem persists, please contact an administrator.';

/**
 * Idempotent per visible toast, so repeated blocked requests do not stack up alerts. Silent for a
 * user who has yet to accept the terms: PSAMA withholds their access until then, and the terms
 * dialog is already asking them to accept.
 */
export function showAccessUnavailable() {
  if (session.user.acceptedTOS === false || isToastShowing('access-unavailable')) return;
  toaster.error({ id: 'access-unavailable', title: ACCESS_UNAVAILABLE_MESSAGE, closable: true });
}
