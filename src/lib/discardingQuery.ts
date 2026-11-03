import { writable } from 'svelte/store';

// Raised by a logout that ends the user's query (a forbidden request, or the user choosing to log
// out) until it has navigated away. The query stores reset when it is lowered. It lives apart from
// them because they import api.ts and User.ts, which raise and lower it.
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
