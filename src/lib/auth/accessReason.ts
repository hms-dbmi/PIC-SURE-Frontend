import { session } from '#lib/auth/session.svelte.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';
import { toaster } from '#lib/ui/toaster.ts';

interface OnArrival {
  /** Whether the reason still describes the session. A reloaded or bookmarked URL may not. */
  applies(): boolean;
  /** The audit event, with the page the visitor was turned away from as `targetUrl`. */
  event?: string;
  details?: Record<string, string>;
  endSession?: boolean;
  toast?: string;
}

// What the page a guard redirects to does about the reason the guard gave. The guards only read
// the session, so this happens on a real arrival and never on a preload.
const ON_ARRIVAL = {
  no_token: {
    applies: () => !session.isLoggedIn,
    event: 'auth.redirect_no_token',
    endSession: true,
  },
  expired: {
    applies: () => session.isLoggedIn && !session.hasValidToken,
    event: 'auth.redirect_token_expired',
    endSession: true,
    toast: 'Your session has timed out. Please log in again.',
  },
  // The session bootstrap has already logged auth.hydrate_failed with the error.
  hydrate_failed: {
    applies: () => session.isLoggedIn && !session.user.privileges,
    endSession: true,
  },
  explore: {
    applies: () => !session.isLoggedIn,
    toast: 'You must be logged in to access Explore.',
  },
  no_privilege: {
    applies: () => session.isLoggedIn,
    event: 'auth.redirect_no_privilege',
    details: { missingPrivilege: 'QUERY' },
  },
} satisfies Record<string, OnArrival>;

/** Why a guard turned the visitor away. It travels in the `reason` parameter of the redirect. */
export type AccessReason = keyof typeof ON_ARRIVAL;

/**
 * Acts on the `reason` a guard put in `url`: writes its audit event, ends the session and shows
 * its toast. The page the visitor was turned away from comes from `redirectTo` (the login page)
 * or `from` (any other page).
 */
export function handleAccessReason(url: URL) {
  const reason = url.searchParams.get('reason');
  if (!reason || !Object.hasOwn(ON_ARRIVAL, reason)) return;
  const arrival: OnArrival = ON_ARRIVAL[reason as AccessReason];
  if (!arrival.applies()) return;

  if (arrival.event) {
    const target = url.searchParams.get('redirectTo') ?? url.searchParams.get('from') ?? '/';
    const targetUrl = new URL(target, url).pathname;
    // Before ending the session, so the event still names the user.
    log(createLog('AUTH', arrival.event, { targetUrl, ...arrival.details }));
  }
  if (arrival.endSession) session.clear();
  if (arrival.toast) toaster.error({ title: arrival.toast });
}
