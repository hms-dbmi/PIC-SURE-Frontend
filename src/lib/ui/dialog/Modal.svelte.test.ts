// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import Modal from '#lib/ui/dialog/Modal.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Body</p>' }));

function renderOpen() {
  const onclose = vi.fn();
  render(Modal, { open: true, title: 'Title', 'data-testid': 'modal', onclose, children });
  return onclose;
}

describe('Modal', () => {
  it('calls onclose when Escape closes it', async () => {
    const onclose = renderOpen();
    await screen.findByText('Body');

    // Zag attaches its Escape listener a frame after the dialog opens, and moves focus
    // inside only after that
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(onclose).toHaveBeenCalledOnce());
  });

  it('calls onclose once when the close button closes it', async () => {
    const onclose = renderOpen();

    await fireEvent.click(await screen.findByTestId('ui-modal-close'));

    await waitFor(() => expect(screen.queryByText('Body')).toBeNull());
    expect(onclose).toHaveBeenCalledOnce();
  });
});
