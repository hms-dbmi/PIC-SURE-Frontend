// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

import Editor from '$lib/components/editor/Editor.svelte';

describe('Editor', () => {
  it('keeps the established Terms selector and initializes its rich content', async () => {
    const { container } = render(Editor, {
      content: '<h1>Terms of Service</h1><p>Please <strong>read</strong> carefully.</p>',
      ariaLabel: 'Terms of Service content',
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Terms of Service content' })).toHaveTextContent(
        'Terms of ServicePlease read carefully.',
      );
    });
    expect(container.querySelector('#editor .ql-editor h1')).toHaveTextContent('Terms of Service');
    expect(container.querySelector('#editor .ql-editor strong')).toHaveTextContent('read');
  });

  it('accepts a distinct id for another editor instance', async () => {
    const { container } = render(Editor, {
      id: 'banner-content-editor',
      content: '<p>Banner</p>',
      ariaLabel: 'Banner content',
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Banner content' })).toBeInTheDocument();
    });
    expect(container.querySelector('#banner-content-editor .ql-editor')).toBeInTheDocument();
    expect(container.querySelector('#editor')).not.toBeInTheDocument();
  });
});
