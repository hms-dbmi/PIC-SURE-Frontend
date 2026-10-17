// Shared helpers for component tests. Not a test file - vitest only collects *.test.ts.

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
