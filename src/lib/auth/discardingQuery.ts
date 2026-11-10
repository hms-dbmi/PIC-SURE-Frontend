import { writable } from 'svelte/store';

// Raised by a logout that discards the user's query, until that logout has navigated away. It lives
// apart from the query stores because they import api.ts and User.ts, which raise and lower it.
export const discardingQuery = writable(false);

/** Runs `reset` once a raised `discardingQuery` is lowered, after the logout has navigated away. */
export function onQueryDiscarded(reset: () => void) {
  let raised = false;
  return discardingQuery.subscribe((discard) => {
    if (discard) {
      raised = true;
    } else if (raised) {
      raised = false;
      reset();
    }
  });
}
