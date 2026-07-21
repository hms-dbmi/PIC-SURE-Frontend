// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import CodeBlock from '$lib/components/CodeBlock.svelte';

const code = 'print("hello world")';

describe('CodeBlock', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    });
    // happy-dom has no Web Animations API; the Popover's fade transition needs it
    Element.prototype.animate = vi.fn().mockReturnValue({
      cancel: vi.fn(),
      finish: vi.fn(),
      finished: Promise.resolve(),
    });
  });

  it('renders syntax highlighted code', () => {
    const { container } = render(CodeBlock, { code, lang: 'python' });

    const pre = container.querySelector('pre.shiki');
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveTextContent('print("hello world")');
  });

  it('shows a copy button', () => {
    render(CodeBlock, { code, lang: 'python' });

    const button = screen.getByTestId('code-block-copy-btn');
    expect(button).toBeVisible();
    expect(button.querySelector('i')).toHaveClass('fa-copy');
  });

  it('copies the raw code to the clipboard and shows confirmation', async () => {
    render(CodeBlock, { code, lang: 'python' });

    const button = screen.getByTestId('code-block-copy-btn');
    await fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);
    expect(button.querySelector('i')).toHaveClass('fa-square-check');
  });
});
