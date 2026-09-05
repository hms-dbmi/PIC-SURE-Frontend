// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import Editor from '$lib/components/editor/Editor.svelte';

describe('Editor', () => {
  it.each([undefined, false])(
    'preserves the existing space normalization default with override %s',
    async (normalizeNonBreakingSpaces) => {
      let content = '<p>Original</p>';
      render(Editor, {
        props: {
          get content() {
            return content;
          },
          set content(value) {
            content = value;
          },
          normalizeNonBreakingSpaces,
        },
      });
      const editor = await screen.findByRole('textbox', { name: 'Rich text editor' });
      editor.innerHTML = '<p>First&nbsp;second</p>';
      await fireEvent.input(editor);

      await waitFor(() =>
        expect(content).toBe(
          normalizeNonBreakingSpaces === false ? '<p>First\u00a0second</p>' : '<p>First second</p>',
        ),
      );
    },
  );

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
