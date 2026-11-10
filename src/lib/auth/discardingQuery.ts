import { writable } from 'svelte/store';

// Raised by a logout that discards the user's query, until that logout has navigated away. It lives
// apart from the query stores because they import the session, which raises and lowers it.
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
