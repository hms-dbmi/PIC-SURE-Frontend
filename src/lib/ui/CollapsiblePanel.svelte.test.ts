// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import CollapsibleHarness from '../../../tests/support/fixtures/CollapsibleHarness.svelte';

// Zag handles a trigger click only once the trigger has focus, as a real click gives it.
async function click(button: HTMLElement) {
  button.focus();
  await fireEvent.click(button);
}

describe('CollapsibleGroup and CollapsiblePanel', () => {
  it('opens and closes a panel from its heading button', async () => {
    render(CollapsibleHarness);
    const first = screen.getByRole('button', { name: 'First' });
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('First body')).toBeVisible();

    await click(first);

    await waitFor(() => expect(first).toHaveAttribute('aria-expanded', 'false'));
  });

  it('keeps several panels open when multiple', async () => {
    render(CollapsibleHarness, { multiple: true });

    await click(screen.getByRole('button', { name: 'Second' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute(
        'aria-expanded',
        'true',
      ),
    );
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true');
  });
});
