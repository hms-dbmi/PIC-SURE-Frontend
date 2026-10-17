// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';

import Button from '#lib/ui/Button.svelte';
import IconButton from '#lib/ui/IconButton.svelte';
import ConfirmButton from '#lib/ui/ConfirmButton.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', async () => {
    const onclick = vi.fn();
    render(Button, { children: text('Save'), onclick });

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('renders a link for an href, marking only links that leave the app as external', () => {
    render(Button, { children: text('Docs'), href: 'https://example.org/docs' });
    render(Button, { children: text('Explore'), href: '/explorer' });

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('rel', 'external');
    expect(screen.getByRole('link', { name: 'Explore' })).not.toHaveAttribute('rel');
  });

  it('renders a disabled link as a disabled button, since a link cannot be disabled', () => {
    render(Button, { children: text('Explore'), href: '/explorer', disabled: true });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: 'Explore' })).toBeDisabled();
  });
});

describe('IconButton', () => {
  it('names the button with its label and exposes the row shortcut', () => {
    render(IconButton, { icon: 'fa-solid fa-trash', label: 'Delete (d)', shortcut: 'd' });

    const button = screen.getByRole('button', { name: 'Delete (d)' });
    expect(button).toHaveAttribute('title', 'Delete (d)');
    expect(button).toHaveAttribute('data-key', 'd');
  });
});

describe('ConfirmButton', () => {
  it('runs the action only after the dialog is confirmed', async () => {
    const onconfirm = vi.fn();
    render(ConfirmButton, {
      label: 'Revoke',
      title: 'Revoke key?',
      confirmLabel: 'Yes',
      onconfirm,
      children: text('Are you sure?'),
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(onconfirm).not.toHaveBeenCalled();
    await fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    expect(onconfirm).toHaveBeenCalledOnce();
  });
});
