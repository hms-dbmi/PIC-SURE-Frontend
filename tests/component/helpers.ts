// Shared helpers for component tests. Not a test file - vitest only collects *.test.ts.

import { error } from '@sveltejs/kit';

// The two columns of OptionsSelectionList, in render order. Reading the checkbox values
// rather than the label text keeps the assertion on what is selectable, not on markup.
export function optionsIn(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Missing container ${containerId}`);
  return Array.from(container.querySelectorAll('input[type="checkbox"]')).map(
    (input) => (input as HTMLInputElement).value,
  );
}

// The HttpError api.ts throws for a failed response, for a mock to reject with.
export function rejection(status: 429 | 500, message: string): unknown {
  try {
    error(status, message);
  } catch (e) {
    return e;
  }
}
