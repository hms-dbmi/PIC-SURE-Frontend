// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import Dialog from '#lib/ui/dialog/Dialog.svelte';
import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
import AlertDialog from '#lib/ui/dialog/AlertDialog.svelte';
import Drawer from '#lib/ui/dialog/Drawer.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Body</p>' }));
const trigger = createRawSnippet(() => ({ render: () => '<span>Open it</span>' }));

async function pressEscape() {
  // Zag attaches its Escape listener a frame after the dialog opens, and moves focus
  // inside only after that
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  await fireEvent.keyDown(document, { key: 'Escape' });
}

describe('Dialog', () => {
  it('calls onclose when Escape closes it', async () => {
    const onclose = vi.fn();
    render(Dialog, { open: true, title: 'Title', onclose, children });

    await pressEscape();

    await waitFor(() => expect(onclose).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByText('Body')).toBeNull());
  });

  it('calls onclose once when the close button closes it', async () => {
    const onclose = vi.fn();
    render(Dialog, { open: true, title: 'Title', onclose, children });

    await fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText('Body')).toBeNull());
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('is labelled by its title', async () => {
    render(Dialog, { open: true, title: 'Title', children });

    expect(await screen.findByRole('dialog', { name: 'Title' })).toBeTruthy();
  });

  it('opens from its trigger and stays open on Escape when not closeable', async () => {
    const onclose = vi.fn();
    render(Dialog, {
      title: 'Title',
      closeable: false,
      'data-testid': 'thing',
      trigger,
      onclose,
      children,
    });

    await fireEvent.click(screen.getByTestId('thing-trigger'));
    await pressEscape();

    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(screen.getByText('Body')).toBeTruthy();
    expect(onclose).not.toHaveBeenCalled();
  });
});

describe('ConfirmDialog', () => {
  function renderConfirm() {
    const onconfirm = vi.fn();
    const oncancel = vi.fn();
    render(ConfirmDialog, {
      open: true,
      title: 'Sure?',
      confirmLabel: 'Yes',
      cancelLabel: 'No',
      onconfirm,
      oncancel,
      children,
    });
    return { onconfirm, oncancel };
  }

  it('confirms without cancelling', async () => {
    const { onconfirm, oncancel } = renderConfirm();

    await fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    expect(onconfirm).toHaveBeenCalledOnce();
    expect(oncancel).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Body')).toBeNull());
  });

  it('cancels from the cancel button', async () => {
    const { onconfirm, oncancel } = renderConfirm();

    await fireEvent.click(await screen.findByRole('button', { name: 'No' }));

    expect(oncancel).toHaveBeenCalledOnce();
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('cancels on Escape', async () => {
    const { onconfirm, oncancel } = renderConfirm();

    await pressEscape();

    await waitFor(() => expect(oncancel).toHaveBeenCalledOnce());
    expect(onconfirm).not.toHaveBeenCalled();
  });
});

describe('AlertDialog', () => {
  it('is an alertdialog that closes from its acknowledge button', async () => {
    const onclose = vi.fn();
    render(AlertDialog, { open: true, title: 'Oops', acknowledgeLabel: 'Okay', onclose, children });

    expect(await screen.findByRole('alertdialog', { name: 'Oops' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Okay' }));

    expect(onclose).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText('Body')).toBeNull());
  });
});

describe('Drawer', () => {
  it('follows its open prop and calls onclose on Escape', async () => {
    const onclose = vi.fn();
    const { rerender } = render(Drawer, { 'aria-label': 'Details', onclose, children });
    expect(screen.queryByText('Body')).toBeNull();

    await rerender({ open: true });
    expect(await screen.findByRole('dialog', { name: 'Details' })).toBeTruthy();
    await pressEscape();

    await waitFor(() => expect(onclose).toHaveBeenCalledOnce());
  });
});
