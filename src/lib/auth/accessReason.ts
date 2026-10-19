import { ACCESS } from '#lib/auth/access.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';
import { toaster } from '#lib/ui/toaster.ts';

/** Why a guard turned the visitor away. It travels in the `reason` parameter of the redirect. */
export type AccessReason = 'no_token' | 'expired' | 'hydrate_failed' | 'explore' | 'no_privilege';

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
const ON_ARRIVAL: Record<AccessReason, OnArrival> = {
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
  // The session bootstrap has already logged auth.hydrate_failed with the error. After a full
  // page load the failure is forgotten, and the token stays for the next attempt.
  hydrate_failed: {
    applies: () => session.isLoggedIn && session.profileFailed,
    endSession: true,
  },
  explore: {
    applies: () => !session.isLoggedIn,
    toast: 'You must be logged in to access Explore.',
  },
  no_privilege: {
    applies: () =>
      session.isLoggedIn &&
      !session.profileFailed &&
      !ACCESS.authorized.anyOf.some((privilege) => session.privileges.includes(privilege)),
    event: 'auth.redirect_no_privilege',
    details: { missingPrivilege: 'QUERY' },
  },
};

/**
 * Acts on the `reason` a guard put in `url`: writes its audit event, ends the session and shows
 * its toast. The page the visitor was turned away from comes from `redirectTo` (the login page)
 * or `from` (any other page).
 */
export async function handleAccessReason(url: URL) {
  const reason = url.searchParams.get('reason');
  if (!reason || !Object.hasOwn(ON_ARRIVAL, reason)) return;
  const arrival = ON_ARRIVAL[reason as AccessReason];
  // In a fresh tab the profile may still be loading, and its privileges aren't known yet.
  await session.bootstrap();
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
