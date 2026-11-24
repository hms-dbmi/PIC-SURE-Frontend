// Shared helpers for unit and component tests. Not a test file - vitest only collects *.test.ts.

import { ApiError } from '#lib/api/errors.ts';

// The two columns of OptionsSelectionList, in render order. Reading the checkbox values
// rather than the label text keeps the assertion on what is selectable, not on markup.
export function optionsIn(column: 'available' | 'selected') {
  const testid = `ui-options-selection-list-${column}`;
  const container = document.querySelector(`[data-testid="${testid}"]`);
  if (!container) throw new Error(`Missing container ${testid}`);
  return Array.from(container.querySelectorAll('input[type="checkbox"]')).map(
    (input) => (input as HTMLInputElement).value,
  );
}

export const WAIT_MESSAGE = "You've made too many requests. Try again in 30 seconds.";

// what the API client rejects with on a 429
export function rateLimited() {
  return new ApiError(429, 'rate_limited', {}, WAIT_MESSAGE);
}
